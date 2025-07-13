package db

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/netip"
	"slices"
	"sort"
	"sync"
	"time"

	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
	"tailscale.com/tailcfg"
	"tailscale.com/types/key"
)

const (
	NodeGivenNameHashLength = 8
	NodeGivenNameTrimSize   = 2
)

var (
	ErrNodeNotFound                  = errors.New("node not found")
	ErrNodeRouteIsNotAvailable       = errors.New("route is not available on node")
	ErrNodeNotFoundRegistrationCache = errors.New(
		"node not found in registration cache",
	)
	ErrCouldNotConvertNodeInterface = errors.New("failed to convert node interface")
	ErrDifferentRegisteredUser      = errors.New(
		"node was previously registered with a different user",
	)
)

// ListPeers returns peers of node, regardless of any Policy or if the node is expired.
// If no peer IDs are given, all peers are returned.
// If at least one peer ID is given, only these peer nodes will be returned.
func (hsdb *HSDatabase) ListPeers(nodeID types.NodeID, peerIDs ...types.NodeID) (types.Nodes, error) {
	return Read(hsdb.DB, func(rx *gorm.DB) (types.Nodes, error) {
		return ListPeers(rx, nodeID, peerIDs...)
	})
}

// ListPeers returns peers of node, regardless of any Policy or if the node is expired.
// If no peer IDs are given, all peers are returned.
// If at least one peer ID is given, only these peer nodes will be returned.
func ListPeers(tx *gorm.DB, nodeID types.NodeID, peerIDs ...types.NodeID) (types.Nodes, error) {
	nodes := types.Nodes{}
	if err := tx.
		Preload("AuthKey").
		Preload("AuthKey.User").
		Preload("User").
		Where("id <> ?", nodeID).
		Where(peerIDs).Find(&nodes).Error; err != nil {
		return types.Nodes{}, err
	}

	sort.Slice(nodes, func(i, j int) bool { return nodes[i].ID < nodes[j].ID })

	return nodes, nil
}

// ListNodes queries the database for either all nodes if no parameters are given
// or for the given nodes if at least one node ID is given as parameter.
func (hsdb *HSDatabase) ListNodes(nodeIDs ...types.NodeID) (types.Nodes, error) {
	return Read(hsdb.DB, func(rx *gorm.DB) (types.Nodes, error) {
		return ListNodes(rx, nodeIDs...)
	})
}

// ListNodes queries the database for either all nodes if no parameters are given
// or for the given nodes if at least one node ID is given as parameter.
func ListNodes(tx *gorm.DB, nodeIDs ...types.NodeID) (types.Nodes, error) {
	nodes := types.Nodes{}
	if err := tx.
		Preload("AuthKey").
		Preload("AuthKey.User").
		Preload("User").
		Where(nodeIDs).Find(&nodes).Error; err != nil {
		return nil, err
	}

	return nodes, nil
}

func (hsdb *HSDatabase) ListEphemeralNodes() (types.Nodes, error) {
	return Read(hsdb.DB, func(rx *gorm.DB) (types.Nodes, error) {
		nodes := types.Nodes{}
		if err := rx.Joins("AuthKey").Where(`"AuthKey"."ephemeral" = true`).Find(&nodes).Error; err != nil {
			return nil, err
		}

		return nodes, nil
	})
}

func (hsdb *HSDatabase) getNode(uid types.UserID, name string) (*types.Node, error) {
	return Read(hsdb.DB, func(rx *gorm.DB) (*types.Node, error) {
		return getNode(rx, uid, name)
	})
}

// getNode finds a Node by name and user and returns the Node struct.
func getNode(tx *gorm.DB, uid types.UserID, name string) (*types.Node, error) {
	nodes, err := ListNodesByUser(tx, uid)
	if err != nil {
		return nil, err
	}

	for _, m := range nodes {
		if m.Hostname == name {
			return m, nil
		}
	}

	return nil, ErrNodeNotFound
}

