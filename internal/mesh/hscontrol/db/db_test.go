package db

import (
	"database/sql"
	"net/netip"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"sort"
	"strings"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"zgo.at/zcache/v2"
)

// TestSQLiteMigrationAndDataValidation tests specific SQLite migration scenarios
// and validates data integrity after migration. All migrations that require data validation
// should be added here.
func TestSQLiteMigrationAndDataValidation(t *testing.T) {
	ipp := func(p string) netip.Prefix {
		return netip.MustParsePrefix(p)
	}
	r := func(id uint64, p string, a, e, i bool) types.Route {
		return types.Route{
			NodeID:     id,
			Prefix:     ipp(p),
			Advertised: a,
			Enabled:    e,
			IsPrimary:  i,
		}
	}
	tests := []struct {
		dbPath   string
		wantFunc func(*testing.T, *HSDatabase)
	}{
		{
			dbPath: "testdata/sqlite/0-22-3-to-0-23-0-routes-are-dropped-2063_dump.sql",
			wantFunc: func(t *testing.T, hsdb *HSDatabase) {
				t.Helper()
				// Comprehensive data preservation validation for 0.22.3->0.23.0 migration
				// Expected data from dump: 4 users, 17 pre_auth_keys, 14 machines/nodes, 12 routes

				// Verify users data preservation - should have 4 users
				users, err := Read(hsdb.DB, func(rx *gorm.DB) ([]types.User, error) {
					return ListUsers(rx)
				})
				require.NoError(t, err)
				assert.Len(t, users, 4, "should preserve all 4 users from original schema")

				// Verify pre_auth_keys data preservation - should have 17 keys
				preAuthKeys, err := Read(hsdb.DB, func(rx *gorm.DB) ([]types.PreAuthKey, error) {
					var keys []types.PreAuthKey
					err := rx.Find(&keys).Error
					return keys, err
				})
				require.NoError(t, err)
				assert.Len(t, preAuthKeys, 17, "should preserve all 17 pre_auth_keys from original schema")

				// Verify all nodes data preservation - should have 14 nodes
				allNodes, err := Read(hsdb.DB, func(rx *gorm.DB) (types.Nodes, error) {
					return ListNodes(rx)
				})
				require.NoError(t, err)
				assert.Len(t, allNodes, 14, "should preserve all 14 machines/nodes from original schema")

				// Verify specific nodes and their route migration with detailed validation
				nodes, err := Read(hsdb.DB, func(rx *gorm.DB) (types.Nodes, error) {
					n1, err := GetNodeByID(rx, 1)
					n26, err := GetNodeByID(rx, 26)
					n31, err := GetNodeByID(rx, 31)
					n32, err := GetNodeByID(rx, 32)
					if err != nil {
						return nil, err
					}

					return types.Nodes{n1, n26, n31, n32}, nil
				})
				require.NoError(t, err)
				assert.Len(t, nodes, 4, "should have retrieved 4 specific nodes")

				// Validate specific node data from dump file
				nodesByID := make(map[uint64]*types.Node)
				for i := range nodes {
					nodesByID[nodes[i].ID.Uint64()] = nodes[i]
				}

				node1 := nodesByID[1]
				node26 := nodesByID[26]
				node31 := nodesByID[31]
				node32 := nodesByID[32]

				require.NotNil(t, node1, "node 1 should exist")
				require.NotNil(t, node26, "node 26 should exist")
				require.NotNil(t, node31, "node 31 should exist")
				require.NotNil(t, node32, "node 32 should exist")

				// Validate node data using cmp.Diff
				expectedNodes := map[uint64]struct {
					Hostname  string
					GivenName string
					IPv4      string
				}{
					1:  {Hostname: "test_hostname", GivenName: "test_given_name", IPv4: "100.64.0.1"},
					26: {Hostname: "test_hostname", GivenName: "test_given_name", IPv4: "100.64.0.19"},
					31: {Hostname: "test_hostname", GivenName: "test_given_name", IPv4: "100.64.0.7"},
					32: {Hostname: "test_hostname", GivenName: "test_given_name", IPv4: "100.64.0.11"},
				}

				for nodeID, expected := range expectedNodes {
					node := nodesByID[nodeID]
					require.NotNil(t, node, "node %d should exist", nodeID)

					actual := struct {
						Hostname  string
						GivenName string
						IPv4      string
					}{
						Hostname:  node.Hostname,
						GivenName: node.GivenName,
						IPv4:      node.IPv4.String(),
					}

					if diff := cmp.Diff(expected, actual); diff != "" {
						t.Errorf("TestSQLiteMigrationAndDataValidation() node %d mismatch (-want +got):\n%s", nodeID, diff)
					}
				}

				// Validate that routes were properly migrated from routes table to approved_routes
				// Based on the dump file routes data:
				// Node 1 (machine_id 1): routes 1,2,3 (0.0.0.0/0 enabled, ::/0 enabled, 10.9.110.0/24 enabled+primary)
				// Node 26 (machine_id 26): route 6 (172.100.100.0/24 enabled+primary), route 7 (172.100.100.0/24 disabled)
				// Node 31 (machine_id 31): routes 8,10 (0.0.0.0/0 enabled, ::/0 enabled), routes 9,11 (duplicates disabled)
				// Node 32 (machine_id 32): route 12 (192.168.0.24/32 enabled+primary)
				want := [][]netip.Prefix{
					{ipp("0.0.0.0/0"), ipp("10.9.110.0/24"), ipp("::/0")}, // node 1: 3 enabled routes
					{ipp("172.100.100.0/24")},                             // node 26: 1 enabled route
					{ipp("0.0.0.0/0"), ipp("::/0")},                       // node 31: 2 enabled routes
					{ipp("192.168.0.24/32")},                              // node 32: 1 enabled route
				}
				var got [][]netip.Prefix
				for _, node := range nodes {
					got = append(got, node.ApprovedRoutes)
				}

				if diff := cmp.Diff(want, got, util.PrefixComparer); diff != "" {
					t.Errorf("TestSQLiteMigrationAndDataValidation() route migration mismatch (-want +got):\n%s", diff)
				}

				// Verify routes table was dropped after migration
				var routesTableExists bool
				err = hsdb.DB.Raw("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='routes'").Row().Scan(&routesTableExists)
				require.NoError(t, err)
				assert.False(t, routesTableExists, "routes table should have been dropped after migration")
			},
		},
		{
			dbPath: "testdata/sqlite/0-22-3-to-0-23-0-routes-fail-foreign-key-2076_dump.sql",
			wantFunc: func(t *testing.T, hsdb *HSDatabase) {
				t.Helper()
				// Comprehensive data preservation validation for foreign key constraint issue case
				// Expected data from dump: 4 users, 2 pre_auth_keys, 8 nodes

				// Verify users data preservation
				users, err := Read(hsdb.DB, func(rx *gorm.DB) ([]types.User, error) {
					return ListUsers(rx)
				})
				require.NoError(t, err)
				assert.Len(t, users, 4, "should preserve all 4 users from original schema")

				// Verify pre_auth_keys data preservation
				preAuthKeys, err := Read(hsdb.DB, func(rx *gorm.DB) ([]types.PreAuthKey, error) {
					var keys []types.PreAuthKey
					err := rx.Find(&keys).Error
					return keys, err
				})
				require.NoError(t, err)
				assert.Len(t, preAuthKeys, 2, "should preserve all 2 pre_auth_keys from original schema")

				// Verify all nodes data preservation
				allNodes, err := Read(hsdb.DB, func(rx *gorm.DB) (types.Nodes, error) {
					return ListNodes(rx)
				})
				require.NoError(t, err)
				assert.Len(t, allNodes, 8, "should preserve all 8 nodes from original schema")

				// Verify specific node route migration
				node, err := Read(hsdb.DB, func(rx *gorm.DB) (*types.Node, error) {
					return GetNodeByID(rx, 13)
				})
				require.NoError(t, err)

				assert.Len(t, node.ApprovedRoutes, 3)
				_ = types.Routes{
					// These routes exists, but have no nodes associated with them
					// when the migration starts.
					// r(1, "0.0.0.0/0", true, false),
					// r(1, "::/0", true, false),
					// r(3, "0.0.0.0/0", true, false),
					// r(3, "::/0", true, false),
					// r(5, "0.0.0.0/0", true, false),
					// r(5, "::/0", true, false),
					// r(6, "0.0.0.0/0", true, false),
					// r(6, "::/0", true, false),
					// r(6, "10.0.0.0/8", true, false, false),
					// r(7, "0.0.0.0/0", true, false),
					// r(7, "::/0", true, false),
					// r(7, "10.0.0.0/8", true, false, false),
					// r(9, "0.0.0.0/0", true, false),
					// r(9, "::/0", true, false),
					// r(9, "10.0.0.0/8", true, false),
					// r(11, "0.0.0.0/0", true, false),
					// r(11, "::/0", true, false),
					// r(11, "10.0.0.0/8", true, true),
					// r(12, "0.0.0.0/0", true, false),
					// r(12, "::/0", true, false),
					// r(12, "10.0.0.0/8", true, false, false),
					//
					// These nodes exists, so routes should be kept.
					r(13, "10.0.0.0/8", true, false, false),
					r(13, "0.0.0.0/0", true, true, false),
					r(13, "::/0", true, true, false),
					r(13, "10.18.80.2/32", true, true, true),
				}
				want := []netip.Prefix{ipp("0.0.0.0/0"), ipp("10.18.80.2/32"), ipp("::/0")}
				if diff := cmp.Diff(want, node.ApprovedRoutes, util.PrefixComparer); diff != "" {
					t.Errorf("TestSQLiteMigrationAndDataValidation() route migration mismatch (-want +got):\n%s", diff)
				}

				// Verify routes table was dropped after migration
				var routesTableExists bool
				err = hsdb.DB.Raw("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='routes'").Row().Scan(&routesTableExists)
				require.NoError(t, err)
				assert.False(t, routesTableExists, "routes table should have been dropped after migration")
			},
		},
		// at 14:15:06 ❯ go run ./cmd/headscale preauthkeys list
		// ID | Key      | Reusable | Ephemeral | Used  | Expiration | Created    | Tags
		// 1  | 09b28f.. | false    | false     | false | 2024-09-27 | 2024-09-27 | tag:derp
		// 2  | 3112b9.. | false    | false     | false | 2024-09-27 | 2024-09-27 | tag:derp
		// 3  | 7c23b9.. | false    | false     | false | 2024-09-27 | 2024-09-27 | tag:derp,tag:merp
		// 4  | f20155.. | false    | false     | false | 2024-09-27 | 2024-09-27 | tag:test
		// 5  | b212b9.. | false    | false     | false | 2024-09-27 | 2024-09-27 | tag:test,tag:woop,tag:dedu
		{
			dbPath: "testdata/sqlite/0-23-0-to-0-24-0-preauthkey-tags-table_dump.sql",
			wantFunc: func(t *testing.T, hsdb *HSDatabase) {
				t.Helper()
				// Comprehensive data preservation validation for pre-auth key tags migration
				// Expected data from dump: 2 users (kratest, testkra), 5 pre_auth_keys with specific tags

				// Verify users data preservation with specific user data
				users, err := Read(hsdb.DB, func(rx *gorm.DB) ([]types.User, error) {
					return ListUsers(rx)
				})
				require.NoError(t, err)
				assert.Len(t, users, 2, "should preserve all 2 users from original schema")

				// Validate specific user data from dump file using cmp.Diff
				expectedUsers := []types.User{
					{Model: gorm.Model{ID: 1}, Name: "kratest"},
					{Model: gorm.Model{ID: 2}, Name: "testkra"},
				}

				if diff := cmp.Diff(expectedUsers, users,
					cmpopts.IgnoreFields(types.User{}, "CreatedAt", "UpdatedAt", "DeletedAt", "DisplayName", "Email", "ProviderIdentifier", "Provider", "ProfilePicURL")); diff != "" {
					t.Errorf("TestSQLiteMigrationAndDataValidation() users mismatch (-want +got):\n%s", diff)
				}

				// Create maps for easier access in later validations
				usersByName := make(map[string]*types.User)
				for i := range users {
					usersByName[users[i].Name] = &users[i]
				}
				kratest := usersByName["kratest"]
				testkra := usersByName["testkra"]

				// Verify all pre_auth_keys data preservation
				allKeys, err := Read(hsdb.DB, func(rx *gorm.DB) ([]types.PreAuthKey, error) {
					var keys []types.PreAuthKey
					err := rx.Find(&keys).Error
					return keys, err
				})
				require.NoError(t, err)
				assert.Len(t, allKeys, 5, "should preserve all 5 pre_auth_keys from original schema")

				// Verify specific pre-auth keys and their tag migration with exact data validation
				keys, err := Read(hsdb.DB, func(rx *gorm.DB) ([]types.PreAuthKey, error) {
					kratest, err := ListPreAuthKeysByUser(rx, 1) // kratest
					if err != nil {
						return nil, err
					}

					testkra, err := ListPreAuthKeysByUser(rx, 2) // testkra
					if err != nil {
						return nil, err
					}

					return append(kratest, testkra...), nil
				})
				require.NoError(t, err)
				assert.Len(t, keys, 5)

				// Create map for easier validation by ID
				keysByID := make(map[uint64]*types.PreAuthKey)
				for i := range keys {
					keysByID[keys[i].ID] = &keys[i]
				}

				// Validate specific pre-auth key data and tag migration from pre_auth_key_acl_tags table
				key1 := keysByID[1]
				key2 := keysByID[2]
				key3 := keysByID[3]
				key4 := keysByID[4]
				key5 := keysByID[5]

				require.NotNil(t, key1, "pre_auth_key 1 should exist")
				require.NotNil(t, key2, "pre_auth_key 2 should exist")
				require.NotNil(t, key3, "pre_auth_key 3 should exist")
				require.NotNil(t, key4, "pre_auth_key 4 should exist")
				require.NotNil(t, key5, "pre_auth_key 5 should exist")

				// Validate specific pre-auth key data and tag migration using cmp.Diff
				expectedKeys := []types.PreAuthKey{
					{
						ID:     1,
						Key:    "09b28f8c3351984874d46dace0a70177a8721933a950b663",
						UserID: kratest.ID,
						Tags:   []string{"tag:derp"},
					},
					{
						ID:     2,
						Key:    "3112b953cb344191b2d5aec1b891250125bf7b437eac5d26",
						UserID: kratest.ID,
						Tags:   []string{"tag:derp"},
					},
					{
						ID:     3,
						Key:    "7c23b9f215961e7609527aef78bf82fb19064b002d78c36f",
						UserID: kratest.ID,
						Tags:   []string{"tag:derp", "tag:merp"},
					},
					{
						ID:     4,
						Key:    "f2015583852b725220cc4b107fb288a4cf7ac259bd458a32",
						UserID: testkra.ID,
						Tags:   []string{"tag:test"},
					},
					{
						ID:     5,
						Key:    "b212b990165e897944dd3772786544402729fb349da50f57",
						UserID: testkra.ID,
						Tags:   []string{"tag:test", "tag:woop", "tag:dedu"},
					},
				}

				if diff := cmp.Diff(expectedKeys, keys, cmp.Comparer(func(a, b []string) bool {
					sort.Sort(sort.StringSlice(a))
					sort.Sort(sort.StringSlice(b))
					return slices.Equal(a, b)
				}), cmpopts.IgnoreFields(types.PreAuthKey{}, "User", "CreatedAt", "Reusable", "Ephemeral", "Used", "Expiration")); diff != "" {
					t.Errorf("TestSQLiteMigrationAndDataValidation() pre-auth key tags migration mismatch (-want +got):\n%s", diff)
				}

				// Verify pre_auth_key_acl_tags table was dropped after migration
				if hsdb.DB.Migrator().HasTable("pre_auth_key_acl_tags") {
					t.Errorf("TestSQLiteMigrationAndDataValidation() table pre_auth_key_acl_tags should not exist after migration")
				}
			},
		},
		{
			dbPath: "testdata/sqlite/0-23-0-to-0-24-0-no-more-special-types_dump.sql",
			wantFunc: func(t *testing.T, hsdb *HSDatabase) {
				t.Helper()
				// Comprehensive data preservation validation for special types removal migration
				// Expected data from dump: 2 users, 2 pre_auth_keys, 12 nodes

				// Verify users data preservation
				users, err := Read(hsdb.DB, func(rx *gorm.DB) ([]types.User, error) {
					return ListUsers(rx)
				})
				require.NoError(t, err)
				assert.Len(t, users, 2, "should preserve all 2 users from original schema")

				// Verify pre_auth_keys data preservation
				preAuthKeys, err := Read(hsdb.DB, func(rx *gorm.DB) ([]types.PreAuthKey, error) {
					var keys []types.PreAuthKey
					err := rx.Find(&keys).Error
					return keys, err
				})
				require.NoError(t, err)
				assert.Len(t, preAuthKeys, 2, "should preserve all 2 pre_auth_keys from original schema")

				// Verify nodes data preservation and field validation
				nodes, err := Read(hsdb.DB, func(rx *gorm.DB) (types.Nodes, error) {
					return ListNodes(rx)
				})
				require.NoError(t, err)
				assert.Len(t, nodes, 12, "should preserve all 12 nodes from original schema")

				for _, node := range nodes {
					assert.Falsef(t, node.MachineKey.IsZero(), "expected non zero machinekey")
					assert.Contains(t, node.MachineKey.String(), "mkey:")
					assert.Falsef(t, node.NodeKey.IsZero(), "expected non zero nodekey")
					assert.Contains(t, node.NodeKey.String(), "nodekey:")
					assert.Falsef(t, node.DiscoKey.IsZero(), "expected non zero discokey")
					assert.Contains(t, node.DiscoKey.String(), "discokey:")
					assert.NotNil(t, node.IPv4)
					assert.NotNil(t, node.IPv6)
					assert.Len(t, node.Endpoints, 1)
					assert.NotNil(t, node.Hostinfo)
					assert.NotNil(t, node.MachineKey)
				}
			},
		},
		{
			dbPath: "testdata/sqlite/failing-node-preauth-constraint_dump.sql",
			wantFunc: func(t *testing.T, hsdb *HSDatabase) {
				t.Helper()
				// Comprehensive data preservation validation for node-preauth constraint issue
				// Expected data from dump: 1 user, 2 api_keys, 6 nodes

				// Verify users data preservation
				users, err := Read(hsdb.DB, func(rx *gorm.DB) ([]types.User, error) {
					return ListUsers(rx)
				})
				require.NoError(t, err)
				assert.Len(t, users, 1, "should preserve all 1 user from original schema")

				// Verify api_keys data preservation
				var apiKeyCount int
				err = hsdb.DB.Raw("SELECT COUNT(*) FROM api_keys").Scan(&apiKeyCount).Error
				require.NoError(t, err)
				assert.Equal(t, 2, apiKeyCount, "should preserve all 2 api_keys from original schema")

				// Verify nodes data preservation and field validation
				nodes, err := Read(hsdb.DB, func(rx *gorm.DB) (types.Nodes, error) {
					return ListNodes(rx)
				})
				require.NoError(t, err)
				assert.Len(t, nodes, 6, "should preserve all 6 nodes from original schema")

				for _, node := range nodes {
					assert.Falsef(t, node.MachineKey.IsZero(), "expected non zero machinekey")
					assert.Contains(t, node.MachineKey.String(), "mkey:")
					assert.Falsef(t, node.NodeKey.IsZero(), "expected non zero nodekey")
					assert.Contains(t, node.NodeKey.String(), "nodekey:")
					assert.Falsef(t, node.DiscoKey.IsZero(), "expected non zero discokey")
					assert.Contains(t, node.DiscoKey.String(), "discokey:")
					assert.Nil(t, node.AuthKey)
					assert.Nil(t, node.AuthKeyID)
				}
			},
		},
		{
			dbPath: "testdata/sqlite/wrongly-migrated-schema-0.25.1_dump.sql",
			wantFunc: func(t *testing.T, hsdb *HSDatabase) {
				t.Helper()
				// Test migration of a database that was wrongly migrated in 0.25.1
				// This database has several issues:
				// 1. Missing proper user unique constraints (idx_provider_identifier, idx_name_provider_identifier, idx_name_no_provider_identifier)
				// 2. Still has routes table that should have been migrated to node.approved_routes
				// 3. Wrong FOREIGN KEY constraint on pre_auth_keys (CASCADE instead of SET NULL)
				// 4. Missing some required indexes

				// Verify users table data is preserved with specific user data
				users, err := Read(hsdb.DB, func(rx *gorm.DB) ([]types.User, error) {
					return ListUsers(rx)
				})
				require.NoError(t, err)
				assert.Len(t, users, 2, "should preserve existing users")

				// Validate specific user data from dump file using cmp.Diff
				expectedUsers := []types.User{
					{Model: gorm.Model{ID: 1}, Name: "user2"},
					{Model: gorm.Model{ID: 2}, Name: "user1"},
				}

				if diff := cmp.Diff(expectedUsers, users,
					cmpopts.IgnoreFields(types.User{}, "CreatedAt", "UpdatedAt", "DeletedAt", "DisplayName", "Email", "ProviderIdentifier", "Provider", "ProfilePicURL")); diff != "" {
					t.Errorf("TestSQLiteMigrationAndDataValidation() users mismatch (-want +got):\n%s", diff)
				}

				// Create maps for easier access in later validations
				usersByName := make(map[string]*types.User)
				for i := range users {
					usersByName[users[i].Name] = &users[i]
				}
				user1 := usersByName["user1"]
				user2 := usersByName["user2"]

				// Verify nodes table data is preserved and routes migrated to approved_routes
				nodes, err := Read(hsdb.DB, func(rx *gorm.DB) (types.Nodes, error) {
					return ListNodes(rx)
				})
				require.NoError(t, err)
				assert.Len(t, nodes, 3, "should preserve existing nodes")

				// Validate specific node data from dump file
				nodesByID := make(map[uint64]*types.Node)
				for i := range nodes {
					nodesByID[nodes[i].ID.Uint64()] = nodes[i]
				}

				node1 := nodesByID[1]
				node2 := nodesByID[2]
				node3 := nodesByID[3]
				require.NotNil(t, node1, "node 1 should exist")
				require.NotNil(t, node2, "node 2 should exist")
				require.NotNil(t, node3, "node 3 should exist")

				// Validate specific node field data using cmp.Diff
				expectedNodes := map[uint64]struct {
					Hostname  string
					GivenName string
					IPv4      string
					IPv6      string
					UserID    uint
				}{
					1: {Hostname: "node1", GivenName: "node1", IPv4: "100.64.0.1", IPv6: "fd7a:115c:a1e0::1", UserID: user2.ID},
					2: {Hostname: "node2", GivenName: "node2", IPv4: "100.64.0.2", IPv6: "fd7a:115c:a1e0::2", UserID: user2.ID},
					3: {Hostname: "node3", GivenName: "node3", IPv4: "100.64.0.3", IPv6: "fd7a:115c:a1e0::3", UserID: user1.ID},
				}

				for nodeID, expected := range expectedNodes {
					node := nodesByID[nodeID]
					require.NotNil(t, node, "node %d should exist", nodeID)

					actual := struct {
						Hostname  string
						GivenName string
						IPv4      string
						IPv6      string
						UserID    uint
					}{
						Hostname:  node.Hostname,
						GivenName: node.GivenName,
						IPv4:      node.IPv4.String(),
						IPv6: func() string {
							if node.IPv6 != nil {
								return node.IPv6.String()
							} else {
								return ""
							}
						}(),
						UserID: node.UserID,
					}

					if diff := cmp.Diff(expected, actual); diff != "" {
						t.Errorf("TestSQLiteMigrationAndDataValidation() node %d basic fields mismatch (-want +got):\n%s", nodeID, diff)
					}

					// Special validation for MachineKey content for node 1 only
					if nodeID == 1 {
						assert.Contains(t, node.MachineKey.String(), "mkey:1efe4388236c1c83fe0a19d3ce7c321ab81e138a4da57917c231ce4c01944409")
					}
				}

				// Check that routes were migrated from routes table to node.approved_routes using cmp.Diff
				// Original routes table had 4 routes for nodes 1, 2, 3:
				// Node 1: 0.0.0.0/0 (enabled), ::/0 (enabled) -> should have 2 approved routes
				// Node 2: 192.168.100.0/24 (enabled) -> should have 1 approved route
				// Node 3: 10.0.0.0/8 (disabled) -> should have 0 approved routes
				expectedRoutes := map[uint64][]netip.Prefix{
					1: {netip.MustParsePrefix("0.0.0.0/0"), netip.MustParsePrefix("::/0")},
					2: {netip.MustParsePrefix("192.168.100.0/24")},
					3: nil,
				}

				actualRoutes := map[uint64][]netip.Prefix{
					1: node1.ApprovedRoutes,
					2: node2.ApprovedRoutes,
					3: node3.ApprovedRoutes,
				}

				if diff := cmp.Diff(expectedRoutes, actualRoutes, util.PrefixComparer); diff != "" {
					t.Errorf("TestSQLiteMigrationAndDataValidation() routes migration mismatch (-want +got):\n%s", diff)
				}

				// Verify pre_auth_keys data is preserved with specific key data
				preAuthKeys, err := Read(hsdb.DB, func(rx *gorm.DB) ([]types.PreAuthKey, error) {
					var keys []types.PreAuthKey
					err := rx.Find(&keys).Error
					return keys, err
				})
				require.NoError(t, err)
				assert.Len(t, preAuthKeys, 2, "should preserve existing pre_auth_keys")

				// Validate specific pre_auth_key data from dump file using cmp.Diff
				expectedKeys := []types.PreAuthKey{
					{
						ID:       1,
						Key:      "3d133ec953e31fd41edbd935371234f762b4bae300cea618",
						UserID:   user2.ID,
						Reusable: true,
						Used:     true,
					},
					{
						ID:       2,
						Key:      "9813cc1df1832259fb6322dad788bb9bec89d8a01eef683a",
						UserID:   user1.ID,
						Reusable: true,
						Used:     true,
					},
				}

				if diff := cmp.Diff(expectedKeys, preAuthKeys,
					cmpopts.IgnoreFields(types.PreAuthKey{}, "User", "CreatedAt", "Expiration", "Ephemeral", "Tags")); diff != "" {
					t.Errorf("TestSQLiteMigrationAndDataValidation() pre_auth_keys mismatch (-want +got):\n%s", diff)
				}

				// Verify api_keys data is preserved with specific key data
				var apiKeys []struct {
					ID         uint64
					Prefix     string
					Hash       []byte
					CreatedAt  string
					Expiration string
					LastSeen   string
				}
				err = hsdb.DB.Raw("SELECT id, prefix, hash, created_at, expiration, last_seen FROM api_keys").Scan(&apiKeys).Error
				require.NoError(t, err)
				assert.Len(t, apiKeys, 1, "should preserve existing api_keys")

				// Validate specific api_key data from dump file using cmp.Diff
				expectedAPIKey := struct {
					ID     uint64
					Prefix string
					Hash   []byte
				}{
					ID:     1,
					Prefix: "ak_test",
					Hash:   []byte{0xde, 0xad, 0xbe, 0xef},
				}

				actualAPIKey := struct {
					ID     uint64
					Prefix string
					Hash   []byte
				}{
					ID:     apiKeys[0].ID,
					Prefix: apiKeys[0].Prefix,
					Hash:   apiKeys[0].Hash,
				}

				if diff := cmp.Diff(expectedAPIKey, actualAPIKey); diff != "" {
					t.Errorf("TestSQLiteMigrationAndDataValidation() api_key mismatch (-want +got):\n%s", diff)
				}

				// Validate date fields separately since they need Contains check
				assert.Contains(t, apiKeys[0].CreatedAt, "2025-12-31", "created_at should be preserved")
				assert.Contains(t, apiKeys[0].Expiration, "2025-06-18", "expiration should be preserved")

				// Verify that routes table no longer exists (should have been dropped)
				var routesTableExists bool
				err = hsdb.DB.Raw("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='routes'").Row().Scan(&routesTableExists)
				require.NoError(t, err)
				assert.False(t, routesTableExists, "routes table should have been dropped")

				// Verify all required indexes exist with correct structure using cmp.Diff
				expectedIndexes := []string{
					"idx_users_deleted_at",
					"idx_provider_identifier",
					"idx_name_provider_identifier",
					"idx_name_no_provider_identifier",
					"idx_api_keys_prefix",
					"idx_policies_deleted_at",
				}

				expectedIndexMap := make(map[string]bool)
				for _, index := range expectedIndexes {
					expectedIndexMap[index] = true
				}

				actualIndexMap := make(map[string]bool)
				for _, indexName := range expectedIndexes {
					var indexExists bool
					err = hsdb.DB.Raw("SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name=?", indexName).Row().Scan(&indexExists)
					require.NoError(t, err)
					actualIndexMap[indexName] = indexExists
				}

				if diff := cmp.Diff(expectedIndexMap, actualIndexMap); diff != "" {
					t.Errorf("TestSQLiteMigrationAndDataValidation() indexes existence mismatch (-want +got):\n%s", diff)
				}

				// Verify proper foreign key constraints are set
				// Check that pre_auth_keys has correct FK constraint (SET NULL, not CASCADE)
				var preAuthKeyConstraint string
				err = hsdb.DB.Raw("SELECT sql FROM sqlite_master WHERE type='table' AND name='pre_auth_keys'").Row().Scan(&preAuthKeyConstraint)
				require.NoError(t, err)
				assert.Contains(t, preAuthKeyConstraint, "ON DELETE SET NULL", "pre_auth_keys should have SET NULL constraint")
				assert.NotContains(t, preAuthKeyConstraint, "ON DELETE CASCADE", "pre_auth_keys should not have CASCADE constraint")

				// Verify that user unique constraints work properly
				// Try to create duplicate local user (should fail)
				err = hsdb.DB.Create(&types.User{Name: users[0].Name}).Error
				require.Error(t, err, "should not allow duplicate local usernames")
				assert.Contains(t, err.Error(), "UNIQUE constraint", "should fail with unique constraint error")
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.dbPath, func(t *testing.T) {
			if !strings.HasSuffix(tt.dbPath, ".sql") {
				t.Fatalf("TestSQLiteMigrationAndDataValidation only supports .sql files, got: %s", tt.dbPath)
			}

			hsdb := dbForTestWithPath(t, tt.dbPath)
			if tt.wantFunc != nil {
				tt.wantFunc(t, hsdb)
			}
		})
	}
}

func emptyCache() *zcache.Cache[types.RegistrationID, types.RegisterNode] {
	return zcache.New[types.RegistrationID, types.RegisterNode](time.Minute, time.Hour)
}

func createSQLiteFromSQLFile(sqlFilePath, dbPath string) error {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}
	defer db.Close()

	schemaContent, err := os.ReadFile(sqlFilePath)
	if err != nil {
		return err
	}

	_, err = db.Exec(string(schemaContent))

	return err
}

