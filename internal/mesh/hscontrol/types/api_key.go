package types

import (
	"time"

	v1 "github.com/juanfont/headscale/gen/go/headscale/v1"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// APIKey describes the datamodel for API keys used to remotely authenticate with
// headscale.
type APIKey struct {
	ID     uint64 `gorm:"primary_key"`
	Prefix string `gorm:"uniqueIndex"`
	Hash   []byte

	CreatedAt  *time.Time
	Expiration *time.Time
	LastSeen   *time.Time
}

func (key *APIKey) Proto() *v1.ApiKey {
	protoKey := v1.ApiKey{
		Id:     key.ID,
		Prefix: key.Prefix,
	}

	if key.Expiration != nil {
		protoKey.Expiration = timestamppb.New(*key.Expiration)
	}

	if key.CreatedAt != nil {
		protoKey.CreatedAt = timestamppb.New(*key.CreatedAt)
	}

	if key.LastSeen != nil {
		protoKey.LastSeen = timestamppb.New(*key.LastSeen)
	}

	return &protoKey
}
