package util

import (
	"net/netip"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCheckForFQDNRules(t *testing.T) {
	type args struct {
		name string
	}
	tests := []struct {
		name    string
		args    args
		wantErr bool
	}{
		{
			name:    "valid: user",
			args:    args{name: "valid-user"},
			wantErr: false,
		},
		{
			name:    "invalid: capitalized user",
			args:    args{name: "Invalid-CapItaLIzed-user"},
			wantErr: true,
		},
		{
			name:    "invalid: email as user",
			args:    args{name: "foo.bar@example.com"},
			wantErr: true,
		},
		{
			name:    "invalid: chars in user name",
			args:    args{name: "super-user+name"},
			wantErr: true,
		},
		{
			name: "invalid: too long name for user",
			args: args{
				name: "super-long-useruseruser-name-that-should-be-a-little-more-than-63-chars",
			},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := CheckForFQDNRules(tt.args.name); (err != nil) != tt.wantErr {
				t.Errorf("CheckForFQDNRules() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestConvertWithFQDNRules(t *testing.T) {
	tests := []struct {
		name        string
		hostname    string
		dnsHostName string
	}{
		{
			name:        "User1.test",
			hostname:    "User1.Test",
			dnsHostName: "user1.test",
		},
		{
			name:        "User'1$2.test",
			hostname:    "User'1$2.Test",
			dnsHostName: "user12.test",
		},
		{
			name:        "User-^_12.local.test",
			hostname:    "User-^_12.local.Test",
			dnsHostName: "user-12.local.test",
		},
		{
			name:        "User-MacBook-Pro",
			hostname:    "User-MacBook-Pro",
			dnsHostName: "user-macbook-pro",
		},
		{
			name:        "User-Linux-Ubuntu/Fedora",
			hostname:    "User-Linux-Ubuntu/Fedora",
			dnsHostName: "user-linux-ubuntufedora",
		},
		{
			name:        "User-[Space]123",
			hostname:    "User-[ ]123",
			dnsHostName: "user-123",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fqdnHostName := ConvertWithFQDNRules(tt.hostname)
			assert.Equal(t, tt.dnsHostName, fqdnHostName)
		})
	}
}

func TestMagicDNSRootDomains100(t *testing.T) {
	domains := GenerateIPv4DNSRootDomain(netip.MustParsePrefix("100.64.0.0/10"))

	found := false
	for _, domain := range domains {
		if domain == "64.100.in-addr.arpa." {
			found = true

			break
		}
	}
	assert.True(t, found)

	found = false
	for _, domain := range domains {
		if domain == "100.100.in-addr.arpa." {
			found = true

			break
		}
	}
	assert.True(t, found)

	found = false
	for _, domain := range domains {
		if domain == "127.100.in-addr.arpa." {
			found = true

			break
		}
	}
	assert.True(t, found)
}

func TestMagicDNSRootDomains172(t *testing.T) {
	domains := GenerateIPv4DNSRootDomain(netip.MustParsePrefix("172.16.0.0/16"))

	found := false
	for _, domain := range domains {
		if domain == "0.16.172.in-addr.arpa." {
			found = true

			break
		}
	}
	assert.True(t, found)

	found = false
	for _, domain := range domains {
		if domain == "255.16.172.in-addr.arpa." {
			found = true

			break
		}
	}
	assert.True(t, found)
}

// Happens when netmask is a multiple of 4 bits (sounds likely).
func TestMagicDNSRootDomainsIPv6Single(t *testing.T) {
	domains := GenerateIPv6DNSRootDomain(netip.MustParsePrefix("fd7a:115c:a1e0::/48"))

	assert.Len(t, domains, 1)
	assert.Equal(t, "0.e.1.a.c.5.1.1.a.7.d.f.ip6.arpa.", domains[0].WithTrailingDot())
}

func TestMagicDNSRootDomainsIPv6SingleMultiple(t *testing.T) {
	domains := GenerateIPv6DNSRootDomain(netip.MustParsePrefix("fd7a:115c:a1e0::/50"))

	yieldsRoot := func(dom string) bool {
		for _, candidate := range domains {
			if candidate.WithTrailingDot() == dom {
				return true
			}
		}

		return false
	}

	assert.Len(t, domains, 4)
	assert.True(t, yieldsRoot("0.0.e.1.a.c.5.1.1.a.7.d.f.ip6.arpa."))
	assert.True(t, yieldsRoot("1.0.e.1.a.c.5.1.1.a.7.d.f.ip6.arpa."))
	assert.True(t, yieldsRoot("2.0.e.1.a.c.5.1.1.a.7.d.f.ip6.arpa."))
	assert.True(t, yieldsRoot("3.0.e.1.a.c.5.1.1.a.7.d.f.ip6.arpa."))
}
