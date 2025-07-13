package util

import (
	"errors"
	"net/netip"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
)

func TestTailscaleVersionNewerOrEqual(t *testing.T) {
	type args struct {
		minimum string
		toCheck string
	}
	tests := []struct {
		name string
		args args
		want bool
	}{
		{
			name: "is-equal",
			args: args{
				minimum: "1.56",
				toCheck: "1.56",
			},
			want: true,
		},
		{
			name: "is-newer-head",
			args: args{
				minimum: "1.56",
				toCheck: "head",
			},
			want: true,
		},
		{
			name: "is-newer-unstable",
			args: args{
				minimum: "1.56",
				toCheck: "unstable",
			},
			want: true,
		},
		{
			name: "is-newer-patch",
			args: args{
				minimum: "1.56.1",
				toCheck: "1.56.1",
			},
			want: true,
		},
		{
			name: "is-older-patch-same-minor",
			args: args{
				minimum: "1.56.1",
				toCheck: "1.56.0",
			},
			want: false,
		},
		{
			name: "is-older-unstable",
			args: args{
				minimum: "1.56",
				toCheck: "1.55",
			},
			want: false,
		},
		{
			name: "is-older-one-stable",
			args: args{
				minimum: "1.56",
				toCheck: "1.54",
			},
			want: false,
		},
		{
			name: "is-older-five-stable",
			args: args{
				minimum: "1.56",
				toCheck: "1.46",
			},
			want: false,
		},
		{
			name: "is-older-patch",
			args: args{
				minimum: "1.56",
				toCheck: "1.48.1",
			},
			want: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := TailscaleVersionNewerOrEqual(tt.args.minimum, tt.args.toCheck); got != tt.want {
				t.Errorf("TailscaleVersionNewerThan() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestParseLoginURLFromCLILogin(t *testing.T) {
	tests := []struct {
		name    string
		output  string
		wantURL string
		wantErr string
	}{
		{
			name: "valid https URL",
			output: `
To authenticate, visit:

        https://headscale.example.com/register/3oYCOZYA2zZmGB4PQ7aHBaMi

Success.`,
			wantURL: "https://headscale.example.com/register/3oYCOZYA2zZmGB4PQ7aHBaMi",
			wantErr: "",
		},
		{
			name: "valid http URL",
			output: `
To authenticate, visit:

        http://headscale.example.com/register/3oYCOZYA2zZmGB4PQ7aHBaMi

Success.`,
			wantURL: "http://headscale.example.com/register/3oYCOZYA2zZmGB4PQ7aHBaMi",
			wantErr: "",
		},
		{
			name: "no URL",
			output: `
To authenticate, visit:

Success.`,
			wantURL: "",
			wantErr: "no URL found",
		},
		{
			name: "multiple URLs",
			output: `
To authenticate, visit:

        https://headscale.example.com/register/3oYCOZYA2zZmGB4PQ7aHBaMi

To authenticate, visit:

        http://headscale.example.com/register/dv1l2k5FackOYl-7-V3mSd_E

Success.`,
			wantURL: "",
			wantErr: "multiple URLs found: https://headscale.example.com/register/3oYCOZYA2zZmGB4PQ7aHBaMi and http://headscale.example.com/register/dv1l2k5FackOYl-7-V3mSd_E",
		},
		{
			name: "invalid URL",
			output: `
To authenticate, visit:

        invalid-url

Success.`,
			wantURL: "",
			wantErr: "no URL found",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotURL, err := ParseLoginURLFromCLILogin(tt.output)
			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Errorf("ParseLoginURLFromCLILogin() error = %v, wantErr %v", err, tt.wantErr)
				}
			} else {
				if err != nil {
					t.Errorf("ParseLoginURLFromCLILogin() error = %v, wantErr %v", err, tt.wantErr)
				}
				if gotURL.String() != tt.wantURL {
					t.Errorf("ParseLoginURLFromCLILogin() = %v, want %v", gotURL, tt.wantURL)
				}
			}
		})
	}
}

func TestParseTraceroute(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    Traceroute
		wantErr bool
	}{
		{
			name: "simple successful traceroute",
			input: `traceroute to 172.24.0.3 (172.24.0.3), 30 hops max, 46 byte packets
 1  ts-head-hk0urr.headscale.net (100.64.0.1)  1.135 ms  0.922 ms  0.619 ms
 2  172.24.0.3 (172.24.0.3)  0.593 ms  0.549 ms  0.522 ms`,
			want: Traceroute{
				Hostname: "172.24.0.3",
				IP:       netip.MustParseAddr("172.24.0.3"),
				Route: []TraceroutePath{
					{
						Hop:      1,
						Hostname: "ts-head-hk0urr.headscale.net",
						IP:       netip.MustParseAddr("100.64.0.1"),
						Latencies: []time.Duration{
							1135 * time.Microsecond,
							922 * time.Microsecond,
							619 * time.Microsecond,
						},
					},
					{
						Hop:      2,
						Hostname: "172.24.0.3",
						IP:       netip.MustParseAddr("172.24.0.3"),
						Latencies: []time.Duration{
							593 * time.Microsecond,
							549 * time.Microsecond,
							522 * time.Microsecond,
						},
					},
				},
				Success: true,
				Err:     nil,
			},
			wantErr: false,
		},
		{
			name: "traceroute with timeouts",
			input: `traceroute to 8.8.8.8 (8.8.8.8), 30 hops max, 60 byte packets
 1  router.local (192.168.1.1)  1.234 ms  1.123 ms  1.121 ms
 2  * * *
 3  isp-gateway.net (10.0.0.1)  15.678 ms  14.789 ms  15.432 ms
 4  8.8.8.8 (8.8.8.8)  20.123 ms  19.876 ms  20.345 ms`,
			want: Traceroute{
				Hostname: "8.8.8.8",
				IP:       netip.MustParseAddr("8.8.8.8"),
				Route: []TraceroutePath{
					{
						Hop:      1,
						Hostname: "router.local",
						IP:       netip.MustParseAddr("192.168.1.1"),
						Latencies: []time.Duration{
							1234 * time.Microsecond,
							1123 * time.Microsecond,
							1121 * time.Microsecond,
						},
					},
					{
						Hop:      2,
						Hostname: "*",
					},
					{
						Hop:      3,
						Hostname: "isp-gateway.net",
						IP:       netip.MustParseAddr("10.0.0.1"),
						Latencies: []time.Duration{
							15678 * time.Microsecond,
							14789 * time.Microsecond,
							15432 * time.Microsecond,
						},
					},
					{
						Hop:      4,
						Hostname: "8.8.8.8",
						IP:       netip.MustParseAddr("8.8.8.8"),
						Latencies: []time.Duration{
							20123 * time.Microsecond,
							19876 * time.Microsecond,
							20345 * time.Microsecond,
						},
					},
				},
				Success: true,
				Err:     nil,
			},
			wantErr: false,
		},
		{
			name: "unsuccessful traceroute",
			input: `traceroute to 10.0.0.99 (10.0.0.99), 5 hops max, 60 byte packets
 1  router.local (192.168.1.1)  1.234 ms  1.123 ms  1.121 ms
 2  * * *
 3  * * *
 4  * * *
 5  * * *`,
			want: Traceroute{
				Hostname: "10.0.0.99",
				IP:       netip.MustParseAddr("10.0.0.99"),
				Route: []TraceroutePath{
					{
						Hop:      1,
						Hostname: "router.local",
						IP:       netip.MustParseAddr("192.168.1.1"),
						Latencies: []time.Duration{
							1234 * time.Microsecond,
							1123 * time.Microsecond,
							1121 * time.Microsecond,
						},
					},
					{
						Hop:      2,
						Hostname: "*",
					},
					{
						Hop:      3,
						Hostname: "*",
					},
					{
						Hop:      4,
						Hostname: "*",
					},
					{
						Hop:      5,
						Hostname: "*",
					},
				},
				Success: false,
				Err:     errors.New("traceroute did not reach target"),
			},
			wantErr: false,
		},
		{
			name:    "empty input",
			input:   "",
			want:    Traceroute{},
			wantErr: true,
		},
		{
			name:    "invalid header",
			input:   "not a valid traceroute output",
			want:    Traceroute{},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseTraceroute(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ParseTraceroute() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if tt.wantErr {
				return
			}

			// Special handling for error field since it can't be directly compared with cmp.Diff
			gotErr := got.Err
			wantErr := tt.want.Err
			got.Err = nil
			tt.want.Err = nil

			if diff := cmp.Diff(tt.want, got, IPComparer); diff != "" {
				t.Errorf("ParseTraceroute() mismatch (-want +got):\n%s", diff)
			}

			// Now check error field separately
			if (gotErr == nil) != (wantErr == nil) {
				t.Errorf("Error field: got %v, want %v", gotErr, wantErr)
			} else if gotErr != nil && wantErr != nil && gotErr.Error() != wantErr.Error() {
				t.Errorf("Error message: got %q, want %q", gotErr.Error(), wantErr.Error())
			}
		})
	}
}
