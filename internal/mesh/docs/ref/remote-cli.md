# Controlling headscale with remote CLI

This documentation has the goal of showing a user how-to control a headscale instance
from a remote machine with the `headscale` command line binary.

## Prerequisite

- A workstation to run `headscale` (any supported platform, e.g. Linux).
- A headscale server with gRPC enabled.
- Connections to the gRPC port (default: `50443`) are allowed.
- Remote access requires an encrypted connection via TLS.
- An API key to authenticate with the headscale server.

## Create an API key

We need to create an API key to authenticate with the remote headscale server when using it from our workstation.

To create an API key, log into your headscale server and generate a key:

```shell
headscale apikeys create --expiration 90d
```

Copy the output of the command and save it for later. Please note that you can not retrieve a key again,
if the key is lost, expire the old one, and create a new key.

To list the keys currently associated with the server:

```shell
headscale apikeys list
```

and to expire a key:

```shell
headscale apikeys expire --prefix "<PREFIX>"
```

## Download and configure headscale

1.  Download the [`headscale` binary from GitHub's release page](https://github.com/juanfont/headscale/releases). Make
    sure to use the same version as on the server.

1.  Put the binary somewhere in your `PATH`, e.g. `/usr/local/bin/headscale`

1.  Make `headscale` executable:

    ```shell
    chmod +x /usr/local/bin/headscale
    ```

1.  Provide the connection parameters for the remote headscale server either via a minimal YAML configuration file or via
    environment variables:

    === "Minimal YAML configuration file"

        ```yaml title="config.yaml"
        cli:
            address: <HEADSCALE_ADDRESS>:<PORT>
            api_key: <API_KEY_FROM_PREVIOUS_STEP>
        ```

    === "Environment variables"

        ```shell
        export HEADSCALE_CLI_ADDRESS="<HEADSCALE_ADDRESS>:<PORT>"
        export HEADSCALE_CLI_API_KEY="<API_KEY_FROM_PREVIOUS_STEP>"
        ```

        !!! bug

            Headscale currently requires at least an empty configuration file when environment variables are used to
            specify connection details. See [issue 2193](https://github.com/juanfont/headscale/issues/2193) for more
            information.

    This instructs the `headscale` binary to connect to a remote instance at `<HEADSCALE_ADDRESS>:<PORT>`, instead of
    connecting to the local instance.

1.  Test the connection

    Let us run the headscale command to verify that we can connect by listing our nodes:

    ```shell
    headscale nodes list
    ```

    You should now be able to see a list of your nodes from your workstation, and you can
    now control the headscale server from your workstation.

## Behind a proxy

It is possible to run the gRPC remote endpoint behind a reverse proxy, like Nginx, and have it run on the _same_ port as headscale.

While this is _not a supported_ feature, an example on how this can be set up on
[NixOS is shown here](https://github.com/kradalby/dotfiles/blob/4489cdbb19cddfbfae82cd70448a38fde5a76711/machines/headscale.oracldn/headscale.nix#L61-L91).

## Troubleshooting

- Make sure you have the _same_ headscale version on your server and workstation.
- Ensure that connections to the gRPC port are allowed.
- Verify that your TLS certificate is valid and trusted.
- If you don't have access to a trusted certificate (e.g. from Let's Encrypt), either:
    - Add your self-signed certificate to the trust store of your OS _or_
    - Disable certificate verification by either setting `cli.insecure: true` in the configuration file or by setting
      `HEADSCALE_CLI_INSECURE=1` via an environment variable. We do **not** recommend to disable certificate validation.
