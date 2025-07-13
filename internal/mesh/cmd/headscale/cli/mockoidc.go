package cli

import (
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/oauth2-proxy/mockoidc"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

const (
	errMockOidcClientIDNotDefined     = Error("MOCKOIDC_CLIENT_ID not defined")
	errMockOidcClientSecretNotDefined = Error("MOCKOIDC_CLIENT_SECRET not defined")
	errMockOidcPortNotDefined         = Error("MOCKOIDC_PORT not defined")
	refreshTTL                        = 60 * time.Minute
)

var accessTTL = 2 * time.Minute

func init() {
	rootCmd.AddCommand(mockOidcCmd)
}

var mockOidcCmd = &cobra.Command{
	Use:   "mockoidc",
	Short: "Runs a mock OIDC server for testing",
	Long:  "This internal command runs a OpenID Connect for testing purposes",
	Run: func(cmd *cobra.Command, args []string) {
		err := mockOIDC()
		if err != nil {
			log.Error().Err(err).Msgf("Error running mock OIDC server")
			os.Exit(1)
		}
	},
}

func mockOIDC() error {
	clientID := os.Getenv("MOCKOIDC_CLIENT_ID")
	if clientID == "" {
		return errMockOidcClientIDNotDefined
	}
	clientSecret := os.Getenv("MOCKOIDC_CLIENT_SECRET")
	if clientSecret == "" {
		return errMockOidcClientSecretNotDefined
	}
	addrStr := os.Getenv("MOCKOIDC_ADDR")
	if addrStr == "" {
		return errMockOidcPortNotDefined
	}
	portStr := os.Getenv("MOCKOIDC_PORT")
	if portStr == "" {
		return errMockOidcPortNotDefined
	}
	accessTTLOverride := os.Getenv("MOCKOIDC_ACCESS_TTL")
	if accessTTLOverride != "" {
		newTTL, err := time.ParseDuration(accessTTLOverride)
		if err != nil {
			return err
		}
		accessTTL = newTTL
	}

	userStr := os.Getenv("MOCKOIDC_USERS")
	if userStr == "" {
		return errors.New("MOCKOIDC_USERS not defined")
	}

	var users []mockoidc.MockUser
	err := json.Unmarshal([]byte(userStr), &users)
	if err != nil {
		return fmt.Errorf("unmarshalling users: %w", err)
	}

	log.Info().Interface("users", users).Msg("loading users from JSON")

	log.Info().Msgf("Access token TTL: %s", accessTTL)

	port, err := strconv.Atoi(portStr)
	if err != nil {
		return err
	}

	mock, err := getMockOIDC(clientID, clientSecret, users)
	if err != nil {
		return err
	}

	listener, err := net.Listen("tcp", fmt.Sprintf("%s:%d", addrStr, port))
	if err != nil {
		return err
	}

	err = mock.Start(listener, nil)
	if err != nil {
		return err
	}
	log.Info().Msgf("Mock OIDC server listening on %s", listener.Addr().String())
	log.Info().Msgf("Issuer: %s", mock.Issuer())
	c := make(chan struct{})
	<-c

	return nil
}

func getMockOIDC(clientID string, clientSecret string, users []mockoidc.MockUser) (*mockoidc.MockOIDC, error) {
	keypair, err := mockoidc.NewKeypair(nil)
	if err != nil {
		return nil, err
	}

	userQueue := mockoidc.UserQueue{}

	for _, user := range users {
		userQueue.Push(&user)
	}

	mock := mockoidc.MockOIDC{
		ClientID:                      clientID,
		ClientSecret:                  clientSecret,
		AccessTTL:                     accessTTL,
		RefreshTTL:                    refreshTTL,
		CodeChallengeMethodsSupported: []string{"plain", "S256"},
		Keypair:                       keypair,
		SessionStore:                  mockoidc.NewSessionStore(),
		UserQueue:                     &userQueue,
		ErrorQueue:                    &mockoidc.ErrorQueue{},
	}

	mock.AddMiddleware(func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log.Info().Msgf("Request: %+v", r)
			h.ServeHTTP(w, r)
			if r.Response != nil {
				log.Info().Msgf("Response: %+v", r.Response)
			}
		})
	})

	return &mock, nil
}
