package types

import (
	"database/sql"
	"encoding/json"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/stretchr/testify/assert"
)

func TestUnmarshallOIDCClaims(t *testing.T) {
	tests := []struct {
		name    string
		jsonstr string
		want    OIDCClaims
	}{
		{
			name: "normal-bool",
			jsonstr: `
{
  "sub": "test",
  "email": "test@test.no",
  "email_verified": true
}
			`,
			want: OIDCClaims{
				Sub:           "test",
				Email:         "test@test.no",
				EmailVerified: true,
			},
		},
		{
			name: "string-bool-true",
			jsonstr: `
{
  "sub": "test2",
  "email": "test2@test.no",
  "email_verified": "true"
}
			`,
			want: OIDCClaims{
				Sub:           "test2",
				Email:         "test2@test.no",
				EmailVerified: true,
			},
		},
		{
			name: "string-bool-false",
			jsonstr: `
{
  "sub": "test3",
  "email": "test3@test.no",
  "email_verified": "false"
}
			`,
			want: OIDCClaims{
				Sub:           "test3",
				Email:         "test3@test.no",
				EmailVerified: false,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var got OIDCClaims
			if err := json.Unmarshal([]byte(tt.jsonstr), &got); err != nil {
				t.Errorf("UnmarshallOIDCClaims() error = %v", err)
				return
			}
			if diff := cmp.Diff(got, tt.want); diff != "" {
				t.Errorf("UnmarshallOIDCClaims() mismatch (-want +got):\n%s", diff)
			}
		})
	}
}

func TestOIDCClaimsIdentifier(t *testing.T) {
	tests := []struct {
		name     string
		iss      string
		sub      string
		expected string
	}{
		{
			name:     "standard URL with trailing slash",
			iss:      "https://oidc.example.com/",
			sub:      "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
			expected: "https://oidc.example.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
		},
		{
			name:     "standard URL without trailing slash",
			iss:      "https://oidc.example.com",
			sub:      "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
			expected: "https://oidc.example.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
		},
		{
			name:     "standard URL with uppercase protocol",
			iss:      "HTTPS://oidc.example.com/",
			sub:      "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
			expected: "https://oidc.example.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
		},
		{
			name:     "standard URL with path and trailing slash",
			iss:      "https://login.microsoftonline.com/v2.0/",
			sub:      "I-70OQnj3TogrNSfkZQqB3f7dGwyBWSm1dolHNKrMzQ",
			expected: "https://login.microsoftonline.com/v2.0/I-70OQnj3TogrNSfkZQqB3f7dGwyBWSm1dolHNKrMzQ",
		},
		{
			name:     "standard URL with path without trailing slash",
			iss:      "https://login.microsoftonline.com/v2.0",
			sub:      "I-70OQnj3TogrNSfkZQqB3f7dGwyBWSm1dolHNKrMzQ",
			expected: "https://login.microsoftonline.com/v2.0/I-70OQnj3TogrNSfkZQqB3f7dGwyBWSm1dolHNKrMzQ",
		},
		{
			name:     "non-URL identifier with slash",
			iss:      "oidc",
			sub:      "sub",
			expected: "oidc/sub",
		},
		{
			name:     "non-URL identifier with trailing slash",
			iss:      "oidc/",
			sub:      "sub",
			expected: "oidc/sub",
		},
		{
			name:     "subject with slash",
			iss:      "oidc/",
			sub:      "sub/",
			expected: "oidc/sub",
		},
		{
			name:     "whitespace",
			iss:      "   oidc/   ",
			sub:      "   sub   ",
			expected: "oidc/sub",
		},
		{
			name:     "newline",
			iss:      "\noidc/\n",
			sub:      "\nsub\n",
			expected: "oidc/sub",
		},
		{
			name:     "tab",
			iss:      "\toidc/\t",
			sub:      "\tsub\t",
			expected: "oidc/sub",
		},
		{
			name:     "empty issuer",
			iss:      "",
			sub:      "sub",
			expected: "sub",
		},
		{
			name:     "empty subject",
			iss:      "https://oidc.example.com",
			sub:      "",
			expected: "https://oidc.example.com",
		},
		{
			name:     "both empty",
			iss:      "",
			sub:      "",
			expected: "",
		},
		{
			name:     "URL with double slash",
			iss:      "https://login.microsoftonline.com//v2.0",
			sub:      "I-70OQnj3TogrNSfkZQqB3f7dGwyBWSm1dolHNKrMzQ",
			expected: "https://login.microsoftonline.com/v2.0/I-70OQnj3TogrNSfkZQqB3f7dGwyBWSm1dolHNKrMzQ",
		},
		{
			name:     "FTP URL protocol",
			iss:      "ftp://example.com/directory",
			sub:      "resource",
			expected: "ftp://example.com/directory/resource",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			claims := OIDCClaims{
				Iss: tt.iss,
				Sub: tt.sub,
			}
			result := claims.Identifier()
			assert.Equal(t, tt.expected, result)
			if diff := cmp.Diff(tt.expected, result); diff != "" {
				t.Errorf("Identifier() mismatch (-want +got):\n%s", diff)
			}

			// Now clean the identifier and verify it's still the same
			cleaned := CleanIdentifier(result)

			// Double-check with cmp.Diff for better error messages
			if diff := cmp.Diff(tt.expected, cleaned); diff != "" {
				t.Errorf("CleanIdentifier(Identifier()) mismatch (-want +got):\n%s", diff)
			}
		})
	}
}

