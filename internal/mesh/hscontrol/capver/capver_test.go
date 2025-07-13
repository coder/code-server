package capver

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	"tailscale.com/tailcfg"
)

func TestTailscaleLatestMajorMinor(t *testing.T) {
	tests := []struct {
		n        int
		stripV   bool
		expected []string
	}{
		{3, false, []string{"v1.78", "v1.80", "v1.82"}},
		{2, true, []string{"1.80", "1.82"}},
		// Lazy way to see all supported versions
		{10, true, []string{
			"1.64",
			"1.66",
			"1.68",
			"1.70",
			"1.72",
			"1.74",
			"1.76",
			"1.78",
			"1.80",
			"1.82",
		}},
		{0, false, nil},
	}

	for _, test := range tests {
		t.Run("", func(t *testing.T) {
			output := TailscaleLatestMajorMinor(test.n, test.stripV)
			if diff := cmp.Diff(output, test.expected); diff != "" {
				t.Errorf("TailscaleLatestMajorMinor(%d, %v) mismatch (-want +got):\n%s", test.n, test.stripV, diff)
			}
		})
	}
}

func TestCapVerMinimumTailscaleVersion(t *testing.T) {
	tests := []struct {
		input    tailcfg.CapabilityVersion
		expected string
	}{
		{88, "v1.62.0"},
		{90, "v1.64.0"},
		{95, "v1.66.0"},
		{106, "v1.74.0"},
		{109, "v1.78.0"},
		{9001, ""}, // Test case for a version higher than any in the map
		{60, ""},   // Test case for a version lower than any in the map
	}

	for _, test := range tests {
		t.Run("", func(t *testing.T) {
			output := TailscaleVersion(test.input)
			if output != test.expected {
				t.Errorf("CapVerFromTailscaleVersion(%d) = %s; want %s", test.input, output, test.expected)
			}
		})
	}
}
