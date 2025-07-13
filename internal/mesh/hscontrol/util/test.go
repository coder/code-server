package util

import (
	"net/netip"

	"github.com/google/go-cmp/cmp"
	"tailscale.com/types/ipproto"
	"tailscale.com/types/key"
	"tailscale.com/types/views"
)

var PrefixComparer = cmp.Comparer(func(x, y netip.Prefix) bool {
	return x == y
})

var IPComparer = cmp.Comparer(func(x, y netip.Addr) bool {
	return x.Compare(y) == 0
})

var AddrPortComparer = cmp.Comparer(func(x, y netip.AddrPort) bool {
	return x == y
})

var MkeyComparer = cmp.Comparer(func(x, y key.MachinePublic) bool {
	return x.String() == y.String()
})

var NkeyComparer = cmp.Comparer(func(x, y key.NodePublic) bool {
	return x.String() == y.String()
})

var DkeyComparer = cmp.Comparer(func(x, y key.DiscoPublic) bool {
	return x.String() == y.String()
})

var ViewSliceIPProtoComparer = cmp.Comparer(func(a, b views.Slice[ipproto.Proto]) bool { return views.SliceEqual(a, b) })

var Comparers []cmp.Option = []cmp.Option{
	IPComparer, PrefixComparer, AddrPortComparer, MkeyComparer, NkeyComparer, DkeyComparer, ViewSliceIPProtoComparer,
}
