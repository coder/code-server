package util

import (
	"context"
	"net"
	"net/netip"
	"sync"

	"go4.org/netipx"
	"tailscale.com/net/tsaddr"
)

func GrpcSocketDialer(ctx context.Context, addr string) (net.Conn, error) {
	var d net.Dialer

	return d.DialContext(ctx, "unix", addr)
}

func PrefixesToString(prefixes []netip.Prefix) []string {
	ret := make([]string, 0, len(prefixes))
	for _, prefix := range prefixes {
		ret = append(ret, prefix.String())
	}

	return ret
}

func MustStringsToPrefixes(strings []string) []netip.Prefix {
	ret := make([]netip.Prefix, 0, len(strings))
	for _, str := range strings {
		prefix := netip.MustParsePrefix(str)
		ret = append(ret, prefix)
	}

	return ret
}

// TheInternet returns the IPSet for the Internet.
// https://www.youtube.com/watch?v=iDbyYGrswtg
var TheInternet = sync.OnceValue(func() *netipx.IPSet {
	var internetBuilder netipx.IPSetBuilder
	internetBuilder.AddPrefix(netip.MustParsePrefix("2000::/3"))
	internetBuilder.AddPrefix(tsaddr.AllIPv4())

	// Delete Private network addresses
	// https://datatracker.ietf.org/doc/html/rfc1918
	internetBuilder.RemovePrefix(netip.MustParsePrefix("fc00::/7"))
	internetBuilder.RemovePrefix(netip.MustParsePrefix("10.0.0.0/8"))
	internetBuilder.RemovePrefix(netip.MustParsePrefix("172.16.0.0/12"))
	internetBuilder.RemovePrefix(netip.MustParsePrefix("192.168.0.0/16"))

	// Delete Tailscale networks
	internetBuilder.RemovePrefix(tsaddr.TailscaleULARange())
	internetBuilder.RemovePrefix(tsaddr.CGNATRange())

	// Delete "can't find DHCP networks"
	internetBuilder.RemovePrefix(netip.MustParsePrefix("fe80::/10")) // link-local
	internetBuilder.RemovePrefix(netip.MustParsePrefix("169.254.0.0/16"))

	theInternetSet, _ := internetBuilder.IPSet()

	return theInternetSet
})
