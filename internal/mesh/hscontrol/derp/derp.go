package derp

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"os"

	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/rs/zerolog/log"
	"gopkg.in/yaml.v3"
	"tailscale.com/tailcfg"
)

func loadDERPMapFromPath(path string) (*tailcfg.DERPMap, error) {
	derpFile, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer derpFile.Close()
	var derpMap tailcfg.DERPMap
	b, err := io.ReadAll(derpFile)
	if err != nil {
		return nil, err
	}
	err = yaml.Unmarshal(b, &derpMap)

	return &derpMap, err
}

func loadDERPMapFromURL(addr url.URL) (*tailcfg.DERPMap, error) {
	ctx, cancel := context.WithTimeout(context.Background(), types.HTTPTimeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, addr.String(), nil)
	if err != nil {
		return nil, err
	}

	client := http.Client{
		Timeout: types.HTTPTimeout,
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var derpMap tailcfg.DERPMap
	err = json.Unmarshal(body, &derpMap)

	return &derpMap, err
}

// mergeDERPMaps naively merges a list of DERPMaps into a single
// DERPMap, it will _only_ look at the Regions, an integer.
// If a region exists in two of the given DERPMaps, the region
// form the _last_ DERPMap will be preserved.
// An empty DERPMap list will result in a DERPMap with no regions.
func mergeDERPMaps(derpMaps []*tailcfg.DERPMap) *tailcfg.DERPMap {
	result := tailcfg.DERPMap{
		OmitDefaultRegions: false,
		Regions:            map[int]*tailcfg.DERPRegion{},
	}

	for _, derpMap := range derpMaps {
		for id, region := range derpMap.Regions {
			result.Regions[id] = region
		}
	}

	return &result
}

func GetDERPMap(cfg types.DERPConfig) *tailcfg.DERPMap {
	var derpMaps []*tailcfg.DERPMap
	if cfg.DERPMap != nil {
		derpMaps = append(derpMaps, cfg.DERPMap)
	}

	for _, path := range cfg.Paths {
		log.Debug().
			Str("func", "GetDERPMap").
			Str("path", path).
			Msg("Loading DERPMap from path")
		derpMap, err := loadDERPMapFromPath(path)
		if err != nil {
			log.Error().
				Str("func", "GetDERPMap").
				Str("path", path).
				Err(err).
				Msg("Could not load DERP map from path")

			break
		}

		derpMaps = append(derpMaps, derpMap)
	}

	for _, addr := range cfg.URLs {
		derpMap, err := loadDERPMapFromURL(addr)
		log.Debug().
			Str("func", "GetDERPMap").
			Str("url", addr.String()).
			Msg("Loading DERPMap from path")
		if err != nil {
			log.Error().
				Str("func", "GetDERPMap").
				Str("url", addr.String()).
				Err(err).
				Msg("Could not load DERP map from path")

			break
		}

		derpMaps = append(derpMaps, derpMap)
	}

	derpMap := mergeDERPMaps(derpMaps)

	log.Trace().Interface("derpMap", derpMap).Msg("DERPMap loaded")

	return derpMap
}
