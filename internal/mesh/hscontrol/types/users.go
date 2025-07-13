package types

import (
	"cmp"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/mail"
	"net/url"
	"strconv"
	"strings"

	v1 "github.com/juanfont/headscale/gen/go/headscale/v1"
	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/rs/zerolog/log"
	"google.golang.org/protobuf/types/known/timestamppb"
	"gorm.io/gorm"
	"tailscale.com/tailcfg"
)

type UserID uint64

type Users []User

func (u Users) String() string {
	var sb strings.Builder
	sb.WriteString("[ ")
	for _, user := range u {
		fmt.Fprintf(&sb, "%d: %s, ", user.ID, user.Name)
	}
	sb.WriteString(" ]")

	return sb.String()
}

// User is the way Headscale implements the concept of users in Tailscale
//
// At the end of the day, users in Tailscale are some kind of 'bubbles' or users
// that contain our machines.
type User struct {
	gorm.Model
	// The index `idx_name_provider_identifier` is to enforce uniqueness
	// between Name and ProviderIdentifier. This ensures that
	// you can have multiple users with the same name in OIDC,
	// but not if you only run with CLI users.

	// Name (username) for the user, is used if email is empty
	// Should not be used, please use Username().
	// It is unique if ProviderIdentifier is not set.
	Name string

	// Typically the full name of the user
	DisplayName string

	// Email of the user
	// Should not be used, please use Username().
	Email string

	// ProviderIdentifier is a unique or not set identifier of the
	// user from OIDC. It is the combination of `iss`
	// and `sub` claim in the OIDC token.
	// It is unique if set.
	// It is unique together with Name.
	ProviderIdentifier sql.NullString

	// Provider is the origin of the user account,
	// same as RegistrationMethod, without authkey.
	Provider string

	ProfilePicURL string
}

func (u *User) StringID() string {
	if u == nil {
		return ""
	}
	return strconv.FormatUint(uint64(u.ID), 10)
}

// Username is the main way to get the username of a user,
// it will return the email if it exists, the name if it exists,
// the OIDCIdentifier if it exists, and the ID if nothing else exists.
// Email and OIDCIdentifier will be set when the user has headscale
// enabled with OIDC, which means that there is a domain involved which
// should be used throughout headscale, in information returned to the
// user and the Policy engine.
func (u *User) Username() string {
	return cmp.Or(
		u.Email,
		u.Name,
		u.ProviderIdentifier.String,
		u.StringID(),
	)
}

// Display returns the DisplayName if it exists, otherwise
// it will return the Username.
func (u *User) Display() string {
	return cmp.Or(u.DisplayName, u.Username())
}

// TODO(kradalby): See if we can fill in Gravatar here.
func (u *User) profilePicURL() string {
	return u.ProfilePicURL
}

func (u *User) TailscaleUser() *tailcfg.User {
	user := tailcfg.User{
		ID:            tailcfg.UserID(u.ID),
		DisplayName:   u.Display(),
		ProfilePicURL: u.profilePicURL(),
		Created:       u.CreatedAt,
	}

	return &user
}

func (u *User) TailscaleLogin() *tailcfg.Login {
	login := tailcfg.Login{
		ID:            tailcfg.LoginID(u.ID),
		Provider:      u.Provider,
		LoginName:     u.Username(),
		DisplayName:   u.Display(),
		ProfilePicURL: u.profilePicURL(),
	}

	return &login
}

func (u *User) TailscaleUserProfile() tailcfg.UserProfile {
	return tailcfg.UserProfile{
		ID:            tailcfg.UserID(u.ID),
		LoginName:     u.Username(),
		DisplayName:   u.Display(),
		ProfilePicURL: u.profilePicURL(),
	}
}

func (u *User) Proto() *v1.User {
	return &v1.User{
		Id:            uint64(u.ID),
		Name:          u.Name,
		CreatedAt:     timestamppb.New(u.CreatedAt),
		DisplayName:   u.DisplayName,
		Email:         u.Email,
		ProviderId:    u.ProviderIdentifier.String,
		Provider:      u.Provider,
		ProfilePicUrl: u.ProfilePicURL,
	}
}

// JumpCloud returns a JSON where email_verified is returned as a
// string "true" or "false" instead of a boolean.
// This maps bool to a specific type with a custom unmarshaler to
// ensure we can decode it from a string.
// https://github.com/juanfont/headscale/issues/2293
type FlexibleBoolean bool

func (bit *FlexibleBoolean) UnmarshalJSON(data []byte) error {
	var val any
	err := json.Unmarshal(data, &val)
	if err != nil {
		return fmt.Errorf("could not unmarshal data: %w", err)
	}

	switch v := val.(type) {
	case bool:
		*bit = FlexibleBoolean(v)
	case string:
		pv, err := strconv.ParseBool(v)
		if err != nil {
			return fmt.Errorf("could not parse %s as boolean: %w", v, err)
		}
		*bit = FlexibleBoolean(pv)

	default:
		return fmt.Errorf("could not parse %v as boolean", v)
	}

	return nil
}

