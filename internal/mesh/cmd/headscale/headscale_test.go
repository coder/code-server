package main

import (
	"io/fs"
	"os"
	"path/filepath"
	"testing"

	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/spf13/viper"
	"gopkg.in/check.v1"
)

func Test(t *testing.T) {
	check.TestingT(t)
}

var _ = check.Suite(&Suite{})

type Suite struct{}

func (s *Suite) SetUpSuite(c *check.C) {
}

func (s *Suite) TearDownSuite(c *check.C) {
}

func (*Suite) TestConfigFileLoading(c *check.C) {
	tmpDir, err := os.MkdirTemp("", "headscale")
	if err != nil {
		c.Fatal(err)
	}
	defer os.RemoveAll(tmpDir)

	path, err := os.Getwd()
	if err != nil {
		c.Fatal(err)
	}

	cfgFile := filepath.Join(tmpDir, "config.yaml")

	// Symlink the example config file
	err = os.Symlink(
		filepath.Clean(path+"/../../config-example.yaml"),
		cfgFile,
	)
	if err != nil {
		c.Fatal(err)
	}

	// Load example config, it should load without validation errors
	err = types.LoadConfig(cfgFile, true)
	c.Assert(err, check.IsNil)

	// Test that config file was interpreted correctly
	c.Assert(viper.GetString("server_url"), check.Equals, "http://127.0.0.1:8080")
	c.Assert(viper.GetString("listen_addr"), check.Equals, "127.0.0.1:8080")
	c.Assert(viper.GetString("metrics_listen_addr"), check.Equals, "127.0.0.1:9090")
	c.Assert(viper.GetString("database.type"), check.Equals, "sqlite")
	c.Assert(viper.GetString("database.sqlite.path"), check.Equals, "/var/lib/headscale/db.sqlite")
	c.Assert(viper.GetString("tls_letsencrypt_hostname"), check.Equals, "")
	c.Assert(viper.GetString("tls_letsencrypt_listen"), check.Equals, ":http")
	c.Assert(viper.GetString("tls_letsencrypt_challenge_type"), check.Equals, "HTTP-01")
	c.Assert(
		util.GetFileMode("unix_socket_permission"),
		check.Equals,
		fs.FileMode(0o770),
	)
	c.Assert(viper.GetBool("logtail.enabled"), check.Equals, false)
}

func (*Suite) TestConfigLoading(c *check.C) {
	tmpDir, err := os.MkdirTemp("", "headscale")
	if err != nil {
		c.Fatal(err)
	}
	defer os.RemoveAll(tmpDir)

	path, err := os.Getwd()
	if err != nil {
		c.Fatal(err)
	}

	// Symlink the example config file
	err = os.Symlink(
		filepath.Clean(path+"/../../config-example.yaml"),
		filepath.Join(tmpDir, "config.yaml"),
	)
	if err != nil {
		c.Fatal(err)
	}

	// Load example config, it should load without validation errors
	err = types.LoadConfig(tmpDir, false)
	c.Assert(err, check.IsNil)

	// Test that config file was interpreted correctly
	c.Assert(viper.GetString("server_url"), check.Equals, "http://127.0.0.1:8080")
	c.Assert(viper.GetString("listen_addr"), check.Equals, "127.0.0.1:8080")
	c.Assert(viper.GetString("metrics_listen_addr"), check.Equals, "127.0.0.1:9090")
	c.Assert(viper.GetString("database.type"), check.Equals, "sqlite")
	c.Assert(viper.GetString("database.sqlite.path"), check.Equals, "/var/lib/headscale/db.sqlite")
	c.Assert(viper.GetString("tls_letsencrypt_hostname"), check.Equals, "")
	c.Assert(viper.GetString("tls_letsencrypt_listen"), check.Equals, ":http")
	c.Assert(viper.GetString("tls_letsencrypt_challenge_type"), check.Equals, "HTTP-01")
	c.Assert(
		util.GetFileMode("unix_socket_permission"),
		check.Equals,
		fs.FileMode(0o770),
	)
	c.Assert(viper.GetBool("logtail.enabled"), check.Equals, false)
	c.Assert(viper.GetBool("randomize_client_port"), check.Equals, false)
}
