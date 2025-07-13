package sqliteconfig

import (
	"database/sql"
	"path/filepath"
	"strings"
	"testing"

	_ "modernc.org/sqlite"
)

const memoryDBPath = ":memory:"

// TestSQLiteDriverPragmaIntegration verifies that the modernc.org/sqlite driver
// correctly applies all pragma settings from URL parameters, ensuring they work
// the same as the old SQL PRAGMA statements approach.
func TestSQLiteDriverPragmaIntegration(t *testing.T) {
	tests := []struct {
		name     string
		config   *Config
		expected map[string]any
	}{
		{
			name:   "default configuration",
			config: Default("/tmp/test.db"),
			expected: map[string]any{
				"busy_timeout":       10000,
				"journal_mode":       "wal",
				"auto_vacuum":        2, // INCREMENTAL = 2
				"wal_autocheckpoint": 1000,
				"synchronous":        1, // NORMAL = 1
				"foreign_keys":       1, // ON = 1
			},
		},
		{
			name:   "memory database with foreign keys",
			config: Memory(),
			expected: map[string]any{
				"foreign_keys": 1, // ON = 1
			},
		},
		{
			name: "custom configuration",
			config: &Config{
				Path:              "/tmp/custom.db",
				BusyTimeout:       5000,
				JournalMode:       JournalModeDelete,
				AutoVacuum:        AutoVacuumFull,
				WALAutocheckpoint: 1000,
				Synchronous:       SynchronousFull,
				ForeignKeys:       true,
			},
			expected: map[string]any{
				"busy_timeout":       5000,
				"journal_mode":       "delete",
				"auto_vacuum":        1, // FULL = 1
				"wal_autocheckpoint": 1000,
				"synchronous":        2, // FULL = 2
				"foreign_keys":       1, // ON = 1
			},
		},
		{
			name: "foreign keys disabled",
			config: &Config{
				Path:        "/tmp/no_fk.db",
				ForeignKeys: false,
			},
			expected: map[string]any{
				// foreign_keys should not be set (defaults to 0/OFF)
				"foreign_keys": 0,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create temporary database file if not memory
			if tt.config.Path == memoryDBPath {
				// For memory databases, no changes needed
			} else {
				tempDir := t.TempDir()
				dbPath := filepath.Join(tempDir, "test.db")
				// Update config with actual temp path
				configCopy := *tt.config
				configCopy.Path = dbPath
				tt.config = &configCopy
			}

			// Generate URL and open database
			url, err := tt.config.ToURL()
			if err != nil {
				t.Fatalf("Failed to generate URL: %v", err)
			}

			t.Logf("Opening database with URL: %s", url)

			db, err := sql.Open("sqlite", url)
			if err != nil {
				t.Fatalf("Failed to open database: %v", err)
			}
			defer db.Close()

			// Test connection
			if err := db.Ping(); err != nil {
				t.Fatalf("Failed to ping database: %v", err)
			}

			// Verify each expected pragma setting
			for pragma, expectedValue := range tt.expected {
				t.Run("pragma_"+pragma, func(t *testing.T) {
					var actualValue any
					query := "PRAGMA " + pragma
					err := db.QueryRow(query).Scan(&actualValue)
					if err != nil {
						t.Fatalf("Failed to query %s: %v", query, err)
					}

					t.Logf("%s: expected=%v, actual=%v", pragma, expectedValue, actualValue)

					// Handle type conversion for comparison
					switch expected := expectedValue.(type) {
					case int:
						if actual, ok := actualValue.(int64); ok {
							if int64(expected) != actual {
								t.Errorf("%s: expected %d, got %d", pragma, expected, actual)
							}
						} else {
							t.Errorf("%s: expected int %d, got %T %v", pragma, expected, actualValue, actualValue)
						}
					case string:
						if actual, ok := actualValue.(string); ok {
							if expected != actual {
								t.Errorf("%s: expected %q, got %q", pragma, expected, actual)
							}
						} else {
							t.Errorf("%s: expected string %q, got %T %v", pragma, expected, actualValue, actualValue)
						}
					default:
						t.Errorf("Unsupported expected type for %s: %T", pragma, expectedValue)
					}
				})
			}
		})
	}
}

