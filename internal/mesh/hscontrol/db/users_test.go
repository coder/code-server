package db

import (
	"strings"

	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/juanfont/headscale/hscontrol/util"
	"gopkg.in/check.v1"
	"gorm.io/gorm"
	"tailscale.com/types/ptr"
)

func (s *Suite) TestCreateAndDestroyUser(c *check.C) {
	user, err := db.CreateUser(types.User{Name: "test"})
	c.Assert(err, check.IsNil)
	c.Assert(user.Name, check.Equals, "test")

	users, err := db.ListUsers()
	c.Assert(err, check.IsNil)
	c.Assert(len(users), check.Equals, 1)

	err = db.DestroyUser(types.UserID(user.ID))
	c.Assert(err, check.IsNil)

	_, err = db.GetUserByID(types.UserID(user.ID))
	c.Assert(err, check.NotNil)
}

func (s *Suite) TestDestroyUserErrors(c *check.C) {
	err := db.DestroyUser(9998)
	c.Assert(err, check.Equals, ErrUserNotFound)

	user, err := db.CreateUser(types.User{Name: "test"})
	c.Assert(err, check.IsNil)

	pak, err := db.CreatePreAuthKey(types.UserID(user.ID), false, false, nil, nil)
	c.Assert(err, check.IsNil)

	err = db.DestroyUser(types.UserID(user.ID))
	c.Assert(err, check.IsNil)

	result := db.DB.Preload("User").First(&pak, "key = ?", pak.Key)
	// destroying a user also deletes all associated preauthkeys
	c.Assert(result.Error, check.Equals, gorm.ErrRecordNotFound)

	user, err = db.CreateUser(types.User{Name: "test"})
	c.Assert(err, check.IsNil)

	pak, err = db.CreatePreAuthKey(types.UserID(user.ID), false, false, nil, nil)
	c.Assert(err, check.IsNil)

	node := types.Node{
		ID:             0,
		Hostname:       "testnode",
		UserID:         user.ID,
		RegisterMethod: util.RegisterMethodAuthKey,
		AuthKeyID:      ptr.To(pak.ID),
	}
	trx := db.DB.Save(&node)
	c.Assert(trx.Error, check.IsNil)

	err = db.DestroyUser(types.UserID(user.ID))
	c.Assert(err, check.Equals, ErrUserStillHasNodes)
}

func (s *Suite) TestRenameUser(c *check.C) {
	userTest, err := db.CreateUser(types.User{Name: "test"})
	c.Assert(err, check.IsNil)
	c.Assert(userTest.Name, check.Equals, "test")

	users, err := db.ListUsers()
	c.Assert(err, check.IsNil)
	c.Assert(len(users), check.Equals, 1)

	err = db.RenameUser(types.UserID(userTest.ID), "test-renamed")
	c.Assert(err, check.IsNil)

	users, err = db.ListUsers(&types.User{Name: "test"})
	c.Assert(err, check.Equals, nil)
	c.Assert(len(users), check.Equals, 0)

	users, err = db.ListUsers(&types.User{Name: "test-renamed"})
	c.Assert(err, check.IsNil)
	c.Assert(len(users), check.Equals, 1)

	err = db.RenameUser(99988, "test")
	c.Assert(err, check.Equals, ErrUserNotFound)

	userTest2, err := db.CreateUser(types.User{Name: "test2"})
	c.Assert(err, check.IsNil)
	c.Assert(userTest2.Name, check.Equals, "test2")

	want := "UNIQUE constraint failed"
	err = db.RenameUser(types.UserID(userTest2.ID), "test-renamed")
	if err == nil || !strings.Contains(err.Error(), want) {
		c.Fatalf("expected failure with unique constraint, want: %q got: %q", want, err)
	}
}

func (s *Suite) TestSetMachineUser(c *check.C) {
	oldUser, err := db.CreateUser(types.User{Name: "old"})
	c.Assert(err, check.IsNil)

	newUser, err := db.CreateUser(types.User{Name: "new"})
	c.Assert(err, check.IsNil)

	pak, err := db.CreatePreAuthKey(types.UserID(oldUser.ID), false, false, nil, nil)
	c.Assert(err, check.IsNil)

	node := types.Node{
		ID:             12,
		Hostname:       "testnode",
		UserID:         oldUser.ID,
		RegisterMethod: util.RegisterMethodAuthKey,
		AuthKeyID:      ptr.To(pak.ID),
	}
	trx := db.DB.Save(&node)
	c.Assert(trx.Error, check.IsNil)
	c.Assert(node.UserID, check.Equals, oldUser.ID)

	err = db.Write(func(tx *gorm.DB) error {
		return AssignNodeToUser(tx, 12, types.UserID(newUser.ID))
	})
	c.Assert(err, check.IsNil)
	// Reload node from database to see updated values
	updatedNode, err := db.GetNodeByID(12)
	c.Assert(err, check.IsNil)
	c.Assert(updatedNode.UserID, check.Equals, newUser.ID)
	c.Assert(updatedNode.User.Name, check.Equals, newUser.Name)

	err = db.Write(func(tx *gorm.DB) error {
		return AssignNodeToUser(tx, 12, 9584849)
	})
	c.Assert(err, check.Equals, ErrUserNotFound)

	err = db.Write(func(tx *gorm.DB) error {
		return AssignNodeToUser(tx, 12, types.UserID(newUser.ID))
	})
	c.Assert(err, check.IsNil)
	// Reload node from database again to see updated values
	finalNode, err := db.GetNodeByID(12)
	c.Assert(err, check.IsNil)
	c.Assert(finalNode.UserID, check.Equals, newUser.ID)
	c.Assert(finalNode.User.Name, check.Equals, newUser.Name)
}
