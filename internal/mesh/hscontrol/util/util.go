package util

import (
	"errors"
	"fmt"
	"net/netip"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"tailscale.com/util/cmpver"
)

func TailscaleVersionNewerOrEqual(minimum, toCheck string) bool {
	if cmpver.Compare(minimum, toCheck) <= 0 ||
		toCheck == "unstable" ||
		toCheck == "head" {
		return true
	}

	return false
}

// ParseLoginURLFromCLILogin parses the output of the tailscale up command to extract the login URL.
// It returns an error if not exactly one URL is found.
func ParseLoginURLFromCLILogin(output string) (*url.URL, error) {
	lines := strings.Split(output, "\n")
	var urlStr string

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "http://") || strings.HasPrefix(line, "https://") {
			if urlStr != "" {
				return nil, fmt.Errorf("multiple URLs found: %s and %s", urlStr, line)
			}
			urlStr = line
		}
	}

	if urlStr == "" {
		return nil, errors.New("no URL found")
	}

	loginURL, err := url.Parse(urlStr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse URL: %w", err)
	}

	return loginURL, nil
}

type TraceroutePath struct {
	// Hop is the current jump in the total traceroute.
	Hop int

	// Hostname is the resolved hostname or IP address identifying the jump
	Hostname string

	// IP is the IP address of the jump
	IP netip.Addr

	// Latencies is a list of the latencies for this jump
	Latencies []time.Duration
}

type Traceroute struct {
	// Hostname is the resolved hostname or IP address identifying the target
	Hostname string

	// IP is the IP address of the target
	IP netip.Addr

	// Route is the path taken to reach the target if successful. The list is ordered by the path taken.
	Route []TraceroutePath

	// Success indicates if the traceroute was successful.
	Success bool

	// Err contains an error if  the traceroute was not successful.
	Err error
}

// ParseTraceroute parses the output of the traceroute command and returns a Traceroute struct.
func ParseTraceroute(output string) (Traceroute, error) {
	lines := strings.Split(strings.TrimSpace(output), "\n")
	if len(lines) < 1 {
		return Traceroute{}, errors.New("empty traceroute output")
	}

	// Parse the header line
	headerRegex := regexp.MustCompile(`traceroute to ([^ ]+) \(([^)]+)\)`)
	headerMatches := headerRegex.FindStringSubmatch(lines[0])
	if len(headerMatches) != 3 {
		return Traceroute{}, fmt.Errorf("parsing traceroute header: %s", lines[0])
	}

	hostname := headerMatches[1]
	ipStr := headerMatches[2]
	ip, err := netip.ParseAddr(ipStr)
	if err != nil {
		return Traceroute{}, fmt.Errorf("parsing IP address %s: %w", ipStr, err)
	}

	result := Traceroute{
		Hostname: hostname,
		IP:       ip,
		Route:    []TraceroutePath{},
		Success:  false,
	}

	// Parse each hop line
	hopRegex := regexp.MustCompile("^\\s*(\\d+)\\s+(?:([^ ]+) \\(([^)]+)\\)|(\\*))(?:\\s+(\\d+\\.\\d+) ms)?(?:\\s+(\\d+\\.\\d+) ms)?(?:\\s+(\\d+\\.\\d+) ms)?")

	for i := 1; i < len(lines); i++ {
		matches := hopRegex.FindStringSubmatch(lines[i])
		if len(matches) == 0 {
			continue
		}

		hop, err := strconv.Atoi(matches[1])
		if err != nil {
			return Traceroute{}, fmt.Errorf("parsing hop number: %w", err)
		}

		var hopHostname string
		var hopIP netip.Addr
		var latencies []time.Duration

		// Handle hostname and IP
		if matches[2] != "" && matches[3] != "" {
			hopHostname = matches[2]
			hopIP, err = netip.ParseAddr(matches[3])
			if err != nil {
				return Traceroute{}, fmt.Errorf("parsing hop IP address %s: %w", matches[3], err)
			}
		} else if matches[4] == "*" {
			hopHostname = "*"
			// No IP for timeouts
		}

		// Parse latencies
		for j := 5; j <= 7; j++ {
			if matches[j] != "" {
				ms, err := strconv.ParseFloat(matches[j], 64)
				if err != nil {
					return Traceroute{}, fmt.Errorf("parsing latency: %w", err)
				}
				latencies = append(latencies, time.Duration(ms*float64(time.Millisecond)))
			}
		}

		path := TraceroutePath{
			Hop:       hop,
			Hostname:  hopHostname,
			IP:        hopIP,
			Latencies: latencies,
		}

		result.Route = append(result.Route, path)

		// Check if we've reached the target
		if hopIP == ip {
			result.Success = true
		}
	}

	// If we didn't reach the target, it's unsuccessful
	if !result.Success {
		result.Err = errors.New("traceroute did not reach target")
	}

	return result, nil
}

func IsCI() bool {
	if _, ok := os.LookupEnv("CI"); ok {
		return true
	}

	if _, ok := os.LookupEnv("GITHUB_RUN_ID"); ok {
		return true
	}

	return false
}