// TestForeignKeyConstraintEnforcement verifies that foreign key constraints
// are actually enforced when enabled via URL parameters.
func TestForeignKeyConstraintEnforcement(t *testing.T) {
	tempDir := t.TempDir()

	dbPath := filepath.Join(tempDir, "fk_test.db")
	config := Default(dbPath)

	url, err := config.ToURL()
	if err != nil {
		t.Fatalf("Failed to generate URL: %v", err)
	}

	db, err := sql.Open("sqlite", url)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Create test tables with foreign key relationship
	schema := `
		CREATE TABLE parent (
			id INTEGER PRIMARY KEY,
			name TEXT NOT NULL
		);

		CREATE TABLE child (
			id INTEGER PRIMARY KEY,
			parent_id INTEGER NOT NULL,
			name TEXT NOT NULL,
			FOREIGN KEY (parent_id) REFERENCES parent(id)
		);
	`

	if _, err := db.Exec(schema); err != nil {
		t.Fatalf("Failed to create schema: %v", err)
	}

	// Insert parent record
	if _, err := db.Exec("INSERT INTO parent (id, name) VALUES (1, 'Parent 1')"); err != nil {
		t.Fatalf("Failed to insert parent: %v", err)
	}

	// Test 1: Valid foreign key should work
	_, err = db.Exec("INSERT INTO child (id, parent_id, name) VALUES (1, 1, 'Child 1')")
	if err != nil {
		t.Fatalf("Valid foreign key insert failed: %v", err)
	}

	// Test 2: Invalid foreign key should fail
	_, err = db.Exec("INSERT INTO child (id, parent_id, name) VALUES (2, 999, 'Child 2')")
	if err == nil {
		t.Error("Expected foreign key constraint violation, but insert succeeded")
	} else if !contains(err.Error(), "FOREIGN KEY constraint failed") {
		t.Errorf("Expected foreign key constraint error, got: %v", err)
	} else {
		t.Logf("✓ Foreign key constraint correctly enforced: %v", err)
	}

	// Test 3: Deleting referenced parent should fail
	_, err = db.Exec("DELETE FROM parent WHERE id = 1")
	if err == nil {
		t.Error("Expected foreign key constraint violation when deleting referenced parent")
	} else if !contains(err.Error(), "FOREIGN KEY constraint failed") {
		t.Errorf("Expected foreign key constraint error on delete, got: %v", err)
	} else {
		t.Logf("✓ Foreign key constraint correctly prevented parent deletion: %v", err)
	}
}

// TestJournalModeValidation verifies that the journal_mode setting is applied correctly.
func TestJournalModeValidation(t *testing.T) {
	modes := []struct {
		mode     JournalMode
		expected string
	}{
		{JournalModeWAL, "wal"},
		{JournalModeDelete, "delete"},
		{JournalModeTruncate, "truncate"},
		{JournalModeMemory, "memory"},
	}

	for _, tt := range modes {
		t.Run(string(tt.mode), func(t *testing.T) {
			tempDir := t.TempDir()

			dbPath := filepath.Join(tempDir, "journal_test.db")
			config := &Config{
				Path:        dbPath,
				JournalMode: tt.mode,
				ForeignKeys: true,
			}

			url, err := config.ToURL()
			if err != nil {
				t.Fatalf("Failed to generate URL: %v", err)
			}

			db, err := sql.Open("sqlite", url)
			if err != nil {
				t.Fatalf("Failed to open database: %v", err)
			}
			defer db.Close()

			var actualMode string
			err = db.QueryRow("PRAGMA journal_mode").Scan(&actualMode)
			if err != nil {
				t.Fatalf("Failed to query journal_mode: %v", err)
			}

			if actualMode != tt.expected {
				t.Errorf("journal_mode: expected %q, got %q", tt.expected, actualMode)
			} else {
				t.Logf("✓ journal_mode correctly set to: %s", actualMode)
			}
		})
	}
}

// contains checks if a string contains a substring (helper function).
func contains(str, substr string) bool {
	return strings.Contains(str, substr)
}
