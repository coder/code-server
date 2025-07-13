package types

import "time"

const (
	HTTPTimeout            = 30 * time.Second
	HTTPShutdownTimeout    = 3 * time.Second
	TLSALPN01ChallengeType = "TLS-ALPN-01"
	HTTP01ChallengeType    = "HTTP-01"

	JSONLogFormat = "json"
	TextLogFormat = "text"

	KeepAliveInterval = 60 * time.Second
	MaxHostnameLength = 255
)
