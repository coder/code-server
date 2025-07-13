package hscontrol

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/juanfont/headscale/hscontrol/types"
	"gorm.io/gorm"
	"tailscale.com/tailcfg"
	"tailscale.com/types/key"
	"tailscale.com/types/ptr"
)

type AuthProvider interface {
	RegisterHandler(http.ResponseWriter, *http.Request)
	AuthURL(types.RegistrationID) string
}

func (h *Headscale) handleRegister(
	ctx context.Context,
	regReq tailcfg.RegisterRequest,
	machineKey key.MachinePublic,
) (*tailcfg.RegisterResponse, error) {
	node, err := h.state.GetNodeByNodeKey(regReq.NodeKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("looking up node in database: %w", err)
	}

	if node != nil {
		resp, err := h.handleExistingNode(node, regReq, machineKey)
		if err != nil {
			return nil, fmt.Errorf("handling existing node: %w", err)
		}

		return resp, nil
	}

	if regReq.Followup != "" {
		return h.waitForFollowup(ctx, regReq)
	}

	if regReq.Auth != nil && regReq.Auth.AuthKey != "" {
		resp, err := h.handleRegisterWithAuthKey(regReq, machineKey)
		if err != nil {
			return nil, fmt.Errorf("handling register with auth key: %w", err)
		}

		return resp, nil
	}

	resp, err := h.handleRegisterInteractive(regReq, machineKey)
	if err != nil {
		return nil, fmt.Errorf("handling register interactive: %w", err)
	}

	return resp, nil
}

func (h *Headscale) handleExistingNode(
	node *types.Node,
	regReq tailcfg.RegisterRequest,
	machineKey key.MachinePublic,
) (*tailcfg.RegisterResponse, error) {
	if node.MachineKey != machineKey {
		return nil, NewHTTPError(http.StatusUnauthorized, "node exist with different machine key", nil)
	}

	expired := node.IsExpired()
	if !expired && !regReq.Expiry.IsZero() {
		requestExpiry := regReq.Expiry

		// The client is trying to extend their key, this is not allowed.
		if requestExpiry.After(time.Now()) {
			return nil, NewHTTPError(http.StatusBadRequest, "extending key is not allowed", nil)
		}

		// If the request expiry is in the past, we consider it a logout.
		if requestExpiry.Before(time.Now()) {
			if node.IsEphemeral() {
				policyChanged, err := h.state.DeleteNode(node)
				if err != nil {
					return nil, fmt.Errorf("deleting ephemeral node: %w", err)
				}

				// Send policy update notifications if needed
				if policyChanged {
					ctx := types.NotifyCtx(context.Background(), "auth-logout-ephemeral-policy", "na")
					h.nodeNotifier.NotifyAll(ctx, types.UpdateFull())
				} else {
					ctx := types.NotifyCtx(context.Background(), "logout-ephemeral", "na")
					h.nodeNotifier.NotifyAll(ctx, types.UpdatePeerRemoved(node.ID))
				}

				return nil, nil
			}
		}

		n, policyChanged, err := h.state.SetNodeExpiry(node.ID, requestExpiry)
		if err != nil {
			return nil, fmt.Errorf("setting node expiry: %w", err)
		}

		// Send policy update notifications if needed
		if policyChanged {
			ctx := types.NotifyCtx(context.Background(), "auth-expiry-policy", "na")
			h.nodeNotifier.NotifyAll(ctx, types.UpdateFull())
		} else {
			ctx := types.NotifyCtx(context.Background(), "logout-expiry", "na")
			h.nodeNotifier.NotifyWithIgnore(ctx, types.UpdateExpire(node.ID, requestExpiry), node.ID)
		}

		return nodeToRegisterResponse(n), nil
	}

	return nodeToRegisterResponse(node), nil
}

func nodeToRegisterResponse(node *types.Node) *tailcfg.RegisterResponse {
	return &tailcfg.RegisterResponse{
		// TODO(kradalby): Only send for user-owned nodes
		// and not tagged nodes when tags is working.
		User:           *node.User.TailscaleUser(),
		Login:          *node.User.TailscaleLogin(),
		NodeKeyExpired: node.IsExpired(),

		// Headscale does not implement the concept of machine authorization
		// so we always return true here.
		// Revisit this if #2176 gets implemented.
		MachineAuthorized: true,
	}
}

