package cli

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func init() {
	rootCmd.AddCommand(dumpConfigCmd)
}

var dumpConfigCmd = &cobra.Command{
	Use:    "dumpConfig",
	Short:  "dump current config to /etc/headscale/config.dump.yaml, integration test only",
	Hidden: true,
	Args: func(cmd *cobra.Command, args []string) error {
		return nil
	},
	Run: func(cmd *cobra.Command, args []string) {
		err := viper.WriteConfigAs("/etc/headscale/config.dump.yaml")
		if err != nil {
			//nolint
			fmt.Println("Failed to dump config")
		}
	},
}
