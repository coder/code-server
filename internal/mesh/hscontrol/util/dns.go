package util

import (
	"errors"
	"fmt"
	"net/netip"
	"regexp"
	"strconv"
	"strings"
	"unicode"

	"go4.org/netipx"
	"tailscale.com/util/dnsname"
)

const (
	ByteSize          = 8
	ipv4AddressLength = 32
	ipv6AddressLength = 128

	// value related to RFC 1123 and 952.
	LabelHostnameLength = 63
)

var (
	invalidDNSRegex         = regexp.MustCompile("[^a-z0-9-.]+")
	invalidCharsInUserRegex = regexp.MustCompile("[^a-z0-9-.]+")
)

var ErrInvalidUserName = errors.New("invalid user name")

// ValidateUsername checks if a username is valid.
// It must be at least 2 characters long, start with a letter, and contain
// only letters, numbers, hyphens, dots, and underscores.
// It cannot contain more than one '@'.
// It cannot contain invalid characters.
func ValidateUsername(username string) error {
	// Ensure the username meets the minimum length requirement
	if len(username) < 2 {
		return errors.New("username must be at least 2 characters long")
	}

	// Ensure the username starts with a letter
	if !unicode.IsLetter(rune(username[0])) {
		return errors.New("username must start with a letter")
	}

	atCount := 0
	for _, char := range username {
		switch {
		case unicode.IsLetter(char),
			unicode.IsDigit(char),
			char == '-',
			char == '.',
			char == '_':
			// Valid characters
		case char == '@':
			atCount++
			if atCount > 1 {
				return errors.New("username cannot contain more than one '@'")
			}
		default:
			return fmt.Errorf("username contains invalid character: '%c'", char)
		}
	}

	return nil
}

func CheckForFQDNRules(name string) error {
	// Ensure the username meets the minimum length requirement
	if len(name) < 2 {
		return errors.New("name must be at least 2 characters long")
	}

	if len(name) > LabelHostnameLength {
		return fmt.Errorf(
			"DNS segment must not be over 63 chars. %v doesn't comply with this rule: %w",
			name,
			ErrInvalidUserName,
		)
	}
	if strings.ToLower(name) != name {
		return fmt.Errorf(
			"DNS segment should be lowercase. %v doesn't comply with this rule: %w",
			name,
			ErrInvalidUserName,
		)
	}
	if invalidDNSRegex.MatchString(name) {
		return fmt.Errorf(
			"DNS segment should only be composed of lowercase ASCII letters numbers, hyphen and dots. %v doesn't comply with these rules: %w",
			name,
			ErrInvalidUserName,
		)
	}

	return nil
}

func ConvertWithFQDNRules(name string) string {
	name = strings.ToLower(name)
	name = invalidDNSRegex.ReplaceAllString(name, "")

	return name
}

// generateMagicDNSRootDomains generates a list of DNS entries to be included in `Routes` in `MapResponse`.
// This list of reverse DNS entries instructs the OS on what subnets and domains the Tailscale embedded DNS
// server (listening in 100.100.100.100 udp/53) should be used for.
//
// Tailscale.com includes in the list:
// - the `BaseDomain` of the user
// - the reverse DNS entry for IPv6 (0.e.1.a.c.5.1.1.a.7.d.f.ip6.arpa., see below more on IPv6)
// - the reverse DNS entries for the IPv4 subnets covered by the user's `IPPrefix`.
//   In the public SaaS this is [64-127].100.in-addr.arpa.
//
// The main purpose of this function is then generating the list of IPv4 entries. For the 100.64.0.0/10, this
// is clear, and could be hardcoded. But we are allowing any range as `IPPrefix`, so we need to find out the
// subnets when we have 172.16.0.0/16 (i.e., [0-255].16.172.in-addr.arpa.), or any other subnet.
//
// How IN-ADDR.ARPA domains work is defined in RFC1035 (section 3.5). Tailscale.com seems to adhere to this,
// and do not make use of RFC2317 ("Classless IN-ADDR.ARPA delegation") - hence generating the entries for the next
// class block only.