func TestCleanIdentifier(t *testing.T) {
	tests := []struct {
		name       string
		identifier string
		expected   string
	}{
		{
			name:       "empty identifier",
			identifier: "",
			expected:   "",
		},
		{
			name:       "simple identifier",
			identifier: "oidc/sub",
			expected:   "oidc/sub",
		},
		{
			name:       "double slashes in the middle",
			identifier: "oidc//sub",
			expected:   "oidc/sub",
		},
		{
			name:       "trailing slash",
			identifier: "oidc/sub/",
			expected:   "oidc/sub",
		},
		{
			name:       "multiple double slashes",
			identifier: "oidc//sub///id//",
			expected:   "oidc/sub/id",
		},
		{
			name:       "HTTP URL with proper scheme",
			identifier: "http://example.com/path",
			expected:   "http://example.com/path",
		},
		{
			name:       "HTTP URL with double slashes in path",
			identifier: "http://example.com//path///resource",
			expected:   "http://example.com/path/resource",
		},
		{
			name:       "HTTPS URL with empty segments",
			identifier: "https://example.com///path//",
			expected:   "https://example.com/path",
		},
		{
			name:       "URL with double slashes in domain",
			identifier: "https://login.microsoftonline.com//v2.0/I-70OQnj3TogrNSfkZQqB3f7dGwyBWSm1dolHNKrMzQ",
			expected:   "https://login.microsoftonline.com/v2.0/I-70OQnj3TogrNSfkZQqB3f7dGwyBWSm1dolHNKrMzQ",
		},
		{
			name:       "FTP URL with double slashes",
			identifier: "ftp://example.com//resource//",
			expected:   "ftp://example.com/resource",
		},
		{
			name:       "Just slashes",
			identifier: "///",
			expected:   "",
		},
		{
			name:       "Leading slash without URL",
			identifier: "/path//to///resource",
			expected:   "path/to/resource",
		},
		{
			name:       "Non-standard protocol",
			identifier: "ldap://example.org//path//to//resource",
			expected:   "ldap://example.org/path/to/resource",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CleanIdentifier(tt.identifier)
			assert.Equal(t, tt.expected, result)
			if diff := cmp.Diff(tt.expected, result); diff != "" {
				t.Errorf("CleanIdentifier() mismatch (-want +got):\n%s", diff)
			}
		})
	}
}

