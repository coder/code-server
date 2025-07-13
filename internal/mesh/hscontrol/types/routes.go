package types

import (
	"net/netip"

	"gorm.io/gorm"
)

// Deprecated: Approval of routes is denormalised onto the relevant node.
// Struct is kept for GORM migrations only.
type Route struct {
	gorm.Model

	NodeID uint64 `gorm:"not null"`
	Node   *Node

	Prefix netip.Prefix `gorm:"serializer:text"`

	// Advertised is now only stored as part of [Node.Hostinfo].
	Advertised bool

	// Enabled is stored directly on the node as ApprovedRoutes.
	Enabled bool

	// IsPrimary is only determined in memory as it is only relevant
	// when the server is up.
	IsPrimary bool
}

// Deprecated: Approval of routes is denormalised onto the relevant node.
type Routes []Route