func (hsdb *HSDatabase) GetNodeByID(id types.NodeID) (*types.Node, error) {
	return Read(hsdb.DB, func(rx *gorm.DB) (*types.Node, error) {
		return GetNodeByID(rx, id)
	})
}

// GetNodeByID finds a Node by ID and returns the Node struct.
func GetNodeByID(tx *gorm.DB, id types.NodeID) (*types.Node, error) {
	mach := types.Node{}
	if result := tx.
		Preload("AuthKey").
		Preload("AuthKey.User").
		Preload("User").
		Find(&types.Node{ID: id}).First(&mach); result.Error != nil {
		return nil, result.Error
	}

	return &mach, nil
}

func (hsdb *HSDatabase) GetNodeByMachineKey(machineKey key.MachinePublic) (*types.Node, error) {
	return Read(hsdb.DB, func(rx *gorm.DB) (*types.Node, error) {
		return GetNodeByMachineKey(rx, machineKey)
	})
}

// GetNodeByMachineKey finds a Node by its MachineKey and returns the Node struct.
func GetNodeByMachineKey(
	tx *gorm.DB,
	machineKey key.MachinePublic,
) (*types.Node, error) {
	mach := types.Node{}
	if result := tx.
		Preload("AuthKey").
		Preload("AuthKey.User").
		Preload("User").
		First(&mach, "machine_key = ?", machineKey.String()); result.Error != nil {
		return nil, result.Error
	}

	return &mach, nil
}

func (hsdb *HSDatabase) GetNodeByNodeKey(nodeKey key.NodePublic) (*types.Node, error) {
	return Read(hsdb.DB, func(rx *gorm.DB) (*types.Node, error) {
		return GetNodeByNodeKey(rx, nodeKey)
	})
}

// GetNodeByNodeKey finds a Node by its NodeKey and returns the Node struct.
func GetNodeByNodeKey(
	tx *gorm.DB,
	nodeKey key.NodePublic,
) (*types.Node, error) {
	mach := types.Node{}
	if result := tx.
		Preload("AuthKey").
		Preload("AuthKey.User").
		Preload("User").
		First(&mach, "node_key = ?", nodeKey.String()); result.Error != nil {
		return nil, result.Error
	}

	return &mach, nil
}

func (hsdb *HSDatabase) SetTags(
	nodeID types.NodeID,
	tags []string,
) error {
	return hsdb.Write(func(tx *gorm.DB) error {
		return SetTags(tx, nodeID, tags)
	})
}

// SetTags takes a NodeID and update the forced tags.
// It will overwrite any tags with the new list.
func SetTags(
	tx *gorm.DB,
	nodeID types.NodeID,
	tags []string,
) error {
	if len(tags) == 0 {
		// if no tags are provided, we remove all forced tags
		if err := tx.Model(&types.Node{}).Where("id = ?", nodeID).Update("forced_tags", "[]").Error; err != nil {
			return fmt.Errorf("removing tags: %w", err)
		}

		return nil
	}

	slices.Sort(tags)
	tags = slices.Compact(tags)
	b, err := json.Marshal(tags)
	if err != nil {
		return err
	}

	if err := tx.Model(&types.Node{}).Where("id = ?", nodeID).Update("forced_tags", string(b)).Error; err != nil {
		return fmt.Errorf("updating tags: %w", err)
	}

	return nil
}

// SetTags takes a Node struct pointer and update the forced tags.
func SetApprovedRoutes(
	tx *gorm.DB,
	nodeID types.NodeID,
	routes []netip.Prefix,
) error {
	if len(routes) == 0 {
		// if no routes are provided, we remove all
		if err := tx.Model(&types.Node{}).Where("id = ?", nodeID).Update("approved_routes", "[]").Error; err != nil {
			return fmt.Errorf("removing approved routes: %w", err)
		}

		return nil
	}

	b, err := json.Marshal(routes)
	if err != nil {
		return err
	}

	if err := tx.Model(&types.Node{}).Where("id = ?", nodeID).Update("approved_routes", string(b)).Error; err != nil {
		return fmt.Errorf("updating approved routes: %w", err)
	}

	return nil
}