func TestOIDCClaimsJSONToUser(t *testing.T) {
	tests := []struct {
		name    string
		jsonstr string
		want    User
	}{
		{
			name: "normal-bool",
			jsonstr: `
{
  "sub": "test",
  "email": "test@test.no",
  "email_verified": true
}
			`,
			want: User{
				Provider: util.RegisterMethodOIDC,
				Email:    "test@test.no",
				ProviderIdentifier: sql.NullString{
					String: "/test",
					Valid:  true,
				},
			},
		},
		{
			name: "string-bool-true",
			jsonstr: `
{
  "sub": "test2",
  "email": "test2@test.no",
  "email_verified": "true"
}
			`,
			want: User{
				Provider: util.RegisterMethodOIDC,
				Email:    "test2@test.no",
				ProviderIdentifier: sql.NullString{
					String: "/test2",
					Valid:  true,
				},
			},
		},
		{
			name: "string-bool-false",
			jsonstr: `
{
  "sub": "test3",
  "email": "test3@test.no",
  "email_verified": "false"
}
			`,
			want: User{
				Provider: util.RegisterMethodOIDC,
				ProviderIdentifier: sql.NullString{
					String: "/test3",
					Valid:  true,
				},
			},
		},
		{
			// From https://github.com/juanfont/headscale/issues/2333
			name: "okta-oidc-claim-20250121",
			jsonstr: `
{
  "sub": "00u7dr4qp7XXXXXXXXXX",
  "name": "Tim Horton",
  "email": "tim.horton@company.com",
  "ver": 1,
  "iss": "https://sso.company.com/oauth2/default",
  "aud": "0oa8neto4tXXXXXXXXXX",
  "iat": 1737455152,
  "exp": 1737458752,
  "jti": "ID.zzJz93koTunMKv5Bq-XXXXXXXXXXXXXXXXXXXXXXXXX",
  "amr": [
    "pwd"
  ],
  "idp": "00o42r3s2cXXXXXXXX",
  "nonce": "nonce",
  "preferred_username": "tim.horton@company.com",
  "auth_time": 1000,
  "at_hash": "preview_at_hash"
}
			`,
			want: User{
				Provider:    util.RegisterMethodOIDC,
				DisplayName: "Tim Horton",
				Name:        "tim.horton@company.com",
				ProviderIdentifier: sql.NullString{
					String: "https://sso.company.com/oauth2/default/00u7dr4qp7XXXXXXXXXX",
					Valid:  true,
				},
			},
		},
		{
			// From https://github.com/juanfont/headscale/issues/2333
			name: "okta-oidc-claim-20250121",
			jsonstr: `
{
  "aud": "79xxxxxx-xxxx-xxxx-xxxx-892146xxxxxx",
  "iss": "https://login.microsoftonline.com//v2.0",
  "iat": 1737346441,
  "nbf": 1737346441,
  "exp": 1737350341,
  "aio": "AWQAm/8ZAAAABKne9EWr6ygVO2DbcRmoPIpRM819qqlP/mmK41AAWv/C2tVkld4+znbG8DaXFdLQa9jRUzokvsT7rt9nAT6Fg7QC+/ecDWsF5U+QX11f9Ox7ZkK4UAIWFcIXpuZZvRS7",
  "email": "user@domain.com",
  "name": "XXXXXX XXXX",
  "oid": "54c2323d-5052-4130-9588-ad751909003f",
  "preferred_username": "user@domain.com",
  "rh": "1.AXUAXdg0Rfc11UifLDJv67ChfSluoXmD9z1EmK-JIUYuSK9cAQl1AA.",
  "sid": "5250a0a2-0b4e-4e68-8652-b4e97866411d",
  "sub": "I-70OQnj3TogrNSfkZQqB3f7dGwyBWSm1dolHNKrMzQ",
  "tid": "<redacted>",
  "uti": "zAuXeEtMM0GwcTAcOsBZAA",
  "ver": "2.0"
}
			`,
			want: User{
				Provider:    util.RegisterMethodOIDC,
				DisplayName: "XXXXXX XXXX",
				Name:        "user@domain.com",
				ProviderIdentifier: sql.NullString{
					String: "https://login.microsoftonline.com/v2.0/I-70OQnj3TogrNSfkZQqB3f7dGwyBWSm1dolHNKrMzQ",
					Valid:  true,
				},
			},
		},
		{
			// From https://github.com/juanfont/headscale/issues/2333
			name: "casby-oidc-claim-20250513",
			jsonstr: `
			{
  "sub": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "iss": "https://oidc.example.com/",
  "aud": "xxxxxxxxxxxx",
  "preferred_username": "user001",
  "name": "User001",
  "email": "user001@example.com",
  "email_verified": true,
  "picture": "https://cdn.casbin.org/img/casbin.svg",
  "groups": [
    "org1/department1",
    "org1/department2"
  ]
}
			`,
			want: User{
				Provider:    util.RegisterMethodOIDC,
				Name:        "user001",
				DisplayName: "User001",
				Email:       "user001@example.com",
				ProviderIdentifier: sql.NullString{
					String: "https://oidc.example.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
					Valid:  true,
				},
				ProfilePicURL: "https://cdn.casbin.org/img/casbin.svg",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var got OIDCClaims
			if err := json.Unmarshal([]byte(tt.jsonstr), &got); err != nil {
				t.Errorf("TestOIDCClaimsJSONToUser() error = %v", err)
				return
			}

			var user User

			user.FromClaim(&got)
			if diff := cmp.Diff(user, tt.want); diff != "" {
				t.Errorf("TestOIDCClaimsJSONToUser() mismatch (-want +got):\n%s", diff)
			}
		})
	}
}
