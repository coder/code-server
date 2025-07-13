package cli

import (
	"errors"
	"fmt"
	"net/url"
	"strconv"

	survey "github.com/AlecAivazis/survey/v2"
	v1 "github.com/juanfont/headscale/gen/go/headscale/v1"
	"github.com/pterm/pterm"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"google.golang.org/grpc/status"
)

func usernameAndIDFlag(cmd *cobra.Command) {
	cmd.Flags().Int64P("identifier", "i", -1, "User identifier (ID)")
	cmd.Flags().StringP("name", "n", "", "Username")
}

// usernameAndIDFromFlag returns the username and ID from the flags of the command.
// If both are empty, it will exit the program with an error.
func usernameAndIDFromFlag(cmd *cobra.Command) (uint64, string) {
	username, _ := cmd.Flags().GetString("name")
	identifier, _ := cmd.Flags().GetInt64("identifier")
	if username == "" && identifier < 0 {
		err := errors.New("--name or --identifier flag is required")
		ErrorOutput(
			err,
			"Cannot rename user: "+status.Convert(err).Message(),
			"",
		)
	}

	return uint64(identifier), username
}

func init() {
	rootCmd.AddCommand(userCmd)
	userCmd.AddCommand(createUserCmd)
	createUserCmd.Flags().StringP("display-name", "d", "", "Display name")
	createUserCmd.Flags().StringP("email", "e", "", "Email")
	createUserCmd.Flags().StringP("picture-url", "p", "", "Profile picture URL")
	userCmd.AddCommand(listUsersCmd)
	usernameAndIDFlag(listUsersCmd)
	listUsersCmd.Flags().StringP("email", "e", "", "Email")
	userCmd.AddCommand(destroyUserCmd)
	usernameAndIDFlag(destroyUserCmd)
	userCmd.AddCommand(renameUserCmd)
	usernameAndIDFlag(renameUserCmd)
	renameUserCmd.Flags().StringP("new-name", "r", "", "New username")
	renameNodeCmd.MarkFlagRequired("new-name")
}

var errMissingParameter = errors.New("missing parameters")

var userCmd = &cobra.Command{
	Use:     "users",
	Short:   "Manage the users of Headscale",
	Aliases: []string{"user", "namespace", "namespaces", "ns"},
}

var createUserCmd = &cobra.Command{
	Use:     "create NAME",
	Short:   "Creates a new user",
	Aliases: []string{"c", "new"},
	Args: func(cmd *cobra.Command, args []string) error {
		if len(args) < 1 {
			return errMissingParameter
		}

		return nil
	},
	Run: func(cmd *cobra.Command, args []string) {
		output, _ := cmd.Flags().GetString("output")

		userName := args[0]

		ctx, client, conn, cancel := newHeadscaleCLIWithConfig()
		defer cancel()
		defer conn.Close()

		log.Trace().Interface("client", client).Msg("Obtained gRPC client")

		request := &v1.CreateUserRequest{Name: userName}

		if displayName, _ := cmd.Flags().GetString("display-name"); displayName != "" {
			request.DisplayName = displayName
		}

		if email, _ := cmd.Flags().GetString("email"); email != "" {
			request.Email = email
		}

		if pictureURL, _ := cmd.Flags().GetString("picture-url"); pictureURL != "" {
			if _, err := url.Parse(pictureURL); err != nil {
				ErrorOutput(
					err,
					fmt.Sprintf(
						"Invalid Picture URL: %s",
						err,
					),
					output,
				)
			}
			request.PictureUrl = pictureURL
		}

		log.Trace().Interface("request", request).Msg("Sending CreateUser request")
		response, err := client.CreateUser(ctx, request)
		if err != nil {
			ErrorOutput(
				err,
				"Cannot create user: "+status.Convert(err).Message(),
				output,
			)
		}

		SuccessOutput(response.GetUser(), "User created", output)
	},
}