// SetLastSeen sets a node's last seen field indicating that we
// have recently communicating with this node.
func (hsdb *HSDatabase) SetLastSeen(nodeID types.NodeID, lastSeen time.Time) error {
	return hsdb.Write(func(tx *gorm.DB) error {
		return SetLastSeen(tx, nodeID, lastSeen)
	})
}

// SetLastSeen sets a node's last seen field indicating that we
// have recently communicating with this node.
func SetLastSeen(tx *gorm.DB, nodeID types.NodeID, lastSeen time.Time) error {
	return tx.Model(&types.Node{}).Where("id = ?", nodeID).Update("last_seen", lastSeen).Error
}

// RenameNode takes a Node struct and a new GivenName for the nodes
// and renames it. If the name is not unique, it will return an error.
func RenameNode(tx *gorm.DB,
	nodeID types.NodeID, newName string,
) error {
	err := util.CheckForFQDNRules(
		newName,
	)
	if err != nil {
		return fmt.Errorf("renaming node: %w", err)
	}

	uniq, err := isUniqueName(tx, newName)
	if err != nil {
		return fmt.Errorf("checking if name is unique: %w", err)
	}

	if !uniq {
		return fmt.Errorf("name is not unique: %s", newName)
	}

	if err := tx.Model(&types.Node{}).Where("id = ?", nodeID).Update("given_name", newName).Error; err != nil {
		return fmt.Errorf("failed to rename node in the database: %w", err)
	}

	return nil
}

func (hsdb *HSDatabase) NodeSetExpiry(nodeID types.NodeID, expiry time.Time) error {
	return hsdb.Write(func(tx *gorm.DB) error {
		return NodeSetExpiry(tx, nodeID, expiry)
	})
}

// NodeSetExpiry takes a Node struct and  a new expiry time.
func NodeSetExpiry(tx *gorm.DB,
	nodeID types.NodeID, expiry time.Time,
) error {
	return tx.Model(&types.Node{}).Where("id = ?", nodeID).Update("expiry", expiry).Error
}

func (hsdb *HSDatabase) DeleteNode(node *types.Node) error {
	return hsdb.Write(func(tx *gorm.DB) error {
		return DeleteNode(tx, node)
	})
}

// DeleteNode deletes a Node from the database.
// Caller is responsible for notifying all of change.
func DeleteNode(tx *gorm.DB,
	node *types.Node,
) error {
	// Unscoped causes the node to be fully removed from the database.
	if err := tx.Unscoped().Delete(&types.Node{}, node.ID).Error; err != nil {
		return err
	}

	return nil
}

// DeleteEphemeralNode deletes a Node from the database, note that this method
// will remove it straight, and not notify any changes or consider any routes.
// It is intended for Ephemeral nodes.
func (hsdb *HSDatabase) DeleteEphemeralNode(
	nodeID types.NodeID,
) error {
	return hsdb.Write(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Delete(&types.Node{}, nodeID).Error; err != nil {
			return err
		}
		return nil
	})
}

