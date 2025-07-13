package util

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"strings"

	"tailscale.com/tailcfg"
)

// GenerateRandomBytes returns securely generated random bytes.
// It will return an error if the system's secure random
// number generator fails to function correctly, in which
// case the caller should not continue.
func GenerateRandomBytes(n int) ([]byte, error) {
	bytes := make([]byte, n)

	// Note that err == nil only if we read len(b) bytes.
	if _, err := rand.Read(bytes); err != nil {
		return nil, err
	}

	return bytes, nil
}

// GenerateRandomStringURLSafe returns a URL-safe, base64 encoded
// securely generated random string.
// It will return an error if the system's secure random
// number generator fails to function correctly, in which
// case the caller should not continue.
func GenerateRandomStringURLSafe(n int) (string, error) {
	b, err := GenerateRandomBytes(n)

	uenc := base64.RawURLEncoding.EncodeToString(b)
	return uenc[:n], err
}

// GenerateRandomStringDNSSafe returns a DNS-safe
// securely generated random string.
// It will return an error if the system's secure random
// number generator fails to function correctly, in which
// case the caller should not continue.
func GenerateRandomStringDNSSafe(size int) (string, error) {
	var str string
	var err error
	for len(str) < size {
		str, err = GenerateRandomStringURLSafe(size)
		if err != nil {
			return "", err
		}
		str = strings.ToLower(
			strings.ReplaceAll(strings.ReplaceAll(str, "_", ""), "-", ""),
		)
	}

	return str[:size], nil
}

func MustGenerateRandomStringDNSSafe(size int) string {
	hash, err := GenerateRandomStringDNSSafe(size)
	if err != nil {
		panic(err)
	}

	return hash
}

func TailNodesToString(nodes []*tailcfg.Node) string {
	temp := make([]string, len(nodes))

	for index, node := range nodes {
		temp[index] = node.Name
	}

	return fmt.Sprintf("[ %s ](%d)", strings.Join(temp, ", "), len(temp))
}

func TailMapResponseToString(resp tailcfg.MapResponse) string {
	return fmt.Sprintf(
		"{ Node: %s, Peers: %s }",
		resp.Node.Name,
		TailNodesToString(resp.Peers),
	)
}

func TailcfgFilterRulesToString(rules []tailcfg.FilterRule) string {
	var sb strings.Builder

	for index, rule := range rules {
		sb.WriteString(fmt.Sprintf(`
{
  SrcIPs: %v
  DstIPs: %v
}
`, rule.SrcIPs, rule.DstPorts))
		if index < len(rules)-1 {
			sb.WriteString(", ")
		}
	}

	return fmt.Sprintf("[ %s ](%d)", sb.String(), len(rules))
}