type OIDCClaims struct {
	// Sub is the user's unique identifier at the provider.
	Sub string `json:"sub"`
	Iss string `json:"iss"`

	// Name is the user's full name.
	Name              string          `json:"name,omitempty"`
	Groups            []string        `json:"groups,omitempty"`
	Email             string          `json:"email,omitempty"`
	EmailVerified     FlexibleBoolean `json:"email_verified,omitempty"`
	ProfilePictureURL string          `json:"picture,omitempty"`
	Username          string          `json:"preferred_username,omitempty"`
}

// Identifier returns a unique identifier string combining the Iss and Sub claims.
// The format depends on whether Iss is a URL or not:
// - For URLs: Joins the URL and sub path (e.g., "https://example.com/sub")
// - For non-URLs: Joins with a slash (e.g., "oidc/sub")
// - For empty Iss: Returns just "sub"
// - For empty Sub: Returns just the Issuer
// - For both empty: Returns empty string
//
// The result is cleaned using CleanIdentifier() to ensure consistent formatting.
func (c *OIDCClaims) Identifier() string {
	// Handle empty components special cases
	if c.Iss == "" && c.Sub == "" {
		return ""
	}
	if c.Iss == "" {
		return CleanIdentifier(c.Sub)
	}
	if c.Sub == "" {
		return CleanIdentifier(c.Iss)
	}

	// We'll use the raw values and let CleanIdentifier handle all the whitespace
	issuer := c.Iss
	subject := c.Sub

	var result string
	// Try to parse as URL to handle URL joining correctly
	if u, err := url.Parse(issuer); err == nil && u.Scheme != "" {
		// For URLs, use proper URL path joining
		if joined, err := url.JoinPath(issuer, subject); err == nil {
			result = joined
		}
	}

	// If URL joining failed or issuer wasn't a URL, do simple string join
	if result == "" {
		// Default case: simple string joining with slash
		issuer = strings.TrimSuffix(issuer, "/")
		subject = strings.TrimPrefix(subject, "/")
		result = issuer + "/" + subject
	}

	// Clean the result and return it
	return CleanIdentifier(result)
}

// CleanIdentifier cleans a potentially malformed identifier by removing double slashes
// while preserving protocol specifications like http://. This function will:
// - Trim all whitespace from the beginning and end of the identifier
// - Remove whitespace within path segments
// - Preserve the scheme (http://, https://, etc.) for URLs
// - Remove any duplicate slashes in the path
// - Remove empty path segments
// - For non-URL identifiers, it joins non-empty segments with a single slash
// - Returns empty string for identifiers with only slashes
// - Normalize URL schemes to lowercase.
func CleanIdentifier(identifier string) string {
	if identifier == "" {
		return identifier
	}

	// Trim leading/trailing whitespace
	identifier = strings.TrimSpace(identifier)

	// Handle URLs with schemes
	u, err := url.Parse(identifier)
	if err == nil && u.Scheme != "" {
		// Clean path by removing empty segments and whitespace within segments
		parts := strings.FieldsFunc(u.Path, func(c rune) bool { return c == '/' })
		for i, part := range parts {
			parts[i] = strings.TrimSpace(part)
		}
		// Remove empty parts after trimming
		cleanParts := make([]string, 0, len(parts))
		for _, part := range parts {
			if part != "" {
				cleanParts = append(cleanParts, part)
			}
		}

		if len(cleanParts) == 0 {
			u.Path = ""
		} else {
			u.Path = "/" + strings.Join(cleanParts, "/")
		}
		// Ensure scheme is lowercase
		u.Scheme = strings.ToLower(u.Scheme)

		return u.String()
	}

	// Handle non-URL identifiers
	parts := strings.FieldsFunc(identifier, func(c rune) bool { return c == '/' })
	// Clean whitespace from each part
	cleanParts := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			cleanParts = append(cleanParts, trimmed)
		}
	}
	if len(cleanParts) == 0 {
		return ""
	}

	return strings.Join(cleanParts, "/")
}

type OIDCUserInfo struct {
	Sub               string          `json:"sub"`
	Name              string          `json:"name"`
	GivenName         string          `json:"given_name"`
	FamilyName        string          `json:"family_name"`
	PreferredUsername string          `json:"preferred_username"`
	Email             string          `json:"email"`
	EmailVerified     FlexibleBoolean `json:"email_verified,omitempty"`
	Picture           string          `json:"picture"`
}

// FromClaim overrides a User from OIDC claims.
// All fields will be updated, except for the ID.
func (u *User) FromClaim(claims *OIDCClaims) {
	err := util.ValidateUsername(claims.Username)
	if err == nil {
		u.Name = claims.Username
	} else {
		log.Debug().Err(err).Msgf("Username %s is not valid", claims.Username)
	}

	if claims.EmailVerified {
		_, err = mail.ParseAddress(claims.Email)
		if err == nil {
			u.Email = claims.Email
		}
	}

	// Get provider identifier
	identifier := claims.Identifier()
	// Ensure provider identifier always has a leading slash for backward compatibility
	if claims.Iss == "" && !strings.HasPrefix(identifier, "/") {
		identifier = "/" + identifier
	}
	u.ProviderIdentifier = sql.NullString{String: identifier, Valid: true}
	u.DisplayName = claims.Name
	u.ProfilePicURL = claims.ProfilePictureURL
	u.Provider = util.RegisterMethodOIDC
}
