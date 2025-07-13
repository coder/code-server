package dockertestutil

import (
	"bytes"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/ory/dockertest/v3"
)

const dockerExecuteTimeout = time.Second * 30

var (
	ErrDockertestCommandFailed  = errors.New("dockertest command failed")
	ErrDockertestCommandTimeout = errors.New("dockertest command timed out")
)

type ExecuteCommandConfig struct {
	timeout time.Duration
}

type ExecuteCommandOption func(*ExecuteCommandConfig) error

func ExecuteCommandTimeout(timeout time.Duration) ExecuteCommandOption {
	return ExecuteCommandOption(func(conf *ExecuteCommandConfig) error {
		conf.timeout = timeout
		return nil
	})
}

// buffer is a goroutine safe bytes.buffer.
type buffer struct {
	store bytes.Buffer
	mutex sync.Mutex
}

// Write appends the contents of p to the buffer, growing the buffer as needed. It returns
// the number of bytes written.
func (b *buffer) Write(p []byte) (n int, err error) {
	b.mutex.Lock()
	defer b.mutex.Unlock()
	return b.store.Write(p)
}

// String returns the contents of the unread portion of the buffer
// as a string.
func (b *buffer) String() string {
	b.mutex.Lock()
	defer b.mutex.Unlock()
	return b.store.String()
}

func ExecuteCommand(
	resource *dockertest.Resource,
	cmd []string,
	env []string,
	options ...ExecuteCommandOption,
) (string, string, error) {
	stdout := buffer{}
	stderr := buffer{}

	execConfig := ExecuteCommandConfig{
		timeout: dockerExecuteTimeout,
	}

	for _, opt := range options {
		if err := opt(&execConfig); err != nil {
			return "", "", fmt.Errorf("execute-command/options: %w", err)
		}
	}

	type result struct {
		exitCode int
		err      error
	}

	resultChan := make(chan result, 1)

	// Run your long running function in it's own goroutine and pass back it's
	// response into our channel.
	go func() {
		exitCode, err := resource.Exec(
			cmd,
			dockertest.ExecOptions{
				Env:    append(env, "HEADSCALE_LOG_LEVEL=info"),
				StdOut: &stdout,
				StdErr: &stderr,
			},
		)

		resultChan <- result{exitCode, err}
	}()

	// Listen on our channel AND a timeout channel - which ever happens first.
	select {
	case res := <-resultChan:
		if res.err != nil {
			return stdout.String(), stderr.String(), fmt.Errorf("command failed, stderr: %s: %w", stderr.String(), res.err)
		}

		if res.exitCode != 0 {
			// Uncomment for debugging
			// log.Println("Command: ", cmd)
			// log.Println("stdout: ", stdout.String())
			// log.Println("stderr: ", stderr.String())

			return stdout.String(), stderr.String(), fmt.Errorf("command failed, stderr: %s: %w", stderr.String(), ErrDockertestCommandFailed)
		}

		return stdout.String(), stderr.String(), nil
	case <-time.After(execConfig.timeout):
		return stdout.String(), stderr.String(), fmt.Errorf("command failed, stderr: %s: %w", stderr.String(), ErrDockertestCommandTimeout)
	}
}
