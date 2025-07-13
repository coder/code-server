package db

import (
	"log"
	"net/url"
	"os"
	"strconv"
	"strings"
	"testing"

	"github.com/juanfont/headscale/hscontrol/types"
	"gopkg.in/check.v1"
	"zombiezen.com/go/postgrestest"
)

func Test(t *testing.T) {
	check.TestingT(t)
}

var _ = check.Suite(&Suite{})

type Suite struct{}

var (
	tmpDir string
	db     *HSDatabase
)

func (s *Suite) SetUpTest(c *check.C) {
	s.ResetDB(c)
}

func (s *Suite) TearDownTest(c *check.C) {
	// os.RemoveAll(tmpDir)
}

func (s *Suite) ResetDB(c *check.C) {
	// if len(tmpDir) != 0 {
	// 	os.RemoveAll(tmpDir)
	// }

	var err error
	db, err = newSQLiteTestDB()
	if err != nil {
		c.Fatal(err)
	}
}

// TODO(kradalby): make this a t.Helper when we dont depend
// on check test framework.
func newSQLiteTestDB() (*HSDatabase, error) {
	var err error
	tmpDir, err = os.MkdirTemp("", "headscale-db-test-*")
	if err != nil {
		return nil, err
	}

	log.Printf("database path: %s", tmpDir+"/headscale_test.db")

	db, err = NewHeadscaleDatabase(
		types.DatabaseConfig{
			Type: types.DatabaseSqlite,
			Sqlite: types.SqliteConfig{
				Path: tmpDir + "/headscale_test.db",
			},
		},
		"",
		emptyCache(),
	)
	if err != nil {
		return nil, err
	}

	return db, nil
}

func newPostgresTestDB(t *testing.T) *HSDatabase {
	t.Helper()

	return newHeadscaleDBFromPostgresURL(t, newPostgresDBForTest(t))
}

func newPostgresDBForTest(t *testing.T) *url.URL {
	t.Helper()

	ctx := t.Context()
	srv, err := postgrestest.Start(ctx)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(srv.Cleanup)

	u, err := srv.CreateDatabase(ctx)
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("created local postgres: %s", u)
	pu, _ := url.Parse(u)

	return pu
}

func newHeadscaleDBFromPostgresURL(t *testing.T, pu *url.URL) *HSDatabase {
	t.Helper()

	pass, _ := pu.User.Password()
	port, _ := strconv.Atoi(pu.Port())

	db, err := NewHeadscaleDatabase(
		types.DatabaseConfig{
			Type: types.DatabasePostgres,
			Postgres: types.PostgresConfig{
				Host: pu.Hostname(),
				User: pu.User.Username(),
				Name: strings.TrimLeft(pu.Path, "/"),
				Pass: pass,
				Port: port,
				Ssl:  "disable",
			},
		},
		"",
		emptyCache(),
	)
	if err != nil {
		t.Fatal(err)
	}

	return db
}
