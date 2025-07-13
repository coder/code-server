package db

import (
	"context"
	"database/sql"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"net/netip"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/go-gormigrate/gormigrate/v2"
	"github.com/juanfont/headscale/hscontrol/db/sqliteconfig"
	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/rs/zerolog/log"
	"github.com/tailscale/squibble"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
	"tailscale.com/net/tsaddr"
	"tailscale.com/util/set"
	"zgo.at/zcache/v2"
)

//go:embed schema.sql
var dbSchema string

func init() {
	schema.RegisterSerializer("text", TextSerialiser{})
}

var errDatabaseNotSupported = errors.New("database type not supported")

var errForeignKeyConstraintsViolated = errors.New("foreign key constraints violated")

const (
	maxIdleConns       = 100
	maxOpenConns       = 100
	contextTimeoutSecs = 10
)

// KV is a key-value store in a psql table. For future use...
// TODO(kradalby): Is this used for anything?
type KV struct {
	Key   string
	Value string
}

type HSDatabase struct {
	DB       *gorm.DB
	cfg      *types.DatabaseConfig
	regCache *zcache.Cache[types.RegistrationID, types.RegisterNode]

	baseDomain string
}

// TODO(kradalby): assemble this struct from toptions or something typed
// rather than arguments.
func NewHeadscaleDatabase(
	cfg types.DatabaseConfig,
	baseDomain string,
	regCache *zcache.Cache[types.RegistrationID, types.RegisterNode],
) (*HSDatabase, error) {
	dbConn, err := openDB(cfg)
	if err != nil {
		return nil, err
	}

	migrations := gormigrate.New(
		dbConn,
		gormigrate.DefaultOptions,
		[]*gormigrate.Migration{
			// New migrations must be added as transactions at the end of this list.
			// The initial migration here is quite messy, completely out of order and
			// has no versioning and is the tech debt of not having versioned migrations
			// prior to this point. This first migration is all DB changes to bring a DB
			// up to 0.23.0.
			{
				ID: "202312101416",
				Migrate: func(tx *gorm.DB) error {
					if cfg.Type == types.DatabasePostgres {
						tx.Exec(`create extension if not exists "uuid-ossp";`)
					}

					_ = tx.Migrator().RenameTable("namespaces", "users")

					// the big rename from Machine to Node
					_ = tx.Migrator().RenameTable("machines", "nodes")
					_ = tx.Migrator().
						RenameColumn(&types.Route{}, "machine_id", "node_id")

					err = tx.AutoMigrate(types.User{})
					if err != nil {
						return err
					}

					_ = tx.Migrator().
						RenameColumn(&types.Node{}, "namespace_id", "user_id")
					_ = tx.Migrator().
						RenameColumn(&types.PreAuthKey{}, "namespace_id", "user_id")

					_ = tx.Migrator().
						RenameColumn(&types.Node{}, "ip_address", "ip_addresses")
					_ = tx.Migrator().RenameColumn(&types.Node{}, "name", "hostname")

					// GivenName is used as the primary source of DNS names, make sure
					// the field is populated and normalized if it was not when the
					// node was registered.
					_ = tx.Migrator().
						RenameColumn(&types.Node{}, "nickname", "given_name")

					dbConn.Model(&types.Node{}).Where("auth_key_id = ?", 0).Update("auth_key_id", nil)
					// If the Node table has a column for registered,
					// find all occurrences of "false" and drop them. Then
					// remove the column.
					if tx.Migrator().HasColumn(&types.Node{}, "registered") {
						log.Info().
							Msg(`Database has legacy "registered" column in node, removing...`)

						nodes := types.Nodes{}
						if err := tx.Not("registered").Find(&nodes).Error; err != nil {
							log.Error().Err(err).Msg("Error accessing db")
						}

						for _, node := range nodes {
							log.Info().
								Str("node", node.Hostname).
								Str("machine_key", node.MachineKey.ShortString()).
								Msg("Deleting unregistered node")
							if err := tx.Delete(&types.Node{}, node.ID).Error; err != nil {
								log.Error().
									Err(err).
									Str("node", node.Hostname).
									Str("machine_key", node.MachineKey.ShortString()).
									Msg("Error deleting unregistered node")
							}
						}

						err := tx.Migrator().DropColumn(&types.Node{}, "registered")
						if err != nil {
							log.Error().Err(err).Msg("Error dropping registered column")
						}
					}

					// Remove any invalid routes associated with a node that does not exist.
					if tx.Migrator().HasTable(&types.Route{}) && tx.Migrator().HasTable(&types.Node{}) {
						err := tx.Exec("delete from routes where node_id not in (select id from nodes)").Error
						if err != nil {
							return err
						}
					}
					err = tx.AutoMigrate(&types.Route{})
					if err != nil {
						return err
					}

					err = tx.AutoMigrate(&types.Node{})
					if err != nil {
						return err
					}

					// Ensure all keys have correct prefixes
					// https://github.com/tailscale/tailscale/blob/main/types/key/node.go#L35
					type result struct {
						ID         uint64
						MachineKey string
						NodeKey    string
						DiscoKey   string
					}
					var results []result
					err = tx.Raw("SELECT id, node_key, machine_key, disco_key FROM nodes").
						Find(&results).
						Error
					if err != nil {
						return err
					}

					for _, node := range results {
						mKey := node.MachineKey
						if !strings.HasPrefix(node.MachineKey, "mkey:") {
							mKey = "mkey:" + node.MachineKey
						}
						nKey := node.NodeKey
						if !strings.HasPrefix(node.NodeKey, "nodekey:") {
							nKey = "nodekey:" + node.NodeKey
						}

						dKey := node.DiscoKey
						if !strings.HasPrefix(node.DiscoKey, "discokey:") {
							dKey = "discokey:" + node.DiscoKey
						}

						err := tx.Exec(
							"UPDATE nodes SET machine_key = @mKey, node_key = @nKey, disco_key = @dKey WHERE ID = @id",
							sql.Named("mKey", mKey),
							sql.Named("nKey", nKey),
							sql.Named("dKey", dKey),
							sql.Named("id", node.ID),
						).Error
						if err != nil {
							return err
						}
					}

					if tx.Migrator().HasColumn(&types.Node{}, "enabled_routes") {
						log.Info().
							Msgf("Database has legacy enabled_routes column in node, migrating...")

						type NodeAux struct {
							ID            uint64
							EnabledRoutes []netip.Prefix `gorm:"serializer:json"`
						}

						nodesAux := []NodeAux{}
						err := tx.Table("nodes").
							Select("id, enabled_routes").
							Scan(&nodesAux).
							Error
						if err != nil {
							log.Fatal().Err(err).Msg("Error accessing db")
						}
						for _, node := range nodesAux {
							for _, prefix := range node.EnabledRoutes {
								if err != nil {
									log.Error().
										Err(err).
										Str("enabled_route", prefix.String()).
										Msg("Error parsing enabled_route")

									continue
								}

								err = tx.Preload("Node").
									Where("node_id = ? AND prefix = ?", node.ID, prefix).
									First(&types.Route{}).
									Error
								if err == nil {
									log.Info().
										Str("enabled_route", prefix.String()).
										Msg("Route already migrated to new table, skipping")

									continue
								}

								route := types.Route{
									NodeID:     node.ID,
									Advertised: true,
									Enabled:    true,
									Prefix:     prefix,
								}
								if err := tx.Create(&route).Error; err != nil {
									log.Error().Err(err).Msg("Error creating route")
								} else {
									log.Info().
										Uint64("node_id", route.NodeID).
										Str("prefix", prefix.String()).
										Msg("Route migrated")
								}
							}
						}

						err = tx.Migrator().DropColumn(&types.Node{}, "enabled_routes")
						if err != nil {
							log.Error().
								Err(err).
								Msg("Error dropping enabled_routes column")
						}
					}

					if tx.Migrator().HasColumn(&types.Node{}, "given_name") {
						nodes := types.Nodes{}
						if err := tx.Find(&nodes).Error; err != nil {
							log.Error().Err(err).Msg("Error accessing db")
						}

						for item, node := range nodes {
							if node.GivenName == "" {
								if err != nil {
									log.Error().
										Caller().
										Str("hostname", node.Hostname).
										Err(err).
										Msg("Failed to normalize node hostname in DB migration")
								}

								err = tx.Model(nodes[item]).Updates(types.Node{
									GivenName: node.Hostname,
								}).Error
								if err != nil {
									log.Error().
										Caller().
										Str("hostname", node.Hostname).
										Err(err).
										Msg("Failed to save normalized node name in DB migration")
								}
							}
						}
					}

					err = tx.AutoMigrate(&KV{})
					if err != nil {
						return err
					}

					err = tx.AutoMigrate(&types.PreAuthKey{})
					if err != nil {
						return err
					}

					type preAuthKeyACLTag struct {
						ID           uint64 `gorm:"primary_key"`
						PreAuthKeyID uint64
						Tag          string
					}
					err = tx.AutoMigrate(&preAuthKeyACLTag{})
					if err != nil {
						return err
					}

					_ = tx.Migrator().DropTable("shared_machines")

					err = tx.AutoMigrate(&types.APIKey{})
					if err != nil {
						return err
					}

					return nil
				},
				Rollback: func(tx *gorm.DB) error {
					return nil
				},
			},
			{
				// drop key-value table, it is not used, and has not contained
				// useful data for a long time or ever.
				ID: "202312101430",
				Migrate: func(tx *gorm.DB) error {
					return tx.Migrator().DropTable("kvs")
				},
				Rollback: func(tx *gorm.DB) error {
					return nil
				},
			},
			{
				// remove last_successful_update from node table,
				// no longer used.
				ID: "202402151347",
				Migrate: func(tx *gorm.DB) error {
					_ = tx.Migrator().DropColumn(&types.Node{}, "last_successful_update")
					return nil
				},
				Rollback: func(tx *gorm.DB) error {
					return nil
				},
			},
			{
				// Replace column with IP address list with dedicated
				// IP v4 and v6 column.
				// Note that previously, the list _could_ contain more
				// than two addresses, which should not really happen.
				// In that case, the first occurrence of each type will
				// be kept.
				ID: "2024041121742",
				Migrate: func(tx *gorm.DB) error {
					_ = tx.Migrator().AddColumn(&types.Node{}, "ipv4")
					_ = tx.Migrator().AddColumn(&types.Node{}, "ipv6")

					type node struct {
						ID        uint64 `gorm:"column:id"`
						Addresses string `gorm:"column:ip_addresses"`
					}

					var nodes []node

					_ = tx.Raw("SELECT id, ip_addresses FROM nodes").Scan(&nodes).Error

					for _, node := range nodes {
						addrs := strings.Split(node.Addresses, ",")

						if len(addrs) == 0 {
							return fmt.Errorf("no addresses found for node(%d)", node.ID)
						}

						var v4 *netip.Addr
						var v6 *netip.Addr

						for _, addrStr := range addrs {
							addr, err := netip.ParseAddr(addrStr)
							if err != nil {
								return fmt.Errorf("parsing IP for node(%d) from database: %w", node.ID, err)
							}

							if addr.Is4() && v4 == nil {
								v4 = &addr
							}

							if addr.Is6() && v6 == nil {
								v6 = &addr
							}
						}

						if v4 != nil {
							err = tx.Model(&types.Node{}).Where("id = ?", node.ID).Update("ipv4", v4.String()).Error
							if err != nil {
								return fmt.Errorf("saving ip addresses to new columns: %w", err)
							}
						}

						if v6 != nil {
							err = tx.Model(&types.Node{}).Where("id = ?", node.ID).Update("ipv6", v6.String()).Error
							if err != nil {
								return fmt.Errorf("saving ip addresses to new columns: %w", err)
							}
						}
					}

					_ = tx.Migrator().DropColumn(&types.Node{}, "ip_addresses")

					return nil
				},
				Rollback: func(tx *gorm.DB) error {
					return nil
				},
			},
			{
				ID: "202406021630",
				Migrate: func(tx *gorm.DB) error {
					err := tx.AutoMigrate(&types.Policy{})
					if err != nil {
						return err
					}

					return nil
				},
				Rollback: func(db *gorm.DB) error { return nil },
			},
			// denormalise the ACL tags for preauth keys back onto
			// the preauth key table. We dont normalise or reuse and
			// it is just a bunch of work for extra work.
			{
				ID: "202409271400",
				Migrate: func(tx *gorm.DB) error {
					preauthkeyTags := map[uint64]set.Set[string]{}

					type preAuthKeyACLTag struct {
						ID           uint64 `gorm:"primary_key"`
						PreAuthKeyID uint64
						Tag          string
					}

					var aclTags []preAuthKeyACLTag
					if err := tx.Find(&aclTags).Error; err != nil {
						return err
					}

					// Store the current tags.
					for _, tag := range aclTags {
						if preauthkeyTags[tag.PreAuthKeyID] == nil {
							preauthkeyTags[tag.PreAuthKeyID] = set.SetOf([]string{tag.Tag})
						} else {
							preauthkeyTags[tag.PreAuthKeyID].Add(tag.Tag)
						}
					}

					// Add tags column and restore the tags.
					_ = tx.Migrator().AddColumn(&types.PreAuthKey{}, "tags")
					for keyID, tags := range preauthkeyTags {
						s := tags.Slice()
						j, err := json.Marshal(s)
						if err != nil {
							return err
						}
						if err := tx.Model(&types.PreAuthKey{}).Where("id = ?", keyID).Update("tags", string(j)).Error; err != nil {
							return err
						}
					}

					// Drop the old table.
					_ = tx.Migrator().DropTable(&preAuthKeyACLTag{})

					return nil
				},
				Rollback: func(db *gorm.DB) error { return nil },
			},
			{
				// Pick up new user fields used for OIDC and to
				// populate the user with more interesting information.
				ID: "202407191627",
				Migrate: func(tx *gorm.DB) error {
					// Fix an issue where the automigration in GORM expected a constraint to
					// exists that didnt, and add the one it wanted.
					// Fixes https://github.com/juanfont/headscale/issues/2351
					if cfg.Type == types.DatabasePostgres {
						err := tx.Exec(`
BEGIN;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uni_users_name'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT uni_users_name UNIQUE (name);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_name_key'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_name_key;
    END IF;
END $$;
COMMIT;
`).Error
						if err != nil {
							return fmt.Errorf("failed to rename constraint: %w", err)
						}
					}

					err := tx.AutoMigrate(&types.User{})
					if err != nil {
						return fmt.Errorf("automigrating types.User: %w", err)
					}

					return nil
				},
				Rollback: func(db *gorm.DB) error { return nil },
			},
			{
				// The unique constraint of Name has been dropped
				// in favour of a unique together of name and
				// provider identity.
				ID: "202408181235",
				Migrate: func(tx *gorm.DB) error {
					err := tx.AutoMigrate(&types.User{})
					if err != nil {
						return fmt.Errorf("automigrating types.User: %w", err)
					}

					// Set up indexes and unique constraints outside of GORM, it does not support
					// conditional unique constraints.
					// This ensures the following:
					// - A user name and provider_identifier is unique
					// - A provider_identifier is unique
					// - A user name is unique if there is no provider_identifier is not set
					for _, idx := range []string{
						"DROP INDEX IF EXISTS idx_provider_identifier",
						"DROP INDEX IF EXISTS idx_name_provider_identifier",
						"CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_identifier ON users (provider_identifier) WHERE provider_identifier IS NOT NULL;",
						"CREATE UNIQUE INDEX IF NOT EXISTS idx_name_provider_identifier ON users (name,provider_identifier);",
						"CREATE UNIQUE INDEX IF NOT EXISTS idx_name_no_provider_identifier ON users (name) WHERE provider_identifier IS NULL;",
					} {
						err = tx.Exec(idx).Error
						if err != nil {
							return fmt.Errorf("creating username index: %w", err)
						}
					}

					return nil
				},
				Rollback: func(db *gorm.DB) error { return nil },
			},
			{
				// Add a constraint to routes ensuring they cannot exist without a node.
				ID: "202501221827",
				Migrate: func(tx *gorm.DB) error {
					// Remove any invalid routes associated with a node that does not exist.
					if tx.Migrator().HasTable(&types.Route{}) && tx.Migrator().HasTable(&types.Node{}) {
						err := tx.Exec("delete from routes where node_id not in (select id from nodes)").Error
						if err != nil {
							return err
						}
					}

					// Remove any invalid routes without a node_id.
					if tx.Migrator().HasTable(&types.Route{}) {
						err := tx.Exec("delete from routes where node_id is null").Error
						if err != nil {
							return err
						}
					}

					err := tx.AutoMigrate(&types.Route{})
					if err != nil {
						return fmt.Errorf("automigrating types.Route: %w", err)
					}

					return nil
				},
				Rollback: func(db *gorm.DB) error { return nil },
			},
			// Add back constraint so you cannot delete preauth keys that
			// is still used by a node.
			{
				ID: "202501311657",
				Migrate: func(tx *gorm.DB) error {
					err := tx.AutoMigrate(&types.PreAuthKey{})
					if err != nil {
						return fmt.Errorf("automigrating types.PreAuthKey: %w", err)
					}
					err = tx.AutoMigrate(&types.Node{})
					if err != nil {
						return fmt.Errorf("automigrating types.Node: %w", err)
					}

					return nil
				},
				Rollback: func(db *gorm.DB) error { return nil },
			},
			// Ensure there are no nodes referring to a deleted preauthkey.
			{
				ID: "202502070949",
				Migrate: func(tx *gorm.DB) error {
					if tx.Migrator().HasTable(&types.PreAuthKey{}) {
						err := tx.Exec(`
UPDATE nodes
SET auth_key_id = NULL
WHERE auth_key_id IS NOT NULL
AND auth_key_id NOT IN (
    SELECT id FROM pre_auth_keys
);
							`).Error
						if err != nil {
							return fmt.Errorf("setting auth_key to null on nodes with non-existing keys: %w", err)
						}
					}

					return nil
				},
				Rollback: func(db *gorm.DB) error { return nil },
			},
			// Migrate all routes from the Route table to the new field ApprovedRoutes
			// in the Node table. Then drop the Route table.
			{
				ID: "202502131714",
				Migrate: func(tx *gorm.DB) error {
					if !tx.Migrator().HasColumn(&types.Node{}, "approved_routes") {
						err := tx.Migrator().AddColumn(&types.Node{}, "approved_routes")
						if err != nil {
							return fmt.Errorf("adding column types.Node: %w", err)
						}
					}

					nodeRoutes := map[uint64][]netip.Prefix{}

					var routes []types.Route
					err = tx.Find(&routes).Error
					if err != nil {
						return fmt.Errorf("fetching routes: %w", err)
					}

					for _, route := range routes {
						if route.Enabled {
							nodeRoutes[route.NodeID] = append(nodeRoutes[route.NodeID], route.Prefix)
						}
					}

					for nodeID, routes := range nodeRoutes {
						tsaddr.SortPrefixes(routes)
						routes = slices.Compact(routes)

						data, err := json.Marshal(routes)

						err = tx.Model(&types.Node{}).Where("id = ?", nodeID).Update("approved_routes", data).Error
						if err != nil {
							return fmt.Errorf("saving approved routes to new column: %w", err)
						}
					}

					// Drop the old table.
					_ = tx.Migrator().DropTable(&types.Route{})

					return nil
				},
				Rollback: func(db *gorm.DB) error { return nil },
			},
			{
				ID: "202502171819",
				Migrate: func(tx *gorm.DB) error {
					// This migration originally removed the last_seen column
					// from the node table, but it was added back in
					// 202505091439.
					return nil
				},
				Rollback: func(db *gorm.DB) error { return nil },
			},
			// Add back last_seen column to node table.
			{
				ID: "202505091439",
				Migrate: func(tx *gorm.DB) error {
					// Add back last_seen column to node table if it does not exist.
					// This is a workaround for the fact that the last_seen column
					// was removed in the 202502171819 migration, but only for some
					// beta testers.
					if !tx.Migrator().HasColumn(&types.Node{}, "last_seen") {
						_ = tx.Migrator().AddColumn(&types.Node{}, "last_seen")
					}

					return nil
				},
				Rollback: func(db *gorm.DB) error { return nil },
			},
			// Fix the provider identifier for users that have a double slash in the
			// provider identifier.
			{
				ID: "202505141324",
				Migrate: func(tx *gorm.DB) error {
					users, err := ListUsers(tx)
					if err != nil {
						return fmt.Errorf("listing users: %w", err)
					}

					for _, user := range users {
						user.ProviderIdentifier.String = types.CleanIdentifier(user.ProviderIdentifier.String)

						err := tx.Save(user).Error
						if err != nil {
							return fmt.Errorf("saving user: %w", err)
						}
					}

					return nil
				},
				Rollback: func(db *gorm.DB) error { return nil },
			},
			// Schema migration to ensure all tables match the expected schema.
			// This migration recreates all tables to match the exact structure in schema.sql,
			// preserving all data during the process.
			// Only SQLite will be migrated for consistency.
			{
				ID: "202507021200",
				Migrate: func(tx *gorm.DB) error {
					// Only run on SQLite
					if cfg.Type != types.DatabaseSqlite {
						log.Info().Msg("Skipping schema migration on non-SQLite database")
						return nil
					}

					log.Info().Msg("Starting schema recreation with table renaming")

					// Rename existing tables to _old versions
					tablesToRename := []string{"users", "pre_auth_keys", "api_keys", "nodes", "policies"}

					// Check if routes table exists and drop it (should have been migrated already)
					var routesExists bool
					err := tx.Raw("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='routes'").Row().Scan(&routesExists)
					if err == nil && routesExists {
						log.Info().Msg("Dropping leftover routes table")
						if err := tx.Exec("DROP TABLE routes").Error; err != nil {
							return fmt.Errorf("dropping routes table: %w", err)
						}
					}

					// Drop all indexes first to avoid conflicts
					indexesToDrop := []string{
						"idx_users_deleted_at",
						"idx_provider_identifier",
						"idx_name_provider_identifier",
						"idx_name_no_provider_identifier",
						"idx_api_keys_prefix",
						"idx_policies_deleted_at",
					}

					for _, index := range indexesToDrop {
						_ = tx.Exec("DROP INDEX IF EXISTS " + index).Error
					}

					for _, table := range tablesToRename {
						// Check if table exists before renaming
						var exists bool
						err := tx.Raw("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?", table).Row().Scan(&exists)
						if err != nil {
							return fmt.Errorf("checking if table %s exists: %w", table, err)
						}

						if exists {
							// Drop old table if it exists from previous failed migration
							_ = tx.Exec("DROP TABLE IF EXISTS " + table + "_old").Error

							// Rename current table to _old
							if err := tx.Exec("ALTER TABLE " + table + " RENAME TO " + table + "_old").Error; err != nil {
								return fmt.Errorf("renaming table %s to %s_old: %w", table, table, err)
							}
						}
					}

					// Create new tables with correct schema
					tableCreationSQL := []string{
						`CREATE TABLE users(
  id integer PRIMARY KEY AUTOINCREMENT,
  name text,
  display_name text,
  email text,
  provider_identifier text,
  provider text,
  profile_pic_url text,
  created_at datetime,
  updated_at datetime,
  deleted_at datetime
)`,
						`CREATE TABLE pre_auth_keys(
  id integer PRIMARY KEY AUTOINCREMENT,
  key text,
  user_id integer,
  reusable numeric,
  ephemeral numeric DEFAULT false,
  used numeric DEFAULT false,
  tags text,
  expiration datetime,
  created_at datetime,
  CONSTRAINT fk_pre_auth_keys_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
)`,
						`CREATE TABLE api_keys(
  id integer PRIMARY KEY AUTOINCREMENT,
  prefix text,
  hash blob,
  expiration datetime,
  last_seen datetime,
  created_at datetime
)`,
						`CREATE TABLE nodes(
  id integer PRIMARY KEY AUTOINCREMENT,
  machine_key text,
  node_key text,
  disco_key text,
  endpoints text,
  host_info text,
  ipv4 text,
  ipv6 text,
  hostname text,
  given_name varchar(63),
  user_id integer,
  register_method text,
  forced_tags text,
  auth_key_id integer,
  last_seen datetime,
  expiry datetime,
  approved_routes text,
  created_at datetime,
  updated_at datetime,
  deleted_at datetime,
  CONSTRAINT fk_nodes_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_nodes_auth_key FOREIGN KEY(auth_key_id) REFERENCES pre_auth_keys(id)
)`,
						`CREATE TABLE policies(
  id integer PRIMARY KEY AUTOINCREMENT,
  data text,
  created_at datetime,
  updated_at datetime,
  deleted_at datetime
)`,
					}

					for _, createSQL := range tableCreationSQL {
						if err := tx.Exec(createSQL).Error; err != nil {
							return fmt.Errorf("creating new table: %w", err)
						}
					}

					// Copy data directly using SQL
					dataCopySQL := []string{
						`INSERT INTO users (id, name, display_name, email, provider_identifier, provider, profile_pic_url, created_at, updated_at, deleted_at)
             SELECT id, name, display_name, email, provider_identifier, provider, profile_pic_url, created_at, updated_at, deleted_at 
             FROM users_old`,

						`INSERT INTO pre_auth_keys (id, key, user_id, reusable, ephemeral, used, tags, expiration, created_at)
             SELECT id, key, user_id, reusable, ephemeral, used, tags, expiration, created_at 
             FROM pre_auth_keys_old`,

						`INSERT INTO api_keys (id, prefix, hash, expiration, last_seen, created_at)
             SELECT id, prefix, hash, expiration, last_seen, created_at 
             FROM api_keys_old`,

						`INSERT INTO nodes (id, machine_key, node_key, disco_key, endpoints, host_info, ipv4, ipv6, hostname, given_name, user_id, register_method, forced_tags, auth_key_id, last_seen, expiry, approved_routes, created_at, updated_at, deleted_at)
             SELECT id, machine_key, node_key, disco_key, endpoints, host_info, ipv4, ipv6, hostname, given_name, user_id, register_method, forced_tags, auth_key_id, last_seen, expiry, approved_routes, created_at, updated_at, deleted_at 
             FROM nodes_old`,

						`INSERT INTO policies (id, data, created_at, updated_at, deleted_at)
             SELECT id, data, created_at, updated_at, deleted_at 
             FROM policies_old`,
					}

					for _, copySQL := range dataCopySQL {
						if err := tx.Exec(copySQL).Error; err != nil {
							return fmt.Errorf("copying data: %w", err)
						}
					}

					// Create indexes
					indexes := []string{
						"CREATE INDEX idx_users_deleted_at ON users(deleted_at)",
						`CREATE UNIQUE INDEX idx_provider_identifier ON users(
  provider_identifier
) WHERE provider_identifier IS NOT NULL`,
						`CREATE UNIQUE INDEX idx_name_provider_identifier ON users(
  name,
  provider_identifier
)`,
						`CREATE UNIQUE INDEX idx_name_no_provider_identifier ON users(
  name
) WHERE provider_identifier IS NULL`,
						"CREATE UNIQUE INDEX idx_api_keys_prefix ON api_keys(prefix)",
						"CREATE INDEX idx_policies_deleted_at ON policies(deleted_at)",
					}

					for _, indexSQL := range indexes {
						if err := tx.Exec(indexSQL).Error; err != nil {
							return fmt.Errorf("creating index: %w", err)
						}
					}

					// Drop old tables only after everything succeeds
					for _, table := range tablesToRename {
						if err := tx.Exec("DROP TABLE IF EXISTS " + table + "_old").Error; err != nil {
							log.Warn().Str("table", table+"_old").Err(err).Msg("Failed to drop old table, but migration succeeded")
						}
					}

					log.Info().Msg("Schema recreation completed successfully")

					return nil
				},
				Rollback: func(db *gorm.DB) error { return nil },
			},
			// From this point, the following rules must be followed:
			// - NEVER use gorm.AutoMigrate, write the exact migration steps needed
			// - AutoMigrate depends on the struct staying exactly the same, which it wont over time.
			// - Never write migrations that requires foreign keys to be disabled.
		},
	)

	if err := runMigrations(cfg, dbConn, migrations); err != nil {
		log.Fatal().Err(err).Msgf("Migration failed: %v", err)
	}

	// Validate that the schema ends up in the expected state.
	// This is currently only done on sqlite as squibble does not
	// support Postgres and we use our sqlite schema as our source of
	// truth.
	if cfg.Type == types.DatabaseSqlite {
		sqlConn, err := dbConn.DB()
		if err != nil {
			return nil, fmt.Errorf("getting DB from gorm: %w", err)
		}

		// or else it blocks...
		sqlConn.SetMaxIdleConns(maxIdleConns)
		sqlConn.SetMaxOpenConns(maxOpenConns)
		defer sqlConn.SetMaxIdleConns(1)
		defer sqlConn.SetMaxOpenConns(1)

		ctx, cancel := context.WithTimeout(context.Background(), contextTimeoutSecs*time.Second)
		defer cancel()

		if err := squibble.Validate(ctx, sqlConn, dbSchema); err != nil {
			return nil, fmt.Errorf("validating schema: %w", err)
		}
	}

	db := HSDatabase{
		DB:       dbConn,
		cfg:      &cfg,
		regCache: regCache,

		baseDomain: baseDomain,
	}

	return &db, err
}