// requireConstraintFailed checks if the error is a constraint failure with
// either SQLite and PostgreSQL error messages.
func requireConstraintFailed(t *testing.T, err error) {
	t.Helper()
	require.Error(t, err)
	if !strings.Contains(err.Error(), "UNIQUE constraint failed:") && !strings.Contains(err.Error(), "violates unique constraint") {
		require.Failf(t, "expected error to contain a constraint failure, got: %s", err.Error())
	}
}

func TestConstraints(t *testing.T) {
	tests := []struct {
		name string
		run  func(*testing.T, *gorm.DB)
	}{
		{
			name: "no-duplicate-username-if-no-oidc",
			run: func(t *testing.T, db *gorm.DB) {
				_, err := CreateUser(db, types.User{Name: "user1"})
				require.NoError(t, err)
				_, err = CreateUser(db, types.User{Name: "user1"})
				requireConstraintFailed(t, err)
			},
		},
		{
			name: "no-oidc-duplicate-username-and-id",
			run: func(t *testing.T, db *gorm.DB) {
				user := types.User{
					Model: gorm.Model{ID: 1},
					Name:  "user1",
				}
				user.ProviderIdentifier = sql.NullString{String: "http://test.com/user1", Valid: true}

				err := db.Save(&user).Error
				require.NoError(t, err)

				user = types.User{
					Model: gorm.Model{ID: 2},
					Name:  "user1",
				}
				user.ProviderIdentifier = sql.NullString{String: "http://test.com/user1", Valid: true}

				err = db.Save(&user).Error
				requireConstraintFailed(t, err)
			},
		},
		{
			name: "no-oidc-duplicate-id",
			run: func(t *testing.T, db *gorm.DB) {
				user := types.User{
					Model: gorm.Model{ID: 1},
					Name:  "user1",
				}
				user.ProviderIdentifier = sql.NullString{String: "http://test.com/user1", Valid: true}

				err := db.Save(&user).Error
				require.NoError(t, err)

				user = types.User{
					Model: gorm.Model{ID: 2},
					Name:  "user1.1",
				}
				user.ProviderIdentifier = sql.NullString{String: "http://test.com/user1", Valid: true}

				err = db.Save(&user).Error
				requireConstraintFailed(t, err)
			},
		},
		{
			name: "allow-duplicate-username-cli-then-oidc",
			run: func(t *testing.T, db *gorm.DB) {
				_, err := CreateUser(db, types.User{Name: "user1"}) // Create CLI username
				require.NoError(t, err)

				user := types.User{
					Name:               "user1",
					ProviderIdentifier: sql.NullString{String: "http://test.com/user1", Valid: true},
				}

				err = db.Save(&user).Error
				require.NoError(t, err)
			},
		},
		{
			name: "allow-duplicate-username-oidc-then-cli",
			run: func(t *testing.T, db *gorm.DB) {
				user := types.User{
					Name:               "user1",
					ProviderIdentifier: sql.NullString{String: "http://test.com/user1", Valid: true},
				}

				err := db.Save(&user).Error
				require.NoError(t, err)

				_, err = CreateUser(db, types.User{Name: "user1"}) // Create CLI username
				require.NoError(t, err)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name+"-postgres", func(t *testing.T) {
			db := newPostgresTestDB(t)
			tt.run(t, db.DB.Debug())
		})
		t.Run(tt.name+"-sqlite", func(t *testing.T) {
			db, err := newSQLiteTestDB()
			if err != nil {
				t.Fatalf("creating database: %s", err)
			}

			tt.run(t, db.DB.Debug())
		})
	}
}

// TestPostgresMigrationAndDataValidation tests specific PostgreSQL migration scenarios
// and validates data integrity after migration. All migrations that require data validation
// should be added here.
//
// TODO(kradalby): Convert to use plain text SQL dumps instead of binary .pssql dumps for consistency
// with SQLite tests and easier version control.
func TestPostgresMigrationAndDataValidation(t *testing.T) {
	tests := []struct {
		name     string
		dbPath   string
		wantFunc func(*testing.T, *HSDatabase)
	}{
		{
			name:   "user-idx-breaking",
			dbPath: "testdata/postgres/pre-24-postgresdb.pssql.dump",
			wantFunc: func(t *testing.T, hsdb *HSDatabase) {
				t.Helper()
				users, err := Read(hsdb.DB, func(rx *gorm.DB) ([]types.User, error) {
					return ListUsers(rx)
				})
				require.NoError(t, err)

				for _, user := range users {
					assert.NotEmpty(t, user.Name)
					assert.Empty(t, user.ProfilePicURL)
					assert.Empty(t, user.Email)
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := newPostgresDBForTest(t)

			pgRestorePath, err := exec.LookPath("pg_restore")
			if err != nil {
				t.Fatal("pg_restore not found in PATH. Please install it and ensure it is accessible.")
			}

			// Construct the pg_restore command
			cmd := exec.Command(pgRestorePath, "--verbose", "--if-exists", "--clean", "--no-owner", "--dbname", u.String(), tt.dbPath)

			// Set the output streams
			cmd.Stdout = os.Stdout
			cmd.Stderr = os.Stderr

			// Execute the command
			err = cmd.Run()
			if err != nil {
				t.Fatalf("failed to restore postgres database: %s", err)
			}

			db = newHeadscaleDBFromPostgresURL(t, u)

			if tt.wantFunc != nil {
				tt.wantFunc(t, db)
			}
		})
	}
}

func dbForTest(t *testing.T) *HSDatabase {
	t.Helper()
	return dbForTestWithPath(t, "")
}

func dbForTestWithPath(t *testing.T, sqlFilePath string) *HSDatabase {
	t.Helper()

	dbPath := t.TempDir() + "/headscale_test.db"

	// If SQL file path provided, validate and create database from it
	if sqlFilePath != "" {
		// Validate that the file is a SQL text file
		if !strings.HasSuffix(sqlFilePath, ".sql") {
			t.Fatalf("dbForTestWithPath only accepts .sql files, got: %s", sqlFilePath)
		}

		err := createSQLiteFromSQLFile(sqlFilePath, dbPath)
		if err != nil {
			t.Fatalf("setting up database from SQL file %s: %s", sqlFilePath, err)
		}
	}

	db, err := NewHeadscaleDatabase(
		types.DatabaseConfig{
			Type: "sqlite3",
			Sqlite: types.SqliteConfig{
				Path: dbPath,
			},
		},
		"",
		emptyCache(),
	)
	if err != nil {
		t.Fatalf("setting up database: %s", err)
	}

	if sqlFilePath != "" {
		t.Logf("database set up from %s at: %s", sqlFilePath, dbPath)
	} else {
		t.Logf("database set up at: %s", dbPath)
	}

	return db
}

// TestSQLiteAllTestdataMigrations tests migration compatibility across all SQLite schemas
// in the testdata directory. It verifies they can be successfully migrated to the current
// schema version. This test only validates migration success, not data integrity.
//
// A lot of the schemas have been automatically generated with old Headscale binaries on empty databases
// (no user/node data):
// - `headscale_<VERSION>_schema.sql` (created with `sqlite3 headscale.db .schema`)
// - `headscale_<VERSION>_dump.sql` (created with `sqlite3 headscale.db .dump`)
// where `_dump.sql` contains the migration steps that have been applied to the database.
func TestSQLiteAllTestdataMigrations(t *testing.T) {
	t.Parallel()
	schemas, err := os.ReadDir("testdata/sqlite")
	require.NoError(t, err)

	t.Logf("loaded %d schemas", len(schemas))

	for _, schema := range schemas {
		if schema.IsDir() {
			continue
		}

		t.Logf("validating: %s", schema.Name())

		t.Run(schema.Name(), func(t *testing.T) {
			t.Parallel()

			dbPath := t.TempDir() + "/headscale_test.db"

			// Setup a database with the old schema
			schemaPath := filepath.Join("testdata/sqlite", schema.Name())
			err := createSQLiteFromSQLFile(schemaPath, dbPath)
			require.NoError(t, err)

			_, err = NewHeadscaleDatabase(
				types.DatabaseConfig{
					Type: "sqlite3",
					Sqlite: types.SqliteConfig{
						Path: dbPath,
					},
				},
				"",
				emptyCache(),
			)
			require.NoError(t, err)
		})
	}
}
