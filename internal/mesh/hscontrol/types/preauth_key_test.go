package types

import (
	"errors"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
)

func TestCanUsePreAuthKey(t *testing.T) {
	now := time.Now()
	past := now.Add(-time.Hour)
	future := now.Add(time.Hour)

	tests := []struct {
		name    string
		pak     *PreAuthKey
		wantErr bool
		err     PAKError
	}{
		{
			name: "valid reusable key",
			pak: &PreAuthKey{
				Reusable:   true,
				Used:       false,
				Expiration: &future,
			},
			wantErr: false,
		},
		{
			name: "valid non-reusable key",
			pak: &PreAuthKey{
				Reusable:   false,
				Used:       false,
				Expiration: &future,
			},
			wantErr: false,
		},
		{
			name: "expired key",
			pak: &PreAuthKey{
				Reusable:   false,
				Used:       false,
				Expiration: &past,
			},
			wantErr: true,
			err:     PAKError("authkey expired"),
		},
		{
			name: "used non-reusable key",
			pak: &PreAuthKey{
				Reusable:   false,
				Used:       true,
				Expiration: &future,
			},
			wantErr: true,
			err:     PAKError("authkey already used"),
		},
		{
			name: "used reusable key",
			pak: &PreAuthKey{
				Reusable:   true,
				Used:       true,
				Expiration: &future,
			},
			wantErr: false,
		},
		{
			name: "no expiration date",
			pak: &PreAuthKey{
				Reusable:   false,
				Used:       false,
				Expiration: nil,
			},
			wantErr: false,
		},
		{
			name:    "nil preauth key",
			pak:     nil,
			wantErr: true,
			err:     PAKError("invalid authkey"),
		},
		{
			name: "expired and used key",
			pak: &PreAuthKey{
				Reusable:   false,
				Used:       true,
				Expiration: &past,
			},
			wantErr: true,
			err:     PAKError("authkey expired"),
		},
		{
			name: "no expiration and used key",
			pak: &PreAuthKey{
				Reusable:   false,
				Used:       true,
				Expiration: nil,
			},
			wantErr: true,
			err:     PAKError("authkey already used"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.pak.Validate()
			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got none")
				} else {
					var httpErr PAKError
					ok := errors.As(err, &httpErr)
					if !ok {
						t.Errorf("expected HTTPError but got %T", err)
					} else {
						if diff := cmp.Diff(tt.err, httpErr); diff != "" {
							t.Errorf("unexpected error (-want +got):\n%s", diff)
						}
					}
				}
			} else {
				if err != nil {
					t.Errorf("expected no error but got %v", err)
				}
			}
		})
	}
}
