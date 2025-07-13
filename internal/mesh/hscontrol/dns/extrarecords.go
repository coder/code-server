package dns

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"os"
	"sync"

	"github.com/cenkalti/backoff/v5"
	"github.com/fsnotify/fsnotify"
	"github.com/rs/zerolog/log"
	"tailscale.com/tailcfg"
	"tailscale.com/util/set"
)

type ExtraRecordsMan struct {
	mu      sync.RWMutex
	records set.Set[tailcfg.DNSRecord]
	watcher *fsnotify.Watcher
	path    string

	updateCh chan []tailcfg.DNSRecord
	closeCh  chan struct{}
	hashes   map[string][32]byte
}

// NewExtraRecordsManager creates a new ExtraRecordsMan and starts watching the file at the given path.
func NewExtraRecordsManager(path string) (*ExtraRecordsMan, error) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, fmt.Errorf("creating watcher: %w", err)
	}

	fi, err := os.Stat(path)
	if err != nil {
		return nil, fmt.Errorf("getting file info: %w", err)
	}

	if fi.IsDir() {
		return nil, fmt.Errorf("path is a directory, only file is supported: %s", path)
	}

	records, hash, err := readExtraRecordsFromPath(path)
	if err != nil {
		return nil, fmt.Errorf("reading extra records from path: %w", err)
	}

	er := &ExtraRecordsMan{
		watcher: watcher,
		path:    path,
		records: set.SetOf(records),
		hashes: map[string][32]byte{
			path: hash,
		},
		closeCh:  make(chan struct{}),
		updateCh: make(chan []tailcfg.DNSRecord),
	}

	err = watcher.Add(path)
	if err != nil {
		return nil, fmt.Errorf("adding path to watcher: %w", err)
	}

	log.Trace().Caller().Strs("watching", watcher.WatchList()).Msg("started filewatcher")

	return er, nil
}

func (e *ExtraRecordsMan) Records() []tailcfg.DNSRecord {
	e.mu.RLock()
	defer e.mu.RUnlock()

	return e.records.Slice()
}

func (e *ExtraRecordsMan) Run() {
	for {
		select {
		case <-e.closeCh:
			return
		case event, ok := <-e.watcher.Events:
			if !ok {
				log.Error().Caller().Msgf("file watcher event channel closing")
				return
			}
			switch event.Op {
			case fsnotify.Create, fsnotify.Write, fsnotify.Chmod:
				log.Trace().Caller().Str("path", event.Name).Str("op", event.Op.String()).Msg("extra records received filewatch event")
				if event.Name != e.path {
					continue
				}
				e.updateRecords()

				// If a file is removed or renamed, fsnotify will loose track of it
				// and not watch it. We will therefore attempt to re-add it with a backoff.
			case fsnotify.Remove, fsnotify.Rename:
				_, err := backoff.Retry(context.Background(), func() (struct{}, error) {
					if _, err := os.Stat(e.path); err != nil {
						return struct{}{}, err
					}

					return struct{}{}, nil
				}, backoff.WithBackOff(backoff.NewExponentialBackOff()))
				if err != nil {
					log.Error().Caller().Err(err).Msgf("extra records filewatcher retrying to find file after delete")
					continue
				}

				err = e.watcher.Add(e.path)
				if err != nil {
					log.Error().Caller().Err(err).Msgf("extra records filewatcher re-adding file after delete failed, giving up.")
					return
				} else {
					log.Trace().Caller().Str("path", e.path).Msg("extra records file re-added after delete")
					e.updateRecords()
				}
			}

		case err, ok := <-e.watcher.Errors:
			if !ok {
				log.Error().Caller().Msgf("file watcher error channel closing")
				return
			}
			log.Error().Caller().Err(err).Msgf("extra records filewatcher returned error: %q", err)
		}
	}
}

func (e *ExtraRecordsMan) Close() {
	e.watcher.Close()
	close(e.closeCh)
}

func (e *ExtraRecordsMan) UpdateCh() <-chan []tailcfg.DNSRecord {
	return e.updateCh
}

func (e *ExtraRecordsMan) updateRecords() {
	records, newHash, err := readExtraRecordsFromPath(e.path)
	if err != nil {
		log.Error().Caller().Err(err).Msgf("reading extra records from path: %s", e.path)
		return
	}

	// If there are no records, ignore the update.
	if records == nil {
		return
	}

	e.mu.Lock()
	defer e.mu.Unlock()

	// If there has not been any change, ignore the update.
	if oldHash, ok := e.hashes[e.path]; ok {
		if newHash == oldHash {
			return
		}
	}

	oldCount := e.records.Len()

	e.records = set.SetOf(records)
	e.hashes[e.path] = newHash

	log.Trace().Caller().Interface("records", e.records).Msgf("extra records updated from path, count old: %d, new: %d", oldCount, e.records.Len())
	e.updateCh <- e.records.Slice()
}

// readExtraRecordsFromPath reads a JSON file of tailcfg.DNSRecord
// and returns the records and the hash of the file.
func readExtraRecordsFromPath(path string) ([]tailcfg.DNSRecord, [32]byte, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, [32]byte{}, fmt.Errorf("reading path: %s, err: %w", path, err)
	}

	// If the read was triggered too fast, and the file is not complete, ignore the update
	// if the file is empty. A consecutive update will be triggered when the file is complete.
	if len(b) == 0 {
		return nil, [32]byte{}, nil
	}

	var records []tailcfg.DNSRecord
	err = json.Unmarshal(b, &records)
	if err != nil {
		return nil, [32]byte{}, fmt.Errorf("unmarshalling records, content: %q: %w", string(b), err)
	}

	hash := sha256.Sum256(b)

	return records, hash, nil
}