// From the netmask we can find out the wildcard bits (the bits that are not set in the netmask).
// This allows us to then calculate the subnets included in the subsequent class block and generate the entries.
func GenerateIPv4DNSRootDomain(ipPrefix netip.Prefix) []dnsname.FQDN {
	// Conversion to the std lib net.IPnet, a bit easier to operate
	netRange := netipx.PrefixIPNet(ipPrefix)
	maskBits, _ := netRange.Mask.Size()

	// lastOctet is the last IP byte covered by the mask
	lastOctet := maskBits / ByteSize

	// wildcardBits is the number of bits not under the mask in the lastOctet
	wildcardBits := ByteSize - maskBits%ByteSize

	// min is the value in the lastOctet byte of the IP
	// max is basically 2^wildcardBits - i.e., the value when all the wildcardBits are set to 1
	min := uint(netRange.IP[lastOctet])
	max := (min + 1<<uint(wildcardBits)) - 1

	// here we generate the base domain (e.g., 100.in-addr.arpa., 16.172.in-addr.arpa., etc.)
	rdnsSlice := []string{}
	for i := lastOctet - 1; i >= 0; i-- {
		rdnsSlice = append(rdnsSlice, strconv.FormatUint(uint64(netRange.IP[i]), 10))
	}
	rdnsSlice = append(rdnsSlice, "in-addr.arpa.")
	rdnsBase := strings.Join(rdnsSlice, ".")

	fqdns := make([]dnsname.FQDN, 0, max-min+1)
	for i := min; i <= max; i++ {
		fqdn, err := dnsname.ToFQDN(fmt.Sprintf("%d.%s", i, rdnsBase))
		if err != nil {
			continue
		}
		fqdns = append(fqdns, fqdn)
	}

	return fqdns
}

// generateMagicDNSRootDomains generates a list of DNS entries to be included in `Routes` in `MapResponse`.
// This list of reverse DNS entries instructs the OS on what subnets and domains the Tailscale embedded DNS
// server (listening in 100.100.100.100 udp/53) should be used for.
//
// Tailscale.com includes in the list:
// - the `BaseDomain` of the user
// - the reverse DNS entry for IPv6 (0.e.1.a.c.5.1.1.a.7.d.f.ip6.arpa., see below more on IPv6)
// - the reverse DNS entries for the IPv4 subnets covered by the user's `IPPrefix`.
//   In the public SaaS this is [64-127].100.in-addr.arpa.
//
// The main purpose of this function is then generating the list of IPv4 entries. For the 100.64.0.0/10, this
// is clear, and could be hardcoded. But we are allowing any range as `IPPrefix`, so we need to find out the
// subnets when we have 172.16.0.0/16 (i.e., [0-255].16.172.in-addr.arpa.), or any other subnet.
//
// How IN-ADDR.ARPA domains work is defined in RFC1035 (section 3.5). Tailscale.com seems to adhere to this,
// and do not make use of RFC2317 ("Classless IN-ADDR.ARPA delegation") - hence generating the entries for the next
// class block only.

// From the netmask we can find out the wildcard bits (the bits that are not set in the netmask).
// This allows us to then calculate the subnets included in the subsequent class block and generate the entries.
func GenerateIPv6DNSRootDomain(ipPrefix netip.Prefix) []dnsname.FQDN {
	const nibbleLen = 4

	maskBits, _ := netipx.PrefixIPNet(ipPrefix).Mask.Size()
	expanded := ipPrefix.Addr().StringExpanded()
	nibbleStr := strings.Map(func(r rune) rune {
		if r == ':' {
			return -1
		}

		return r
	}, expanded)

	// TODO?: that does not look the most efficient implementation,
	// but the inputs are not so long as to cause problems,
	// and from what I can see, the generateMagicDNSRootDomains
	// function is called only once over the lifetime of a server process.
	prefixConstantParts := []string{}
	for i := range maskBits / nibbleLen {
		prefixConstantParts = append(
			[]string{string(nibbleStr[i])},
			prefixConstantParts...)
	}

	makeDomain := func(variablePrefix ...string) (dnsname.FQDN, error) {
		prefix := strings.Join(append(variablePrefix, prefixConstantParts...), ".")

		return dnsname.ToFQDN(prefix + ".ip6.arpa")
	}

	var fqdns []dnsname.FQDN
	if maskBits%4 == 0 {
		dom, _ := makeDomain()
		fqdns = append(fqdns, dom)
	} else {
		domCount := 1 << (maskBits % nibbleLen)
		fqdns = make([]dnsname.FQDN, 0, domCount)
		for i := range domCount {
			varNibble := fmt.Sprintf("%x", i)
			dom, err := makeDomain(varNibble)
			if err != nil {
				continue
			}
			fqdns = append(fqdns, dom)
		}
	}

	return fqdns
}