// HandleNodeFromAuthPath is called from the OIDC or CLI auth path
// with a registrationID to register or reauthenticate a node.
// If the node found in the registration cache is not already registered,
// it will be registered with the user and the node will be removed from the cache.
// If the node is already registered, the expiry will be updated.
// The node, and a boolean indicating if it was a new node or not, will be returned.
func (hsdb *HSDatabase) HandleNodeFromAuthPath(
	registrationID types.RegistrationID,
	userID types.UserID,
	nodeExpiry *time.Time,
	registrationMethod string,
	ipv4 *netip.Addr,
	ipv6 *netip.Addr,
) (*types.Node, bool, error) {
	var newNode bool
	node, err := Write(hsdb.DB, func(tx *gorm.DB) (*types.Node, error) {
		if reg, ok := hsdb.regCache.Get(registrationID); ok {
			if node, _ := GetNodeByNodeKey(tx, reg.Node.NodeKey); node == nil {
				user, err := GetUserByID(tx, userID)
				if err != nil {
					return nil, fmt.Errorf(
						"failed to find user in register node from auth callback, %w",
						err,
					)
				}

				log.Debug().
					Str("registration_id", registrationID.String()).
					Str("username", user.Username()).
					Str("registrationMethod", registrationMethod).
					Str("expiresAt", fmt.Sprintf("%v", nodeExpiry)).
					Msg("Registering node from API/CLI or auth callback")

				// TODO(kradalby): This looks quite wrong? why ID 0?
				// Why not always?
				// Registration of expired node with different user
				if reg.Node.ID != 0 &&
					reg.Node.UserID != user.ID {
					return nil, ErrDifferentRegisteredUser
				}

				reg.Node.UserID = user.ID
				reg.Node.User = *user
				reg.Node.RegisterMethod = registrationMethod

				if nodeExpiry != nil {
					reg.Node.Expiry = nodeExpiry
				}

				node, err := RegisterNode(
					tx,
					reg.Node,
					ipv4, ipv6,
				)

				if err == nil {
					hsdb.regCache.Delete(registrationID)
				}

				// Signal to waiting clients that the machine has been registered.
				select {
				case reg.Registered <- node:
				default:
				}
				close(reg.Registered)

				newNode = true

				return node, err
			} else {
				// If the node is already registered, this is a refresh.
				err := NodeSetExpiry(tx, node.ID, *nodeExpiry)
				if err != nil {
					return nil, err
				}

				return node, nil
			}
		}

		return nil, ErrNodeNotFoundRegistrationCache
	})

	return node, newNode, err
}

func (hsdb *HSDatabase) RegisterNode(node types.Node, ipv4 *netip.Addr, ipv6 *netip.Addr) (*types.Node, error) {
	return Write(hsdb.DB, func(tx *gorm.DB) (*types.Node, error) {
		return RegisterNode(tx, node, ipv4, ipv6)
	})
}

// RegisterNode is executed from the CLI to register a new Node using its MachineKey.
func RegisterNode(tx *gorm.DB, node types.Node, ipv4 *netip.Addr, ipv6 *netip.Addr) (*types.Node, error) {
	log.Debug().
		Str("node", node.Hostname).
		Str("machine_key", node.MachineKey.ShortString()).
		Str("node_key", node.NodeKey.ShortString()).
		Str("user", node.User.Username()).
		Msg("Registering node")

	// If the a new node is registered with the same machine key, to the same user,
	// update the existing node.
	// If the same node is registered again, but to a new user, then that is considered
	// a new node.
	oldNode, _ := GetNodeByMachineKey(tx, node.MachineKey)
	if oldNode != nil && oldNode.UserID == node.UserID {
		node.ID = oldNode.ID
		node.GivenName = oldNode.GivenName
		ipv4 = oldNode.IPv4
		ipv6 = oldNode.IPv6
	}

	// If the node exists and it already has IP(s), we just save it
	// so we store the node.Expire and node.Nodekey that has been set when
	// adding it to the registrationCache
	if node.IPv4 != nil || node.IPv6 != nil {
		if err := tx.Save(&node).Error; err != nil {
			return nil, fmt.Errorf("failed register existing node in the database: %w", err)
		}

		log.Trace().
			Caller().
			Str("node", node.Hostname).
			Str("machine_key", node.MachineKey.ShortString()).
			Str("node_key", node.NodeKey.ShortString()).
			Str("user", node.User.Username()).
			Msg("Node authorized again")

		return &node, nil
	}

	node.IPv4 = ipv4
	node.IPv6 = ipv6

	if node.GivenName == "" {
		givenName, err := ensureUniqueGivenName(tx, node.Hostname)
		if err != nil {
			return nil, fmt.Errorf("failed to ensure unique given name: %w", err)
		}

		node.GivenName = givenName
	}

	if err := tx.Save(&node).Error; err != nil {
		return nil, fmt.Errorf("failed register(save) node in the database: %w", err)
	}

	log.Trace().
		Caller().
		Str("node", node.Hostname).
		Msg("Node registered with the database")

	return &node, nil
}

