# Getting started

This page helps you get started with headscale and provides a few usage examples for the headscale command line tool
`headscale`.

!!! note "Prerequisites"

    * Headscale is installed and running as system service. Read the [setup section](../setup/requirements.md) for
      installation instructions.
    * The configuration file exists and is adjusted to suit your environment, see
      [Configuration](../ref/configuration.md) for details.
    * Headscale is reachable from the Internet. Verify this by opening client specific setup instructions in your
      browser, e.g. https://headscale.example.com/windows
    * The Tailscale client is installed, see [Client and operating system support](../about/clients.md) for more
      information.

## Getting help

The `headscale` command line tool provides built-in help. To show available commands along with their arguments and
options, run:

=== "Native"

    ```shell
    # Show help
    headscale help

    # Show help for a specific command
    headscale <COMMAND> --help
    ```

=== "Container"

    ```shell
    # Show help
    docker exec -it headscale \
      headscale help

    # Show help for a specific command
    docker exec -it headscale \
      headscale <COMMAND> --help
    ```

## Manage headscale users

In headscale, a node (also known as machine or device) is always assigned to a
headscale user. Such a headscale user may have many nodes assigned to them and
can be managed with the `headscale users` command. Invoke the built-in help for
more information: `headscale users --help`.

### Create a headscale user

=== "Native"

    ```shell
    headscale users create <USER>
    ```

=== "Container"

    ```shell
    docker exec -it headscale \
      headscale users create <USER>
    ```

### List existing headscale users

=== "Native"

    ```shell
    headscale users list
    ```

=== "Container"

    ```shell
    docker exec -it headscale \
      headscale users list
    ```

## Register a node

One has to register a node first to use headscale as coordination with Tailscale. The following examples work for the
Tailscale client on Linux/BSD operating systems. Alternatively, follow the instructions to connect
[Android](connect/android.md), [Apple](connect/apple.md) or [Windows](connect/windows.md) devices.

### Normal, interactive login

On a client machine, run the `tailscale up` command and provide the FQDN of your headscale instance as argument:

```shell
tailscale up --login-server <YOUR_HEADSCALE_URL>
```

Usually, a browser window with further instructions is opened and contains the value for `<YOUR_MACHINE_KEY>`. Approve
and register the node on your headscale server:

=== "Native"

    ```shell
    headscale nodes register --user <USER> --key <YOUR_MACHINE_KEY>
    ```

=== "Container"

    ```shell
    docker exec -it headscale \
      headscale nodes register --user <USER> --key <YOUR_MACHINE_KEY>
    ```

### Using a preauthkey

It is also possible to generate a preauthkey and register a node non-interactively. First, generate a preauthkey on the
headscale instance. By default, the key is valid for one hour and can only be used once (see `headscale preauthkeys
--help` for other options):

=== "Native"

    ```shell
    headscale preauthkeys create --user <USER>
    ```

=== "Container"

    ```shell
    docker exec -it headscale \
      headscale preauthkeys create --user <USER>
    ```

The command returns the preauthkey on success which is used to connect a node to the headscale instance via the
`tailscale up` command:

```shell
tailscale up --login-server <YOUR_HEADSCALE_URL> --authkey <YOUR_AUTH_KEY>
```
