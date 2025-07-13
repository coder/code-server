package cli

import (
	"fmt"
	"strconv"
	"time"

	v1 "github.com/juanfont/headscale/gen/go/headscale/v1"
	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/prometheus/common/model"
	"github.com/pterm/pterm"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"google.golang.org/protobuf/types/known/timestamppb"
)

const (
	// 90 days.
	DefaultAPIKeyExpiry = "90d"
)

func init() {
	rootCmd.AddCommand(apiKeysCmd)
	apiKeysCmd.AddCommand(listAPIKeys)

	createAPIKeyCmd.Flags().
		StringP("expiration", "e", DefaultAPIKeyExpiry, "Human-readable expiration of the key (e.g. 30m, 24h)")

	apiKeysCmd.AddCommand(createAPIKeyCmd)

	expireAPIKeyCmd.Flags().StringP("prefix", "p", "", "ApiKey prefix")
	if err := expireAPIKeyCmd.MarkFlagRequired("prefix"); err != nil {
		log.Fatal().Err(err).Msg("")
	}
	apiKeysCmd.AddCommand(expireAPIKeyCmd)

	deleteAPIKeyCmd.Flags().StringP("prefix", "p", "", "ApiKey prefix")
	if err := deleteAPIKeyCmd.MarkFlagRequired("prefix"); err != nil {
		log.Fatal().Err(err).Msg("")
	}
	apiKeysCmd.AddCommand(deleteAPIKeyCmd)
}

var apiKeysCmd = &cobra.Command{
	Use:     "apikeys",
	Short:   "Handle the Api keys in Headscale",
	Aliases: []string{"apikey", "api"},
}

var listAPIKeys = &cobra.Command{
	Use:     "list",
	Short:   "List the Api keys for headscale",
	Aliases: []string{"ls", "show"},
	Run: func(cmd *cobra.Command, args []string) {
		output, _ := cmd.Flags().GetString("output")

		ctx, client, conn, cancel := newHeadscaleCLIWithConfig()
		defer cancel()
		defer conn.Close()

		request := &v1.ListApiKeysRequest{}

		response, err := client.ListApiKeys(ctx, request)
		if err != nil {
			ErrorOutput(
				err,
				fmt.Sprintf("Error getting the list of keys: %s", err),
				output,
			)
		}

		if output != "" {
			SuccessOutput(response.GetApiKeys(), "", output)
		}

		tableData := pterm.TableData{
			{"ID", "Prefix", "Expiration", "Created"},
		}
		for _, key := range response.GetApiKeys() {
			expiration := "-"

			if key.GetExpiration() != nil {
				expiration = ColourTime(key.GetExpiration().AsTime())
			}

			tableData = append(tableData, []string{
				strconv.FormatUint(key.GetId(), util.Base10),
				key.GetPrefix(),
				expiration,
				key.GetCreatedAt().AsTime().Format(HeadscaleDateTimeFormat),
			})

		}
		err = pterm.DefaultTable.WithHasHeader().WithData(tableData).Render()
		if err != nil {
			ErrorOutput(
				err,
				fmt.Sprintf("Failed to render pterm table: %s", err),
				output,
			)
		}
	},
}

var createAPIKeyCmd = &cobra.Command{
	Use:   "create",
	Short: "Creates a new Api key",
	Long: `
Creates a new Api key, the Api key is only visible on creation
and cannot be retrieved again.
If you loose a key, create a new one and revoke (expire) the old one.`,
	Aliases: []string{"c", "new"},
	Run: func(cmd *cobra.Command, args []string) {
		output, _ := cmd.Flags().GetString("output")

		request := &v1.CreateApiKeyRequest{}

		durationStr, _ := cmd.Flags().GetString("expiration")

		duration, err := model.ParseDuration(durationStr)
		if err != nil {
			ErrorOutput(
				err,
				fmt.Sprintf("Could not parse duration: %s\n", err),
				output,
			)
		}

		expiration := time.Now().UTC().Add(time.Duration(duration))

		request.Expiration = timestamppb.New(expiration)

		ctx, client, conn, cancel := newHeadscaleCLIWithConfig()
		defer cancel()
		defer conn.Close()

		response, err := client.CreateApiKey(ctx, request)
		if err != nil {
			ErrorOutput(
				err,
				fmt.Sprintf("Cannot create Api Key: %s\n", err),
				output,
			)
		}

		SuccessOutput(response.GetApiKey(), response.GetApiKey(), output)
	},
}

var expireAPIKeyCmd = &cobra.Command{
	Use:     "expire",
	Short:   "Expire an ApiKey",
	Aliases: []string{"revoke", "exp", "e"},
	Run: func(cmd *cobra.Command, args []string) {
		output, _ := cmd.Flags().GetString("output")

		prefix, err := cmd.Flags().GetString("prefix")
		if err != nil {
			ErrorOutput(
				err,
				fmt.Sprintf("Error getting prefix from CLI flag: %s", err),
				output,
			)
		}

		ctx, client, conn, cancel := newHeadscaleCLIWithConfig()
		defer cancel()
		defer conn.Close()

		request := &v1.ExpireApiKeyRequest{
			Prefix: prefix,
		}

		response, err := client.ExpireApiKey(ctx, request)
		if err != nil {
			ErrorOutput(
				err,
				fmt.Sprintf("Cannot expire Api Key: %s\n", err),
				output,
			)
		}

		SuccessOutput(response, "Key expired", output)
	},
}

var deleteAPIKeyCmd = &cobra.Command{
	Use:     "delete",
	Short:   "Delete an ApiKey",
	Aliases: []string{"remove", "del"},
	Run: func(cmd *cobra.Command, args []string) {
		output, _ := cmd.Flags().GetString("output")

		prefix, err := cmd.Flags().GetString("prefix")
		if err != nil {
			ErrorOutput(
				err,
				fmt.Sprintf("Error getting prefix from CLI flag: %s", err),
				output,
			)
		}

		ctx, client, conn, cancel := newHeadscaleCLIWithConfig()
		defer cancel()
		defer conn.Close()

		request := &v1.DeleteApiKeyRequest{
			Prefix: prefix,
		}

		response, err := client.DeleteApiKey(ctx, request)
		if err != nil {
			ErrorOutput(
				err,
				fmt.Sprintf("Cannot delete Api Key: %s\n", err),
				output,
			)
		}

		SuccessOutput(response, "Key deleted", output)
	},
}