func openDB(cfg types.DatabaseConfig) (*gorm.DB, error) {
	// TODO(kradalby): Integrate this with zerolog
	var dbLogger logger.Interface
	if cfg.Debug {
		dbLogger = util.NewDBLogWrapper(&log.Logger, cfg.Gorm.SlowThreshold, cfg.Gorm.SkipErrRecordNotFound, cfg.Gorm.ParameterizedQueries)
	} else {
		dbLogger = logger.Default.LogMode(logger.Silent)
	}

	switch cfg.Type {
	case types.DatabaseSqlite:
		dir := filepath.Dir(cfg.Sqlite.Path)
		err := util.EnsureDir(dir)
		if err != nil {
			return nil, fmt.Errorf("creating directory for sqlite: %w", err)
		}

		log.Info().
			Str("database", types.DatabaseSqlite).
			Str("path", cfg.Sqlite.Path).
			Msg("Opening database")

		// Build SQLite configuration with pragmas set at connection time
		sqliteConfig := sqliteconfig.Default(cfg.Sqlite.Path)
		if cfg.Sqlite.WriteAheadLog {
			sqliteConfig.JournalMode = sqliteconfig.JournalModeWAL
			sqliteConfig.WALAutocheckpoint = cfg.Sqlite.WALAutoCheckPoint
		}

		connectionURL, err := sqliteConfig.ToURL()
		if err != nil {
			return nil, fmt.Errorf("building sqlite connection URL: %w", err)
		}

		db, err := gorm.Open(
			sqlite.Open(connectionURL),
			&gorm.Config{
				PrepareStmt: cfg.Gorm.PrepareStmt,
				Logger:      dbLogger,
			},
		)

		// The pure Go SQLite library does not handle locking in
		// the same way as the C based one and we can't use the gorm
		// connection pool as of 2022/02/23.
		sqlDB, _ := db.DB()
		sqlDB.SetMaxIdleConns(1)
		sqlDB.SetMaxOpenConns(1)
		sqlDB.SetConnMaxIdleTime(time.Hour)

		return db, err

	case types.DatabasePostgres:
		dbString := fmt.Sprintf(
			"host=%s dbname=%s user=%s",
			cfg.Postgres.Host,
			cfg.Postgres.Name,
			cfg.Postgres.User,
		)

		log.Info().
			Str("database", types.DatabasePostgres).
			Str("path", dbString).
			Msg("Opening database")

		if sslEnabled, err := strconv.ParseBool(cfg.Postgres.Ssl); err == nil {
			if !sslEnabled {
				dbString += " sslmode=disable"
			}
		} else {
			dbString += " sslmode=" + cfg.Postgres.Ssl
		}

		if cfg.Postgres.Port != 0 {
			dbString += fmt.Sprintf(" port=%d", cfg.Postgres.Port)
		}

		if cfg.Postgres.Pass != "" {
			dbString += " password=" + cfg.Postgres.Pass
		}

		db, err := gorm.Open(postgres.Open(dbString), &gorm.Config{
			Logger: dbLogger,
		})
		if err != nil {
			return nil, err
		}

		sqlDB, _ := db.DB()
		sqlDB.SetMaxIdleConns(cfg.Postgres.MaxIdleConnections)
		sqlDB.SetMaxOpenConns(cfg.Postgres.MaxOpenConnections)
		sqlDB.SetConnMaxIdleTime(
			time.Duration(cfg.Postgres.ConnMaxIdleTimeSecs) * time.Second,
		)

		return db, nil
	}

	return nil, fmt.Errorf(
		"database of type %s is not supported: %w",
		cfg.Type,
		errDatabaseNotSupported,
	)
}

