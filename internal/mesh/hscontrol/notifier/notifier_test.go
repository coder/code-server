package notifier

import (
	"fmt"
	"math/rand"
	"net/netip"
	"slices"
	"sort"
	"sync"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/juanfont/headscale/hscontrol/util"
	"tailscale.com/tailcfg"
)

func TestBatcher(t *testing.T) {
	tests := []struct {
		name    string
		updates []types.StateUpdate
		want    []types.StateUpdate
	}{
		{
			name: "full-passthrough",
			updates: []types.StateUpdate{
				{
					Type: types.StateFullUpdate,
				},
			},
			want: []types.StateUpdate{
				{
					Type: types.StateFullUpdate,
				},
			},
		},
		{
			name: "derp-passthrough",
			updates: []types.StateUpdate{
				{
					Type: types.StateDERPUpdated,
				},
			},
			want: []types.StateUpdate{
				{
					Type: types.StateDERPUpdated,
				},
			},
		},
		{
			name: "single-node-update",
			updates: []types.StateUpdate{
				{
					Type: types.StatePeerChanged,
					ChangeNodes: []types.NodeID{
						2,
					},
				},
			},
			want: []types.StateUpdate{
				{
					Type: types.StatePeerChanged,
					ChangeNodes: []types.NodeID{
						2,
					},
				},
			},
		},
		{
			name: "merge-node-update",
			updates: []types.StateUpdate{
				{
					Type: types.StatePeerChanged,
					ChangeNodes: []types.NodeID{
						2, 4,
					},
				},
				{
					Type: types.StatePeerChanged,
					ChangeNodes: []types.NodeID{
						2, 3,
					},
				},
			},
			want: []types.StateUpdate{
				{
					Type: types.StatePeerChanged,
					ChangeNodes: []types.NodeID{
						2, 3, 4,
					},
				},
			},
		},
		{
			name: "single-patch-update",
			updates: []types.StateUpdate{
				{
					Type: types.StatePeerChangedPatch,
					ChangePatches: []*tailcfg.PeerChange{
						{
							NodeID:     2,
							DERPRegion: 5,
						},
					},
				},
			},
			want: []types.StateUpdate{
				{
					Type: types.StatePeerChangedPatch,
					ChangePatches: []*tailcfg.PeerChange{
						{
							NodeID:     2,
							DERPRegion: 5,
						},
					},
				},
			},
		},
		{
			name: "merge-patch-to-same-node-update",
			updates: []types.StateUpdate{
				{
					Type: types.StatePeerChangedPatch,
					ChangePatches: []*tailcfg.PeerChange{
						{
							NodeID:     2,
							DERPRegion: 5,
						},
					},
				},
				{
					Type: types.StatePeerChangedPatch,
					ChangePatches: []*tailcfg.PeerChange{
						{
							NodeID:     2,
							DERPRegion: 6,
						},
					},
				},
			},
			want: []types.StateUpdate{
				{
					Type: types.StatePeerChangedPatch,
					ChangePatches: []*tailcfg.PeerChange{
						{
							NodeID:     2,
							DERPRegion: 6,
						},
					},
				},
			},
		},
		{
			name: "merge-patch-to-multiple-node-update",
			updates: []types.StateUpdate{
				{
					Type: types.StatePeerChangedPatch,
					ChangePatches: []*tailcfg.PeerChange{
						{
							NodeID: 3,
							Endpoints: []netip.AddrPort{
								netip.MustParseAddrPort("1.1.1.1:9090"),
							},
						},
					},
				},
				{
					Type: types.StatePeerChangedPatch,
					ChangePatches: []*tailcfg.PeerChange{
						{
							NodeID: 3,
							Endpoints: []netip.AddrPort{
								netip.MustParseAddrPort("1.1.1.1:9090"),
								netip.MustParseAddrPort("2.2.2.2:8080"),
							},
						},
					},
				},
				{
					Type: types.StatePeerChangedPatch,
					ChangePatches: []*tailcfg.PeerChange{
						{
							NodeID:     4,
							DERPRegion: 6,
						},
					},
				},
				{
					Type: types.StatePeerChangedPatch,
					ChangePatches: []*tailcfg.PeerChange{
						{
							NodeID: 4,
							Cap:    tailcfg.CapabilityVersion(54),
						},
					},
				},
			},
			want: []types.StateUpdate{
				{
					Type: types.StatePeerChangedPatch,
					ChangePatches: []*tailcfg.PeerChange{
						{
							NodeID: 3,
							Endpoints: []netip.AddrPort{
								netip.MustParseAddrPort("1.1.1.1:9090"),
								netip.MustParseAddrPort("2.2.2.2:8080"),
							},
						},
						{
							NodeID:     4,
							DERPRegion: 6,
							Cap:        tailcfg.CapabilityVersion(54),
						},
					},
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			n := NewNotifier(&types.Config{
				Tuning: types.Tuning{
					// We will call flush manually for the tests,
					// so do not run the worker.
					BatchChangeDelay: time.Hour,

					// Since we do not load the config, we won't get the
					// default, so set it manually so we dont time out
					// and have flakes.
					NotifierSendTimeout: time.Second,
				},
			})

			ch := make(chan types.StateUpdate, 30)
			defer close(ch)
			n.AddNode(1, ch)
			defer n.RemoveNode(1, ch)

			for _, u := range tt.updates {
				n.NotifyAll(t.Context(), u)
			}

			n.b.flush()

			var got []types.StateUpdate
			for len(ch) > 0 {
				out := <-ch
				got = append(got, out)
			}

			// Make the inner order stable for comparison.
			for _, u := range got {
				slices.Sort(u.ChangeNodes)
				sort.Slice(u.ChangePatches, func(i, j int) bool {
					return u.ChangePatches[i].NodeID < u.ChangePatches[j].NodeID
				})
			}

			if diff := cmp.Diff(tt.want, got, util.Comparers...); diff != "" {
				t.Errorf("batcher() unexpected result (-want +got):\n%s", diff)
			}
		})
	}
}

// TestIsLikelyConnectedRaceCondition tests for a race condition in IsLikelyConnected
// Multiple goroutines calling AddNode and RemoveNode cause panics when trying to
// close a channel that was already closed, which can happen when a node changes
// network transport quickly (eg mobile->wifi) and reconnects whilst also disconnecting.
func TestIsLikelyConnectedRaceCondition(t *testing.T) {
	// mock config for the notifier
	cfg := &types.Config{
		Tuning: types.Tuning{
			NotifierSendTimeout:            1 * time.Second,
			BatchChangeDelay:               1 * time.Second,
			NodeMapSessionBufferedChanSize: 30,
		},
	}

	notifier := NewNotifier(cfg)
	defer notifier.Close()

	nodeID := types.NodeID(1)
	updateChan := make(chan types.StateUpdate, 10)

	var wg sync.WaitGroup

	// Number of goroutines to spawn for concurrent access
	concurrentAccessors := 100
	iterations := 100

	// Add node to notifier
	notifier.AddNode(nodeID, updateChan)

	// Track errors
	errChan := make(chan string, concurrentAccessors*iterations)

	// Start goroutines to cause a race
	wg.Add(concurrentAccessors)
	for i := range concurrentAccessors {
		go func(routineID int) {
			defer wg.Done()

			for range iterations {
				// Simulate race by having some goroutines check IsLikelyConnected
				// while others add/remove the node
				switch routineID % 3 {
				case 0:
					// This goroutine checks connection status
					isConnected := notifier.IsLikelyConnected(nodeID)
					if isConnected != true && isConnected != false {
						errChan <- fmt.Sprintf("Invalid connection status: %v", isConnected)
					}
				case 1:
					// This goroutine removes the node
					notifier.RemoveNode(nodeID, updateChan)
				default:
					// This goroutine adds the node back
					notifier.AddNode(nodeID, updateChan)
				}

				// Small random delay to increase chance of races
				time.Sleep(time.Duration(rand.Intn(100)) * time.Microsecond)
			}
		}(i)
	}

	wg.Wait()
	close(errChan)

	// Collate errors
	var errors []string
	for err := range errChan {
		errors = append(errors, err)
	}

	if len(errors) > 0 {
		t.Errorf("Detected %d race condition errors: %v", len(errors), errors)
	}
}