func (h *Headscale) waitForFollowup(
	ctx context.Context,
	regReq tailcfg.RegisterRequest,
) (*tailcfg.RegisterResponse, error) {
	fu, err := url.Parse(regReq.Followup)
	if err != nil {
		return nil, NewHTTPError(http.StatusUnauthorized, "invalid followup URL", err)
	}

	followupReg, err := types.RegistrationIDFromString(strings.ReplaceAll(fu.Path, "/register/", ""))
	if err != nil {
		return nil, NewHTTPError(http.StatusUnauthorized, "invalid registration ID", err)
	}

	if reg, ok := h.state.GetRegistrationCacheEntry(followupReg); ok {
		select {
		case <-ctx.Done():
			return nil, NewHTTPError(http.StatusUnauthorized, "registration timed out", err)
		case node := <-reg.Registered:
			if node == nil {
				return nil, NewHTTPError(http.StatusUnauthorized, "node not found", nil)
			}
			return nodeToRegisterResponse(node), nil
		}
	}

	return nil, NewHTTPError(http.StatusNotFound, "followup registration not found", nil)
}

func (h *Headscale) handleRegisterWithAuthKey(
	regReq tailcfg.RegisterRequest,
	machineKey key.MachinePublic,
) (*tailcfg.RegisterResponse, error) {
	node, changed, err := h.state.HandleNodeFromPreAuthKey(
		regReq,
		machineKey,
	)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, NewHTTPError(http.StatusUnauthorized, "invalid pre auth key", nil)
		}
		var perr types.PAKError
		if errors.As(err, &perr) {
			return nil, NewHTTPError(http.StatusUnauthorized, perr.Error(), nil)
		}

		return nil, err
	}

	// This is a bit of a back and forth, but we have a bit of a chicken and egg
	// dependency here.
	// Because the way the policy manager works, we need to have the node
	// in the database, then add it to the policy manager and then we can
	// approve the route. This means we get this dance where the node is
	// first added to the database, then we add it to the policy manager via
	// nodesChangedHook and then we can auto approve the routes.
	// As that only approves the struct object, we need to save it again and
	// ensure we send an update.
	// This works, but might be another good candidate for doing some sort of
	// eventbus.
	routesChanged := h.state.AutoApproveRoutes(node)
	if _, _, err := h.state.SaveNode(node); err != nil {
		return nil, fmt.Errorf("saving auto approved routes to node: %w", err)
	}

	if routesChanged {
		ctx := types.NotifyCtx(context.Background(), "node updated", node.Hostname)
		h.nodeNotifier.NotifyAll(ctx, types.UpdatePeerChanged(node.ID))
	} else if changed {
		ctx := types.NotifyCtx(context.Background(), "node created", node.Hostname)
		h.nodeNotifier.NotifyAll(ctx, types.UpdateFull())
	} else {
		// Existing node re-registering without route changes
		// Still need to notify peers about the node being active again
		// Use UpdateFull to ensure all peers get complete peer maps
		ctx := types.NotifyCtx(context.Background(), "node re-registered", node.Hostname)
		h.nodeNotifier.NotifyAll(ctx, types.UpdateFull())
	}

	return &tailcfg.RegisterResponse{
		MachineAuthorized: true,
		NodeKeyExpired:    node.IsExpired(),
		User:              *node.User.TailscaleUser(),
		Login:             *node.User.TailscaleLogin(),
	}, nil
}

func (h *Headscale) handleRegisterInteractive(
	regReq tailcfg.RegisterRequest,
	machineKey key.MachinePublic,
) (*tailcfg.RegisterResponse, error) {
	registrationId, err := types.NewRegistrationID()
	if err != nil {
		return nil, fmt.Errorf("generating registration ID: %w", err)
	}

	nodeToRegister := types.RegisterNode{
		Node: types.Node{
			Hostname:   regReq.Hostinfo.Hostname,
			MachineKey: machineKey,
			NodeKey:    regReq.NodeKey,
			Hostinfo:   regReq.Hostinfo,
			LastSeen:   ptr.To(time.Now()),
		},
		Registered: make(chan *types.Node),
	}

	if !regReq.Expiry.IsZero() {
		nodeToRegister.Node.Expiry = &regReq.Expiry
	}

	h.state.SetRegistrationCacheEntry(
		registrationId,
		nodeToRegister,
	)

	return &tailcfg.RegisterResponse{
		AuthURL: h.authProvider.AuthURL(registrationId),
	}, nil
}
