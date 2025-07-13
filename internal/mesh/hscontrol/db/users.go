package db

import (
	"errors"
	"fmt"

	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/juanfont/headscale/hscontrol/util"
	"gorm.io/gorm"
)

var (
	ErrUserExists        = errors.New("user already exists")
	ErrUserNotFound      = errors.New("user not found")
	ErrUserStillHasNodes = errors.New("user not empty: node(s) found")
)

func (hsdb *HSDatabase) CreateUser(user types.User) (*types.User, error) {
	return Write(hsdb.DB, func(tx *gorm.DB) (*types.User, error) {
		return CreateUser(tx, user)
	})
}

// CreateUser creates a new User. Returns error if could not be created
// or another user already exists.
func CreateUser(tx *gorm.DB, user types.User) (*types.User, error) {
	err := util.ValidateUsername(user.Name)
	if err != nil {
		return nil, err
	}
	if err := tx.Create(&user).Error; err != nil {
		return nil, fmt.Errorf("creating user: %w", err)
	}

	return &user, nil
}

func (hsdb *HSDatabase) DestroyUser(uid types.UserID) error {
	return hsdb.Write(func(tx *gorm.DB) error {
		return DestroyUser(tx, uid)
	})
}

// DestroyUser destroys a User. Returns error if the User does
// not exist or if there are nodes associated with it.
func DestroyUser(tx *gorm.DB, uid types.UserID) error {
	user, err := GetUserByID(tx, uid)
	if err != nil {
		return err
	}

	nodes, err := ListNodesByUser(tx, uid)
	if err != nil {
		return err
	}
	if len(nodes) > 0 {
		return ErrUserStillHasNodes
	}

	keys, err := ListPreAuthKeysByUser(tx, uid)
	if err != nil {
		return err
	}
	for _, key := range keys {
		err = DestroyPreAuthKey(tx, key)
		if err != nil {
			return err
		}
	}

	if result := tx.Unscoped().Delete(&user); result.Error != nil {
		return result.Error
	}

	return nil
}

func (hsdb *HSDatabase) RenameUser(uid types.UserID, newName string) error {
	return hsdb.Write(func(tx *gorm.DB) error {
		return RenameUser(tx, uid, newName)
	})
}

var ErrCannotChangeOIDCUser = errors.New("cannot edit OIDC user")

// RenameUser renames a User. Returns error if the User does
// not exist or if another User exists with the new name.
func RenameUser(tx *gorm.DB, uid types.UserID, newName string) error {
	var err error
	oldUser, err := GetUserByID(tx, uid)
	if err != nil {
		return err
	}
	err = util.ValidateUsername(newName)
	if err != nil {
		return err
	}

	if oldUser.Provider == util.RegisterMethodOIDC {
		return ErrCannotChangeOIDCUser
	}

	oldUser.Name = newName

	if err := tx.Save(&oldUser).Error; err != nil {
		return err
	}

	return nil
}

func (hsdb *HSDatabase) GetUserByID(uid types.UserID) (*types.User, error) {
	return Read(hsdb.DB, func(rx *gorm.DB) (*types.User, error) {
		return GetUserByID(rx, uid)
	})
}

func GetUserByID(tx *gorm.DB, uid types.UserID) (*types.User, error) {
	user := types.User{}
	if result := tx.First(&user, "id = ?", uid); errors.Is(
		result.Error,
		gorm.ErrRecordNotFound,
	) {
		return nil, ErrUserNotFound
	}

	return &user, nil
}

func (hsdb *HSDatabase) GetUserByOIDCIdentifier(id string) (*types.User, error) {
	return Read(hsdb.DB, func(rx *gorm.DB) (*types.User, error) {
		return GetUserByOIDCIdentifier(rx, id)
	})
}

func GetUserByOIDCIdentifier(tx *gorm.DB, id string) (*types.User, error) {
	user := types.User{}
	if result := tx.First(&user, "provider_identifier = ?", id); errors.Is(
		result.Error,
		gorm.ErrRecordNotFound,
	) {
		return nil, ErrUserNotFound
	}

	return &user, nil
}

func (hsdb *HSDatabase) ListUsers(where ...*types.User) ([]types.User, error) {
	return Read(hsdb.DB, func(rx *gorm.DB) ([]types.User, error) {
		return ListUsers(rx, where...)
	})
}

// ListUsers gets all the existing users.
func ListUsers(tx *gorm.DB, where ...*types.User) ([]types.User, error) {
	if len(where) > 1 {
		return nil, fmt.Errorf("expect 0 or 1 where User structs, got %d", len(where))
	}

	var user *types.User
	if len(where) == 1 {
		user = where[0]
	}

	users := []types.User{}
	if err := tx.Where(user).Find(&users).Error; err != nil {
		return nil, err
	}

	return users, nil
}

// GetUserByName returns a user if the provided username is
// unique, and otherwise an error.
func (hsdb *HSDatabase) GetUserByName(name string) (*types.User, error) {
	users, err := hsdb.ListUsers(&types.User{Name: name})
	if err != nil {
		return nil, err
	}

	if len(users) == 0 {
		return nil, ErrUserNotFound
	}

	if len(users) != 1 {
		return nil, fmt.Errorf("expected exactly one user, found %d", len(users))
	}

	return &users[0], nil
}

// ListNodesByUser gets all the nodes in a given user.
func ListNodesByUser(tx *gorm.DB, uid types.UserID) (types.Nodes, error) {
	nodes := types.Nodes{}
	if err := tx.Preload("AuthKey").Preload("AuthKey.User").Preload("User").Where(&types.Node{UserID: uint(uid)}).Find(&nodes).Error; err != nil {
		return nil, err
	}

	return nodes, nil
}

// AssignNodeToUser assigns a Node to a user.
func AssignNodeToUser(tx *gorm.DB, nodeID types.NodeID, uid types.UserID) error {
	node, err := GetNodeByID(tx, nodeID)
	if err != nil {
		return err
	}
	user, err := GetUserByID(tx, uid)
	if err != nil {
		return err
	}
	node.User = *user
	node.UserID = user.ID
	if result := tx.Save(&node); result.Error != nil {
		return result.Error
	}

	return nil
}
