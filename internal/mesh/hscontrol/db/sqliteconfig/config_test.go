package sqliteconfig

import (
	"testing"
)

func TestJournalMode(t *testing.T) {
	tests := []struct {
		mode  JournalMode
		valid bool
	}{
		{JournalModeWAL, true},
		{JournalModeDelete, true},
		{JournalModeTruncate, true},
		{JournalModePersist, true},
		{JournalModeMemory, true},
		{JournalModeOff, true},
		{JournalMode("INVALID"), false},
		{JournalMode(""), false},
	}

	for _, tt := range tests {
		t.Run(string(tt.mode), func(t *testing.T) {
			if got := tt.mode.IsValid(); got != tt.valid {
				t.Errorf("JournalMode(%q).IsValid() = %v, want %v", tt.mode, got, tt.valid)
			}
		})
	}
}

func TestAutoVacuum(t *testing.T) {
	tests := []struct {
		mode  AutoVacuum
		valid bool
	}{
		{AutoVacuumNone, true},
		{AutoVacuumFull, true},
		{AutoVacuumIncremental, true},
		{AutoVacuum("INVALID"), false},
		{AutoVacuum(""), false},
	}

	for _, tt := range tests {
		t.Run(string(tt.mode), func(t *testing.T) {
			if got := tt.mode.IsValid(); got != tt.valid {
				t.Errorf("AutoVacuum(%q).IsValid() = %v, want %v", tt.mode, got, tt.valid)
			}
		})
	}
}

func TestSynchronous(t *testing.T) {
	tests := []struct {
		mode  Synchronous
		valid bool
	}{
		{SynchronousOff, true},
		{SynchronousNormal, true},
		{SynchronousFull, true},
		{SynchronousExtra, true},
		{Synchronous("INVALID"), false},
		{Synchronous(""), false},
	}

	for _, tt := range tests {
		t.Run(string(tt.mode), func(t *testing.T) {
			if got := tt.mode.IsValid(); got != tt.valid {
				t.Errorf("Synchronous(%q).IsValid() = %v, want %v", tt.mode, got, tt.valid)
			}
		})
	}
}

func TestConfigValidate(t *testing.T) {
	tests := []struct {
		name    string
		config  *Config
		wantErr bool
	}{
		{
			name:   "valid default config",
			config: Default("/path/to/db.sqlite"),
		},
		{
			name: "empty path",
			config: &Config{
				Path: "",
			},
			wantErr: true,
		},
		{
			name: "negative busy timeout",
			config: &Config{
				Path:        "/path/to/db.sqlite",
				BusyTimeout: -1,
			},
			wantErr: true,
		},
		{
			name: "invalid journal mode",
			config: &Config{
				Path:        "/path/to/db.sqlite",
				JournalMode: JournalMode("INVALID"),
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.config.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Config.Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestConfigToURL(t *testing.T) {
	tests := []struct {
		name   string
		config *Config
		want   string
	}{
		{
			name:   "default config",
			config: Default("/path/to/db.sqlite"),
			want:   "file:/path/to/db.sqlite?_pragma=busy_timeout=10000&_pragma=journal_mode=WAL&_pragma=auto_vacuum=INCREMENTAL&_pragma=wal_autocheckpoint=1000&_pragma=synchronous=NORMAL&_pragma=foreign_keys=ON",
		},
		{
			name:   "memory config",
			config: Memory(),
			want:   ":memory:?_pragma=foreign_keys=ON",
		},
		{
			name: "minimal config",
			config: &Config{
				Path:              "/simple/db.sqlite",
				WALAutocheckpoint: -1, // not set
			},
			want: "file:/simple/db.sqlite",
		},
		{
			name: "custom config",
			config: &Config{
				Path:              "/custom/db.sqlite",
				BusyTimeout:       5000,
				JournalMode:       JournalModeDelete,
				WALAutocheckpoint: -1, // not set
				Synchronous:       SynchronousFull,
				ForeignKeys:       true,
			},
			want: "file:/custom/db.sqlite?_pragma=busy_timeout=5000&_pragma=journal_mode=DELETE&_pragma=synchronous=FULL&_pragma=foreign_keys=ON",
		},
		{
			name: "memory with custom timeout",
			config: &Config{
				Path:              ":memory:",
				BusyTimeout:       2000,
				WALAutocheckpoint: -1, // not set
				ForeignKeys:       true,
			},
			want: ":memory:?_pragma=busy_timeout=2000&_pragma=foreign_keys=ON",
		},
		{
			name: "wal autocheckpoint zero",
			config: &Config{
				Path:              "/test.db",
				WALAutocheckpoint: 0,
			},
			want: "file:/test.db?_pragma=wal_autocheckpoint=0",
		},
		{
			name: "all options",
			config: &Config{
				Path:              "/full.db",
				BusyTimeout:       15000,
				JournalMode:       JournalModeWAL,
				AutoVacuum:        AutoVacuumFull,
				WALAutocheckpoint: 1000,
				Synchronous:       SynchronousExtra,
				ForeignKeys:       true,
			},
			want: "file:/full.db?_pragma=busy_timeout=15000&_pragma=journal_mode=WAL&_pragma=auto_vacuum=FULL&_pragma=wal_autocheckpoint=1000&_pragma=synchronous=EXTRA&_pragma=foreign_keys=ON",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := tt.config.ToURL()
			if err != nil {
				t.Errorf("Config.ToURL() error = %v", err)
				return
			}
			if got != tt.want {
				t.Errorf("Config.ToURL() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestConfigToURLInvalid(t *testing.T) {
	config := &Config{
		Path:        "",
		BusyTimeout: -1,
	}
	_, err := config.ToURL()
	if err == nil {
		t.Error("Config.ToURL() with invalid config should return error")
	}
}