// NodeSetNodeKey sets the node key of a node and saves it to the database.
func NodeSetNodeKey(tx *gorm.DB, node *types.Node, nodeKey key.NodePublic) error {
	return tx.Model(node).Updates(types.Node{
		NodeKey: nodeKey,
	}).Error
}

func (hsdb *HSDatabase) NodeSetMachineKey(
	node *types.Node,
	machineKey key.MachinePublic,
) error {
	return hsdb.Write(func(tx *gorm.DB) error {
		return NodeSetMachineKey(tx, node, machineKey)
	})
}

// NodeSetMachineKey sets the node key of a node and saves it to the database.
func NodeSetMachineKey(
	tx *gorm.DB,
	node *types.Node,
	machineKey key.MachinePublic,
) error {
	return tx.Model(node).Updates(types.Node{
		MachineKey: machineKey,
	}).Error
}

// NodeSave saves a node object to the database, prefer to use a specific save method rather
// than this. It is intended to be used when we are changing or.
// TODO(kradalby): Remove this func, just use Save.
func NodeSave(tx *gorm.DB, node *types.Node) error {
	return tx.Save(node).Error
}

func generateGivenName(suppliedName string, randomSuffix bool) (string, error) {
	suppliedName = util.ConvertWithFQDNRules(suppliedName)
	if len(suppliedName) > util.LabelHostnameLength {
		return "", types.ErrHostnameTooLong
	}

	if randomSuffix {
		// Trim if a hostname will be longer than 63 chars after adding the hash.
		trimmedHostnameLength := util.LabelHostnameLength - NodeGivenNameHashLength - NodeGivenNameTrimSize
		if len(suppliedName) > trimmedHostnameLength {
			suppliedName = suppliedName[:trimmedHostnameLength]
		}

		suffix, err := util.GenerateRandomStringDNSSafe(NodeGivenNameHashLength)
		if err != nil {
			return "", err
		}

		suppliedName += "-" + suffix
	}

	return suppliedName, nil
}

func isUniqueName(tx *gorm.DB, name string) (bool, error) {
	nodes := types.Nodes{}
	if err := tx.
		Where("given_name = ?", name).Find(&nodes).Error; err != nil {
		return false, err
	}

	return len(nodes) == 0, nil
}

func ensureUniqueGivenName(
	tx *gorm.DB,
	name string,
) (string, error) {
	givenName, err := generateGivenName(name, false)
	if err != nil {
		return "", err
	}

	unique, err := isUniqueName(tx, givenName)
	if err != nil {
		return "", err
	}

	if !unique {
		postfixedName, err := generateGivenName(name, true)
		if err != nil {
			return "", err
		}

		givenName = postfixedName
	}

	return givenName, nil
}

// ExpireExpiredNodes checks for nodes that have expired since the last check
// and returns a time to be used for the next check, a StateUpdate
// containing the expired nodes, and a boolean indicating if any nodes were found.
func ExpireExpiredNodes(tx *gorm.DB,
	lastCheck time.Time,
) (time.Time, types.StateUpdate, bool) {
	// use the time of the start of the function to ensure we
	// dont miss some nodes by returning it _after_ we have
	// checked everything.
	started := time.Now()

	expired := make([]*tailcfg.PeerChange, 0)

	nodes, err := ListNodes(tx)
	if err != nil {
		return time.Unix(0, 0), types.StateUpdate{}, false
	}
	for _, node := range nodes {
		if node.IsExpired() && node.Expiry.After(lastCheck) {
			expired = append(expired, &tailcfg.PeerChange{
				NodeID:    tailcfg.NodeID(node.ID),
				KeyExpiry: node.Expiry,
			})
		}
	}

	if len(expired) > 0 {
		return started, types.UpdatePeerPatch(expired...), true
	}

	return started, types.StateUpdate{}, false
}

