package v2

import (
	"errors"
	"testing"

	"github.com/google/go-cmp/cmp"
	"tailscale.com/tailcfg"
)

// TestParseDestinationAndPort tests the parseDestinationAndPort function using table-driven tests.
func TestParseDestinationAndPort(t *testing.T) {
	testCases := []struct {
		input        string
		expectedDst  string
		expectedPort string
		expectedErr  error
	}{
		{"git-server:*", "git-server", "*", nil},
		{"192.168.1.0/24:22", "192.168.1.0/24", "22", nil},
		{"fd7a:115c:a1e0::2:22", "fd7a:115c:a1e0::2", "22", nil},
		{"fd7a:115c:a1e0::2/128:22", "fd7a:115c:a1e0::2/128", "22", nil},
		{"tag:montreal-webserver:80,443", "tag:montreal-webserver", "80,443", nil},
		{"tag:api-server:443", "tag:api-server", "443", nil},
		{"example-host-1:*", "example-host-1", "*", nil},
		{"hostname:80-90", "hostname", "80-90", nil},
		{"invalidinput", "", "", errors.New("input must contain a colon character separating destination and port")},
		{":invalid", "", "", errors.New("input cannot start with a colon character")},
		{"invalid:", "", "", errors.New("input cannot end with a colon character")},
	}

	for _, testCase := range testCases {
		dst, port, err := splitDestinationAndPort(testCase.input)
		if dst != testCase.expectedDst || port != testCase.expectedPort || (err != nil && err.Error() != testCase.expectedErr.Error()) {
			t.Errorf("parseDestinationAndPort(%q) = (%q, %q, %v), want (%q, %q, %v)",
				testCase.input, dst, port, err, testCase.expectedDst, testCase.expectedPort, testCase.expectedErr)
		}
	}
}

func TestParsePort(t *testing.T) {
	tests := []struct {
		input    string
		expected uint16
		err      string
	}{
		{"80", 80, ""},
		{"0", 0, ""},
		{"65535", 65535, ""},
		{"-1", 0, "port number out of range"},
		{"65536", 0, "port number out of range"},
		{"abc", 0, "invalid port number"},
		{"", 0, "invalid port number"},
	}

	for _, test := range tests {
		result, err := parsePort(test.input)
		if err != nil && err.Error() != test.err {
			t.Errorf("parsePort(%q) error = %v, expected error = %v", test.input, err, test.err)
		}
		if err == nil && test.err != "" {
			t.Errorf("parsePort(%q) expected error = %v, got nil", test.input, test.err)
		}
		if result != test.expected {
			t.Errorf("parsePort(%q) = %v, expected %v", test.input, result, test.expected)
		}
	}
}

func TestParsePortRange(t *testing.T) {
	tests := []struct {
		input    string
		expected []tailcfg.PortRange
		err      string
	}{
		{"80", []tailcfg.PortRange{{First: 80, Last: 80}}, ""},
		{"80-90", []tailcfg.PortRange{{First: 80, Last: 90}}, ""},
		{"80,90", []tailcfg.PortRange{{First: 80, Last: 80}, {First: 90, Last: 90}}, ""},
		{"80-91,92,93-95", []tailcfg.PortRange{{First: 80, Last: 91}, {First: 92, Last: 92}, {First: 93, Last: 95}}, ""},
		{"*", []tailcfg.PortRange{tailcfg.PortRangeAny}, ""},
		{"80-", nil, "invalid port range format"},
		{"-90", nil, "invalid port range format"},
		{"80-90,", nil, "invalid port number"},
		{"80,90-", nil, "invalid port range format"},
		{"80-90,abc", nil, "invalid port number"},
		{"80-90,65536", nil, "port number out of range"},
		{"80-90,90-80", nil, "invalid port range: first port is greater than last port"},
	}

	for _, test := range tests {
		result, err := parsePortRange(test.input)
		if err != nil && err.Error() != test.err {
			t.Errorf("parsePortRange(%q) error = %v, expected error = %v", test.input, err, test.err)
		}
		if err == nil && test.err != "" {
			t.Errorf("parsePortRange(%q) expected error = %v, got nil", test.input, test.err)
		}
		if diff := cmp.Diff(result, test.expected); diff != "" {
			t.Errorf("parsePortRange(%q) mismatch (-want +got):\n%s", test.input, diff)
		}
	}
}
