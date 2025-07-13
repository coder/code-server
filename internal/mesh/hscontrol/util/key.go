package util

import (
	"errors"
)

var (
	ErrCannotDecryptResponse = errors.New("cannot decrypt response")
	ZstdCompression          = "zstd"
)
