package db

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/juanfont/headscale/hscontrol/types"
	"gorm.io/gorm"
	"tailscale.com/util/set"
)

var (
	ErrPreAuthKeyNotFound          = errors.New("AuthKey not found")
	ErrPreAuthKeyExpired           = errors.New("AuthKey expired")
	ErrSingleUseAuthKeyHasBeenUsed = errors.New("AuthKey has already been used")
	ErrUserMismatch                = errors.New("user mismatch")
	ErrPreAuthKeyACLTagInvalid     = errors.New("AuthKey tag is invalid")
)

func (hsdb *HSDatabase) CreatePreAuthKey(
	uid types.UserID,
	reusable bool,
	ephemeral bool,
	expiration *time.Time,
	aclTags []string,
) (*types.PreAuthKey, error) {
	return Write(hsdb.DB, func(tx *gorm.DB) (*types.PreAuthKey, error) {
		return CreatePreAuthKey(tx, uid, reusable, ephemeral, expiration, aclTags)
	})
}

// CreatePreAuthKey creates a new PreAuthKey in a user, and returns it.
func CreatePreAuthKey(
	tx *gorm.DB,
	uid types.UserID,
	reusable bool,
	ephemeral bool,
	expiration *time.Time,
	aclTags []string,
) (*types.PreAuthKey, error) {
	user, err := GetUserByID(tx, uid)
	if err != nil {
		return nil, err
	}

	// Remove duplicates
	aclTags = set.SetOf(aclTags).Slice()

	// TODO(kradalby): factor out and create a reusable tag validation,
	// check if there is one in Tailscale's lib.
	for _, tag := range aclTags {
		if !strings.HasPrefix(tag, "tag:") {
			return nil, fmt.Errorf(
				"%w: '%s' did not begin with 'tag:'",
				ErrPreAuthKeyACLTagInvalid,
				tag,
			)
		}
	}

	now := time.Now().UTC()
	// TODO(kradalby): unify the key generations spread all over the code.
	kstr, err := generateKey()
	if err != nil {
		return nil, err
	}

	key := types.PreAuthKey{
		Key:        kstr,
		UserID:     user.ID,
		User:       *user,
		Reusable:   reusable,
		Ephemeral:  ephemeral,
		CreatedAt:  &now,
		Expiration: expiration,
		Tags:       aclTags,
	}

	if err := tx.Save(&key).Error; err != nil {
		return nil, fmt.Errorf("failed to create key in the database: %w", err)
	}

	return &key, nil
}

func (hsdb *HSDatabase) ListPreAuthKeys(uid types.UserID) ([]types.PreAuthKey, error) {
	return Read(hsdb.DB, func(rx *gorm.DB) ([]types.PreAuthKey, error) {
		return ListPreAuthKeysByUser(rx, uid)
	})
}

// ListPreAuthKeysByUser returns the list of PreAuthKeys for a user.
func ListPreAuthKeysByUser(tx *gorm.DB, uid types.UserID) ([]types.PreAuthKey, error) {
	user, err := GetUserByID(tx, uid)
	if err != nil {
		return nil, err
	}

	keys := []types.PreAuthKey{}
	if err := tx.Preload("User").Where(&types.PreAuthKey{UserID: user.ID}).Find(&keys).Error; err != nil {
		return nil, err
	}

	return keys, nil
}

func (hsdb *HSDatabase) GetPreAuthKey(key string) (*types.PreAuthKey, error) {
	return Read(hsdb.DB, func(rx *gorm.DB) (*types.PreAuthKey, error) {
		return GetPreAuthKey(rx, key)
	})
}

// GetPreAuthKey returns a PreAuthKey for a given key. The caller is responsible
// for checking if the key is usable (expired or used).
func GetPreAuthKey(tx *gorm.DB, key string) (*types.PreAuthKey, error) {
	pak := types.PreAuthKey{}
	if err := tx.Preload("User").First(&pak, "key = ?", key).Error; err != nil {
		return nil, ErrPreAuthKeyNotFound
	}

	return &pak, nil
}

// DestroyPreAuthKey destroys a preauthkey. Returns error if the PreAuthKey
// does not exist.
func DestroyPreAuthKey(tx *gorm.DB, pak types.PreAuthKey) error {
	return tx.Transaction(func(db *gorm.DB) error {
		if result := db.Unscoped().Delete(pak); result.Error != nil {
			return result.Error
		}

		return nil
	})
}

func (hsdb *HSDatabase) ExpirePreAuthKey(k *types.PreAuthKey) error {
	return hsdb.Write(func(tx *gorm.DB) error {
		return ExpirePreAuthKey(tx, k)
	})
}

// UsePreAuthKey marks a PreAuthKey as used.
func UsePreAuthKey(tx *gorm.DB, k *types.PreAuthKey) error {
	k.Used = true
	if err := tx.Save(k).Error; err != nil {
		return fmt.Errorf("failed to update key used status in the database: %w", err)
	}

	return nil
}

// MarkExpirePreAuthKey marks a PreAuthKey as expired.
func ExpirePreAuthKey(tx *gorm.DB, k *types.PreAuthKey) error {
	if err := tx.Model(&k).Update("Expiration", time.Now()).Error; err != nil {
		return err
	}

	return nil
}

func generateKey() (string, error) {
	size := 24
	bytes := make([]byte, size)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return hex.EncodeToString(bytes), nil
}