func runMigrations(cfg types.DatabaseConfig, dbConn *gorm.DB, migrations *gormigrate.Gormigrate) error {
	if cfg.Type == types.DatabaseSqlite {
		// SQLite: Run migrations step-by-step, only disabling foreign keys when necessary

		// List of migration IDs that require foreign keys to be disabled
		// These are migrations that perform complex schema changes that GORM cannot handle safely with FK enabled
		// NO NEW MIGRATIONS SHOULD BE ADDED HERE. ALL NEW MIGRATIONS MUST RUN WITH FOREIGN KEYS ENABLED.
		migrationsRequiringFKDisabled := map[string]bool{
			"202312101416":  true, // Initial migration with complex table/column renames
			"202402151347":  true, // Migration that removes last_successful_update column
			"2024041121742": true, // Migration that changes IP address storage format
			"202407191627":  true, // User table automigration with FK constraint issues
			"202408181235":  true, // User table automigration with FK constraint issues
			"202501221827":  true, // Route table automigration with FK constraint issues
			"202501311657":  true, // PreAuthKey table automigration with FK constraint issues
			// Add other migration IDs here as they are identified to need FK disabled
		}

		// Get the current foreign key status
		var fkOriginallyEnabled int
		if err := dbConn.Raw("PRAGMA foreign_keys").Scan(&fkOriginallyEnabled).Error; err != nil {
			return fmt.Errorf("checking foreign key status: %w", err)
		}

		// Get all migration IDs in order from the actual migration definitions
		// Only IDs that are in the migrationsRequiringFKDisabled map will be processed with FK disabled
		// any other new migrations are ran after.
		migrationIDs := []string{
			"202312101416",
			"202312101430",
			"202402151347",
			"2024041121742",
			"202406021630",
			"202407191627",
			"202408181235",
			"202409271400",
			"202501221827",
			"202501311657",
			"202502070949",
			"202502131714",
			"202502171819",
			"202505091439",
			"202505141324",
			// As of 2025-07-02, no new IDs should be added here.
			// They will be ran by the migrations.Migrate() call below.
		}

		for _, migrationID := range migrationIDs {
			log.Trace().Str("migration_id", migrationID).Msg("Running migration")
			needsFKDisabled := migrationsRequiringFKDisabled[migrationID]

			if needsFKDisabled {
				// Disable foreign keys for this migration
				if err := dbConn.Exec("PRAGMA foreign_keys = OFF").Error; err != nil {
					return fmt.Errorf("disabling foreign keys for migration %s: %w", migrationID, err)
				}
			} else {
				// Ensure foreign keys are enabled for this migration
				if err := dbConn.Exec("PRAGMA foreign_keys = ON").Error; err != nil {
					return fmt.Errorf("enabling foreign keys for migration %s: %w", migrationID, err)
				}
			}

			// Run up to this specific migration (will only run the next pending migration)
			if err := migrations.MigrateTo(migrationID); err != nil {
				return fmt.Errorf("running migration %s: %w", migrationID, err)
			}
		}

		if err := dbConn.Exec("PRAGMA foreign_keys = ON").Error; err != nil {
			return fmt.Errorf("restoring foreign keys: %w", err)
		}

		// Run the rest of the migrations
		if err := migrations.Migrate(); err != nil {
			return err
		}

		// Check for constraint violations at the end
		type constraintViolation struct {
			Table           string
			RowID           int
			Parent          string
			ConstraintIndex int
		}

		var violatedConstraints []constraintViolation

		rows, err := dbConn.Raw("PRAGMA foreign_key_check").Rows()
		if err != nil {
			return err
		}

		for rows.Next() {
			var violation constraintViolation
			if err := rows.Scan(&violation.Table, &violation.RowID, &violation.Parent, &violation.ConstraintIndex); err != nil {
				return err
			}

			violatedConstraints = append(violatedConstraints, violation)
		}
		_ = rows.Close()

		if len(violatedConstraints) > 0 {
			for _, violation := range violatedConstraints {
				log.Error().
					Str("table", violation.Table).
					Int("row_id", violation.RowID).
					Str("parent", violation.Parent).
					Msg("Foreign key constraint violated")
			}

			return errForeignKeyConstraintsViolated
		}
	} else {
		// PostgreSQL can run all migrations in one block - no foreign key issues
		if err := migrations.Migrate(); err != nil {
			return err
		}
	}

	return nil
}

