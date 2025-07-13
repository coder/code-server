package main

//go:generate go run main.go

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"

	xmaps "golang.org/x/exp/maps"
	"tailscale.com/tailcfg"
)

const (
	releasesURL = "https://api.github.com/repos/tailscale/tailscale/releases"
	rawFileURL  = "https://github.com/tailscale/tailscale/raw/refs/tags/%s/tailcfg/tailcfg.go"
	outputFile  = "../capver_generated.go"
)

type Release struct {
	Name string `json:"name"`
}

func getCapabilityVersions() (map[string]tailcfg.CapabilityVersion, error) {
	// Fetch the releases
	resp, err := http.Get(releasesURL)
	if err != nil {
		return nil, fmt.Errorf("error fetching releases: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response body: %w", err)
	}

	var releases []Release
	err = json.Unmarshal(body, &releases)
	if err != nil {
		return nil, fmt.Errorf("error unmarshalling JSON: %w", err)
	}

	// Regular expression to find the CurrentCapabilityVersion line
	re := regexp.MustCompile(`const CurrentCapabilityVersion CapabilityVersion = (\d+)`)

	versions := make(map[string]tailcfg.CapabilityVersion)

	for _, release := range releases {
		version := strings.TrimSpace(release.Name)
		if !strings.HasPrefix(version, "v") {
			version = "v" + version
		}

		// Fetch the raw Go file
		rawURL := fmt.Sprintf(rawFileURL, version)
		resp, err := http.Get(rawURL)
		if err != nil {
			fmt.Printf("Error fetching raw file for version %s: %v\n", version, err)
			continue
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			fmt.Printf("Error reading raw file for version %s: %v\n", version, err)
			continue
		}

		// Find the CurrentCapabilityVersion
		matches := re.FindStringSubmatch(string(body))
		if len(matches) > 1 {
			capabilityVersionStr := matches[1]
			capabilityVersion, _ := strconv.Atoi(capabilityVersionStr)
			versions[version] = tailcfg.CapabilityVersion(capabilityVersion)
		} else {
			fmt.Printf("Version: %s, CurrentCapabilityVersion not found\n", version)
		}
	}

	return versions, nil
}

func writeCapabilityVersionsToFile(versions map[string]tailcfg.CapabilityVersion) error {
	// Open the output file
	file, err := os.Create(outputFile)
	if err != nil {
		return fmt.Errorf("error creating file: %w", err)
	}
	defer file.Close()

	// Write the package declaration and variable
	file.WriteString("package capver\n\n")
	file.WriteString("//Generated DO NOT EDIT\n\n")
	file.WriteString(`import "tailscale.com/tailcfg"`)
	file.WriteString("\n\n")
	file.WriteString("var tailscaleToCapVer = map[string]tailcfg.CapabilityVersion{\n")

	sortedVersions := xmaps.Keys(versions)
	sort.Strings(sortedVersions)
	for _, version := range sortedVersions {
		file.WriteString(fmt.Sprintf("\t\"%s\": %d,\n", version, versions[version]))
	}
	file.WriteString("}\n")

	file.WriteString("\n\n")
	file.WriteString("var capVerToTailscaleVer = map[tailcfg.CapabilityVersion]string{\n")

	capVarToTailscaleVer := make(map[tailcfg.CapabilityVersion]string)
	for _, v := range sortedVersions {
		cap := versions[v]
		log.Printf("cap for v: %d, %s", cap, v)

		// If it is already set, skip and continue,
		// we only want the first tailscale vsion per
		// capability vsion.
		if _, ok := capVarToTailscaleVer[cap]; ok {
			log.Printf("Skipping %d, %s", cap, v)
			continue
		}
		log.Printf("Storing %d, %s", cap, v)
		capVarToTailscaleVer[cap] = v
	}

	capsSorted := xmaps.Keys(capVarToTailscaleVer)
	sort.Slice(capsSorted, func(i, j int) bool {
		return capsSorted[i] < capsSorted[j]
	})
	for _, capVer := range capsSorted {
		file.WriteString(fmt.Sprintf("\t%d:\t\t\"%s\",\n", capVer, capVarToTailscaleVer[capVer]))
	}
	file.WriteString("}\n")

	return nil
}

func main() {
	versions, err := getCapabilityVersions()
	if err != nil {
		fmt.Println("Error:", err)
		return
	}

	err = writeCapabilityVersionsToFile(versions)
	if err != nil {
		fmt.Println("Error writing to file:", err)
		return
	}

	fmt.Println("Capability versions written to", outputFile)
}
