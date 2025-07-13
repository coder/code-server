package v2

import (
	"errors"
	"fmt"
	"slices"
	"strconv"
	"strings"

	"tailscale.com/tailcfg"
)

// splitDestinationAndPort takes an input string and returns the destination and port as a tuple, or an error if the input is invalid.
func splitDestinationAndPort(input string) (string, string, error) {
	// Find the last occurrence of the colon character
	lastColonIndex := strings.LastIndex(input, ":")

	// Check if the colon character is present and not at the beginning or end of the string
	if lastColonIndex == -1 {
		return "", "", errors.New("input must contain a colon character separating destination and port")
	}
	if lastColonIndex == 0 {
		return "", "", errors.New("input cannot start with a colon character")
	}
	if lastColonIndex == len(input)-1 {
		return "", "", errors.New("input cannot end with a colon character")
	}

	// Split the string into destination and port based on the last colon
	destination := input[:lastColonIndex]
	port := input[lastColonIndex+1:]

	return destination, port, nil
}

// parsePortRange parses a port definition string and returns a slice of PortRange structs.
func parsePortRange(portDef string) ([]tailcfg.PortRange, error) {
	if portDef == "*" {
		return []tailcfg.PortRange{tailcfg.PortRangeAny}, nil
	}

	var portRanges []tailcfg.PortRange
	parts := strings.Split(portDef, ",")

	for _, part := range parts {
		if strings.Contains(part, "-") {
			rangeParts := strings.Split(part, "-")
			rangeParts = slices.DeleteFunc(rangeParts, func(e string) bool {
				return e == ""
			})
			if len(rangeParts) != 2 {
				return nil, errors.New("invalid port range format")
			}

			first, err := parsePort(rangeParts[0])
			if err != nil {
				return nil, err
			}

			last, err := parsePort(rangeParts[1])
			if err != nil {
				return nil, err
			}

			if first > last {
				return nil, errors.New("invalid port range: first port is greater than last port")
			}

			portRanges = append(portRanges, tailcfg.PortRange{First: first, Last: last})
		} else {
			port, err := parsePort(part)
			if err != nil {
				return nil, err
			}

			if port < 1 {
				return nil, errors.New("first port must be >0, or use '*' for wildcard")
			}

			portRanges = append(portRanges, tailcfg.PortRange{First: port, Last: port})
		}
	}

	return portRanges, nil
}

// parsePort parses a single port number from a string.
func parsePort(portStr string) (uint16, error) {
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return 0, errors.New("invalid port number")
	}

	if port < 0 || port > 65535 {
		return 0, errors.New("port number out of range")
	}

	return uint16(port), nil
}

// For some reason golang.org/x/net/internal/iana is an internal package.
const (
	protocolICMP     = 1   // Internet Control Message
	protocolIGMP     = 2   // Internet Group Management
	protocolIPv4     = 4   // IPv4 encapsulation
	protocolTCP      = 6   // Transmission Control
	protocolEGP      = 8   // Exterior Gateway Protocol
	protocolIGP      = 9   // any private interior gateway (used by Cisco for their IGRP)
	protocolUDP      = 17  // User Datagram
	protocolGRE      = 47  // Generic Routing Encapsulation
	protocolESP      = 50  // Encap Security Payload
	protocolAH       = 51  // Authentication Header
	protocolIPv6ICMP = 58  // ICMP for IPv6
	protocolSCTP     = 132 // Stream Control Transmission Protocol
	ProtocolFC       = 133 // Fibre Channel
)

// parseProtocol reads the proto field of the ACL and generates a list of
// protocols that will be allowed, following the IANA IP protocol number
// https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml
//
// If the ACL proto field is empty, it allows ICMPv4, ICMPv6, TCP, and UDP,
// as per Tailscale behaviour (see tailcfg.FilterRule).
//
// Also returns a boolean indicating if the protocol
// requires all the destinations to use wildcard as port number (only TCP,
// UDP and SCTP support specifying ports).
func parseProtocol(protocol string) ([]int, bool, error) {
	switch protocol {
	case "":
		return nil, false, nil
	case "igmp":
		return []int{protocolIGMP}, true, nil
	case "ipv4", "ip-in-ip":
		return []int{protocolIPv4}, true, nil
	case "tcp":
		return []int{protocolTCP}, false, nil
	case "egp":
		return []int{protocolEGP}, true, nil
	case "igp":
		return []int{protocolIGP}, true, nil
	case "udp":
		return []int{protocolUDP}, false, nil
	case "gre":
		return []int{protocolGRE}, true, nil
	case "esp":
		return []int{protocolESP}, true, nil
	case "ah":
		return []int{protocolAH}, true, nil
	case "sctp":
		return []int{protocolSCTP}, false, nil
	case "icmp":
		return []int{protocolICMP, protocolIPv6ICMP}, true, nil

	default:
		protocolNumber, err := strconv.Atoi(protocol)
		if err != nil {
			return nil, false, fmt.Errorf("parsing protocol number: %w", err)
		}

		// TODO(kradalby): What is this?
		needsWildcard := protocolNumber != protocolTCP &&
			protocolNumber != protocolUDP &&
			protocolNumber != protocolSCTP

		return []int{protocolNumber}, needsWildcard, nil
	}
}
