package cli

import (
	"fmt"
	"os"
	"runtime"
	"slices"

	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"github.com/tcnksm/go-latest"
)

const (
	deprecateNamespaceMessage = "use --user"
)

var cfgFile string = ""

func init() {
	if len(os.Args) > 1 &&
		(os.Args[1] == "version" || os.Args[1] == "mockoidc" || os.Args[1] == "completion") {
		return
	}

	if slices.Contains(os.Args, "policy") && slices.Contains(os.Args, "check") {
		zerolog.SetGlobalLevel(zerolog.Disabled)
		return
	}

	cobra.OnInitialize(initConfig)
	rootCmd.PersistentFlags().
		StringVarP(&cfgFile, "config", "c", "", "config file (default is /etc/headscale/config.yaml)")
	rootCmd.PersistentFlags().
		StringP("output", "o", "", "Output format. Empty for human-readable, 'json', 'json-line' or 'yaml'")
	rootCmd.PersistentFlags().
		Bool("force", false, "Disable prompts and forces the execution")
}

func initConfig() {
	if cfgFile == "" {
		cfgFile = os.Getenv("HEADSCALE_CONFIG")
	}
	if cfgFile != "" {
		err := types.LoadConfig(cfgFile, true)
		if err != nil {
			log.Fatal().Caller().Err(err).Msgf("Error loading config file %s", cfgFile)
		}
	} else {
		err := types.LoadConfig("", false)
		if err != nil {
			log.Fatal().Caller().Err(err).Msgf("Error loading config")
		}
	}

	machineOutput := HasMachineOutputFlag()

	// If the user has requested a "node" readable format,
	// then disable login so the output remains valid.
	if machineOutput {
		zerolog.SetGlobalLevel(zerolog.Disabled)
	}

	logFormat := viper.GetString("log.format")
	if logFormat == types.JSONLogFormat {
		log.Logger = log.Output(os.Stdout)
	}

	disableUpdateCheck := viper.GetBool("disable_check_updates")
	if !disableUpdateCheck && !machineOutput {
		if (runtime.GOOS == "linux" || runtime.GOOS == "darwin") &&
			types.Version != "dev" {
			githubTag := &latest.GithubTag{
				Owner:      "juanfont",
				Repository: "headscale",
			}
			res, err := latest.Check(githubTag, types.Version)
			if err == nil && res.Outdated {
				//nolint
				log.Warn().Msgf(
					"An updated version of Headscale has been found (%s vs. your current %s). Check it out https://github.com/juanfont/headscale/releases\n",
					res.Current,
					types.Version,
				)
			}
		}
	}
}

var rootCmd = &cobra.Command{
	Use:   "headscale",
	Short: "headscale - a Tailscale control server",
	Long: `
headscale is an open source implementation of the Tailscale control server

https://github.com/juanfont/headscale`,
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
