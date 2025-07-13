package util

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGenerateRandomStringDNSSafe(t *testing.T) {
	for range 100000 {
		str, err := GenerateRandomStringDNSSafe(8)
		require.NoError(t, err)
		assert.Len(t, str, 8)
	}
}