func (hsdb *HSDatabase) PingDB(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, time.Second)
	defer cancel()
	sqlDB, err := hsdb.DB.DB()
	if err != nil {
		return err
	}

	return sqlDB.PingContext(ctx)
}

func (hsdb *HSDatabase) Close() error {
	db, err := hsdb.DB.DB()
	if err != nil {
		return err
	}

	if hsdb.cfg.Type == types.DatabaseSqlite && hsdb.cfg.Sqlite.WriteAheadLog {
		db.Exec("VACUUM")
	}

	return db.Close()
}

func (hsdb *HSDatabase) Read(fn func(rx *gorm.DB) error) error {
	rx := hsdb.DB.Begin()
	defer rx.Rollback()
	return fn(rx)
}

func Read[T any](db *gorm.DB, fn func(rx *gorm.DB) (T, error)) (T, error) {
	rx := db.Begin()
	defer rx.Rollback()
	ret, err := fn(rx)
	if err != nil {
		var no T
		return no, err
	}

	return ret, nil
}

func (hsdb *HSDatabase) Write(fn func(tx *gorm.DB) error) error {
	tx := hsdb.DB.Begin()
	defer tx.Rollback()
	if err := fn(tx); err != nil {
		return err
	}

	return tx.Commit().Error
}

func Write[T any](db *gorm.DB, fn func(tx *gorm.DB) (T, error)) (T, error) {
	tx := db.Begin()
	defer tx.Rollback()
	ret, err := fn(tx)
	if err != nil {
		var no T
		return no, err
	}

	return ret, tx.Commit().Error
}