// EphemeralGarbageCollector is a garbage collector that will delete nodes after
// a certain amount of time.
// It is used to delete ephemeral nodes that have disconnected and should be
// cleaned up.
type EphemeralGarbageCollector struct {
	mu sync.Mutex

	deleteFunc  func(types.NodeID)
	toBeDeleted map[types.NodeID]*time.Timer

	deleteCh chan types.NodeID
	cancelCh chan struct{}
}

// NewEphemeralGarbageCollector creates a new EphemeralGarbageCollector, it takes
// a deleteFunc that will be called when a node is scheduled for deletion.
func NewEphemeralGarbageCollector(deleteFunc func(types.NodeID)) *EphemeralGarbageCollector {
	return &EphemeralGarbageCollector{
		toBeDeleted: make(map[types.NodeID]*time.Timer),
		deleteCh:    make(chan types.NodeID, 10),
		cancelCh:    make(chan struct{}),
		deleteFunc:  deleteFunc,
	}
}

// Close stops the garbage collector.
func (e *EphemeralGarbageCollector) Close() {
	e.mu.Lock()
	defer e.mu.Unlock()

	// Stop all timers
	for _, timer := range e.toBeDeleted {
		timer.Stop()
	}

	// Close the cancel channel to signal all goroutines to exit
	close(e.cancelCh)
}

// Schedule schedules a node for deletion after the expiry duration.
// If the garbage collector is already closed, this is a no-op.
func (e *EphemeralGarbageCollector) Schedule(nodeID types.NodeID, expiry time.Duration) {
	e.mu.Lock()
	defer e.mu.Unlock()

	// Don't schedule new timers if the garbage collector is already closed
	select {
	case <-e.cancelCh:
		// The cancel channel is closed, meaning the GC is shutting down
		// or already shut down, so we shouldn't schedule anything new
		return
	default:
		// Continue with scheduling
	}

	// If a timer already exists for this node, stop it first
	if oldTimer, exists := e.toBeDeleted[nodeID]; exists {
		oldTimer.Stop()
	}

	timer := time.NewTimer(expiry)
	e.toBeDeleted[nodeID] = timer
	// Start a goroutine to handle the timer completion
	go func() {
		select {
		case <-timer.C:
			// This is to handle the situation where the GC is shutting down and
			// we are trying to schedule a new node for deletion at the same time
			// i.e. We don't want to send to deleteCh if the GC is shutting down
			// So, we try to send to deleteCh, but also watch for cancelCh
			select {
			case e.deleteCh <- nodeID:
				// Successfully sent to deleteCh
			case <-e.cancelCh:
				// GC is shutting down, don't send to deleteCh
				return
			}
		case <-e.cancelCh:
			// If the GC is closed, exit the goroutine
			return
		}
	}()
}

// Cancel cancels the deletion of a node.
func (e *EphemeralGarbageCollector) Cancel(nodeID types.NodeID) {
	e.mu.Lock()
	defer e.mu.Unlock()

	if timer, ok := e.toBeDeleted[nodeID]; ok {
		timer.Stop()
		delete(e.toBeDeleted, nodeID)
	}
}

// Start starts the garbage collector.
func (e *EphemeralGarbageCollector) Start() {
	for {
		select {
		case <-e.cancelCh:
			return
		case nodeID := <-e.deleteCh:
			e.mu.Lock()
			delete(e.toBeDeleted, nodeID)
			e.mu.Unlock()

			go e.deleteFunc(nodeID)
		}
	}
}
