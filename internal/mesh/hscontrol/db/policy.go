package db

import (
	"errors"

	"github.com/juanfont/headscale/hscontrol/types"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// SetPolicy sets the policy in the database.
func (hsdb *HSDatabase) SetPolicy(policy string) (*types.Policy, error) {
	// Create a new policy.
	p := types.Policy{
		Data: policy,
	}

	if err := hsdb.DB.Clauses(clause.Returning{}).Create(&p).Error; err != nil {
		return nil, err
	}

	return &p, nil
}

// GetPolicy returns the latest policy in the database.
func (hsdb *HSDatabase) GetPolicy() (*types.Policy, error) {
	var p types.Policy

	// Query:
	// SELECT * FROM policies ORDER BY id DESC LIMIT 1;
	if err := hsdb.DB.
		Order("id DESC").
		Limit(1).
		First(&p).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, types.ErrPolicyNotFound
		}

		return nil, err
	}

	return &p, nil
}
