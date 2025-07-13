package db

import (
	"time"

	"gopkg.in/check.v1"
)

func (*Suite) TestCreateAPIKey(c *check.C) {
	apiKeyStr, apiKey, err := db.CreateAPIKey(nil)
	c.Assert(err, check.IsNil)
	c.Assert(apiKey, check.NotNil)

	// Did we get a valid key?
	c.Assert(apiKey.Prefix, check.NotNil)
	c.Assert(apiKey.Hash, check.NotNil)
	c.Assert(apiKeyStr, check.Not(check.Equals), "")

	_, err = db.ListAPIKeys()
	c.Assert(err, check.IsNil)

	keys, err := db.ListAPIKeys()
	c.Assert(err, check.IsNil)
	c.Assert(len(keys), check.Equals, 1)
}

func (*Suite) TestAPIKeyDoesNotExist(c *check.C) {
	key, err := db.GetAPIKey("does-not-exist")
	c.Assert(err, check.NotNil)
	c.Assert(key, check.IsNil)
}

func (*Suite) TestValidateAPIKeyOk(c *check.C) {
	nowPlus2 := time.Now().Add(2 * time.Hour)
	apiKeyStr, apiKey, err := db.CreateAPIKey(&nowPlus2)
	c.Assert(err, check.IsNil)
	c.Assert(apiKey, check.NotNil)

	valid, err := db.ValidateAPIKey(apiKeyStr)
	c.Assert(err, check.IsNil)
	c.Assert(valid, check.Equals, true)
}

func (*Suite) TestValidateAPIKeyNotOk(c *check.C) {
	nowMinus2 := time.Now().Add(time.Duration(-2) * time.Hour)
	apiKeyStr, apiKey, err := db.CreateAPIKey(&nowMinus2)
	c.Assert(err, check.IsNil)
	c.Assert(apiKey, check.NotNil)

	valid, err := db.ValidateAPIKey(apiKeyStr)
	c.Assert(err, check.IsNil)
	c.Assert(valid, check.Equals, false)

	now := time.Now()
	apiKeyStrNow, apiKey, err := db.CreateAPIKey(&now)
	c.Assert(err, check.IsNil)
	c.Assert(apiKey, check.NotNil)

	validNow, err := db.ValidateAPIKey(apiKeyStrNow)
	c.Assert(err, check.IsNil)
	c.Assert(validNow, check.Equals, false)

	validSilly, err := db.ValidateAPIKey("nota.validkey")
	c.Assert(err, check.NotNil)
	c.Assert(validSilly, check.Equals, false)

	validWithErr, err := db.ValidateAPIKey("produceerrorkey")
	c.Assert(err, check.NotNil)
	c.Assert(validWithErr, check.Equals, false)
}

func (*Suite) TestExpireAPIKey(c *check.C) {
	nowPlus2 := time.Now().Add(2 * time.Hour)
	apiKeyStr, apiKey, err := db.CreateAPIKey(&nowPlus2)
	c.Assert(err, check.IsNil)
	c.Assert(apiKey, check.NotNil)

	valid, err := db.ValidateAPIKey(apiKeyStr)
	c.Assert(err, check.IsNil)
	c.Assert(valid, check.Equals, true)

	err = db.ExpireAPIKey(apiKey)
	c.Assert(err, check.IsNil)
	c.Assert(apiKey.Expiration, check.NotNil)

	notValid, err := db.ValidateAPIKey(apiKeyStr)
	c.Assert(err, check.IsNil)
	c.Assert(notValid, check.Equals, false)
}
