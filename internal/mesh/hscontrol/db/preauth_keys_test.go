package db

import (
	"sort"
	"testing"

	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gopkg.in/check.v1"
	"tailscale.com/types/ptr"
)

func (*Suite) TestCreatePreAuthKey(c *check.C) {
	// ID does not exist
	_, err := db.CreatePreAuthKey(12345, true, false, nil, nil)
	c.Assert(err, check.NotNil)

	user, err := db.CreateUser(types.User{Name: "test"})
	c.Assert(err, check.IsNil)

	key, err := db.CreatePreAuthKey(types.UserID(user.ID), true, false, nil, nil)
	c.Assert(err, check.IsNil)

	// Did we get a valid key?
	c.Assert(key.Key, check.NotNil)
	c.Assert(len(key.Key), check.Equals, 48)

	// Make sure the User association is populated
	c.Assert(key.User.ID, check.Equals, user.ID)

	// ID does not exist
	_, err = db.ListPreAuthKeys(1000000)
	c.Assert(err, check.NotNil)

	keys, err := db.ListPreAuthKeys(types.UserID(user.ID))
	c.Assert(err, check.IsNil)
	c.Assert(len(keys), check.Equals, 1)

	// Make sure the User association is populated
	c.Assert((keys)[0].User.ID, check.Equals, user.ID)
}

func (*Suite) TestPreAuthKeyACLTags(c *check.C) {
	user, err := db.CreateUser(types.User{Name: "test8"})
	c.Assert(err, check.IsNil)

	_, err = db.CreatePreAuthKey(types.UserID(user.ID), false, false, nil, []string{"badtag"})
	c.Assert(err, check.NotNil) // Confirm that malformed tags are rejected

	tags := []string{"tag:test1", "tag:test2"}
	tagsWithDuplicate := []string{"tag:test1", "tag:test2", "tag:test2"}
	_, err = db.CreatePreAuthKey(types.UserID(user.ID), false, false, nil, tagsWithDuplicate)
	c.Assert(err, check.IsNil)

	listedPaks, err := db.ListPreAuthKeys(types.UserID(user.ID))
	c.Assert(err, check.IsNil)
	gotTags := listedPaks[0].Proto().GetAclTags()
	sort.Sort(sort.StringSlice(gotTags))
	c.Assert(gotTags, check.DeepEquals, tags)
}

func TestCannotDeleteAssignedPreAuthKey(t *testing.T) {
	db, err := newSQLiteTestDB()
	require.NoError(t, err)
	user, err := db.CreateUser(types.User{Name: "test8"})
	assert.NoError(t, err)

	key, err := db.CreatePreAuthKey(types.UserID(user.ID), false, false, nil, []string{"tag:good"})
	assert.NoError(t, err)

	node := types.Node{
		ID:             0,
		Hostname:       "testest",
		UserID:         user.ID,
		RegisterMethod: util.RegisterMethodAuthKey,
		AuthKeyID:      ptr.To(key.ID),
	}
	db.DB.Save(&node)

	err = db.DB.Delete(key).Error
	require.ErrorContains(t, err, "constraint failed: FOREIGN KEY constraint failed")
}