var destroyUserCmd = &cobra.Command{
	Use:     "destroy --identifier ID or --name NAME",
	Short:   "Destroys a user",
	Aliases: []string{"delete"},
	Run: func(cmd *cobra.Command, args []string) {
		output, _ := cmd.Flags().GetString("output")

		id, username := usernameAndIDFromFlag(cmd)
		request := &v1.ListUsersRequest{
			Name: username,
			Id:   id,
		}

		ctx, client, conn, cancel := newHeadscaleCLIWithConfig()
		defer cancel()
		defer conn.Close()

		users, err := client.ListUsers(ctx, request)
		if err != nil {
			ErrorOutput(
				err,
				"Error: "+status.Convert(err).Message(),
				output,
			)
		}

		if len(users.GetUsers()) != 1 {
			err := errors.New("Unable to determine user to delete, query returned multiple users, use ID")
			ErrorOutput(
				err,
				"Error: "+status.Convert(err).Message(),
				output,
			)
		}

		user := users.GetUsers()[0]

		confirm := false
		force, _ := cmd.Flags().GetBool("force")
		if !force {
			prompt := &survey.Confirm{
				Message: fmt.Sprintf(
					"Do you want to remove the user %q (%d) and any associated preauthkeys?",
					user.GetName(), user.GetId(),
				),
			}
			err := survey.AskOne(prompt, &confirm)
			if err != nil {
				return
			}
		}

		if confirm || force {
			request := &v1.DeleteUserRequest{Id: user.GetId()}

			response, err := client.DeleteUser(ctx, request)
			if err != nil {
				ErrorOutput(
					err,
					"Cannot destroy user: "+status.Convert(err).Message(),
					output,
				)
			}
			SuccessOutput(response, "User destroyed", output)
		} else {
			SuccessOutput(map[string]string{"Result": "User not destroyed"}, "User not destroyed", output)
		}
	},
}

var listUsersCmd = &cobra.Command{
	Use:     "list",
	Short:   "List all the users",
	Aliases: []string{"ls", "show"},
	Run: func(cmd *cobra.Command, args []string) {
		output, _ := cmd.Flags().GetString("output")

		ctx, client, conn, cancel := newHeadscaleCLIWithConfig()
		defer cancel()
		defer conn.Close()

		request := &v1.ListUsersRequest{}

		id, _ := cmd.Flags().GetInt64("identifier")
		username, _ := cmd.Flags().GetString("name")
		email, _ := cmd.Flags().GetString("email")

		// filter by one param at most
		switch {
		case id > 0:
			request.Id = uint64(id)
			break
		case username != "":
			request.Name = username
			break
		case email != "":
			request.Email = email
			break
		}

		response, err := client.ListUsers(ctx, request)
		if err != nil {
			ErrorOutput(
				err,
				"Cannot get users: "+status.Convert(err).Message(),
				output,
			)
		}

		if output != "" {
			SuccessOutput(response.GetUsers(), "", output)
		}

		tableData := pterm.TableData{{"ID", "Name", "Username", "Email", "Created"}}
		for _, user := range response.GetUsers() {
			tableData = append(
				tableData,
				[]string{
					strconv.FormatUint(user.GetId(), 10),
					user.GetDisplayName(),
					user.GetName(),
					user.GetEmail(),
					user.GetCreatedAt().AsTime().Format("2006-01-02 15:04:05"),
				},
			)
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

var renameUserCmd = &cobra.Command{
	Use:     "rename",
	Short:   "Renames a user",
	Aliases: []string{"mv"},
	Run: func(cmd *cobra.Command, args []string) {
		output, _ := cmd.Flags().GetString("output")

		ctx, client, conn, cancel := newHeadscaleCLIWithConfig()
		defer cancel()
		defer conn.Close()

		id, username := usernameAndIDFromFlag(cmd)
		listReq := &v1.ListUsersRequest{
			Name: username,
			Id:   id,
		}

		users, err := client.ListUsers(ctx, listReq)
		if err != nil {
			ErrorOutput(
				err,
				"Error: "+status.Convert(err).Message(),
				output,
			)
		}

		if len(users.GetUsers()) != 1 {
			err := errors.New("Unable to determine user to delete, query returned multiple users, use ID")
			ErrorOutput(
				err,
				"Error: "+status.Convert(err).Message(),
				output,
			)
		}

		newName, _ := cmd.Flags().GetString("new-name")

		renameReq := &v1.RenameUserRequest{
			OldId:   id,
			NewName: newName,
		}

		response, err := client.RenameUser(ctx, renameReq)
		if err != nil {
			ErrorOutput(
				err,
				"Cannot rename user: "+status.Convert(err).Message(),
				output,
			)
		}

		SuccessOutput(response.GetUser(), "User renamed", output)
	},
}
