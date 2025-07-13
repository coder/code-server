# Official releases

Official releases for headscale are available as binaries for various platforms and DEB packages for Debian and Ubuntu.
Both are available on the [GitHub releases page](https://github.com/juanfont/headscale/releases).

## Using packages for Debian/Ubuntu (recommended)

It is recommended to use our DEB packages to install headscale on a Debian based system as those packages configure a
local user to run headscale, provide a default configuration and ship with a systemd service file. Supported
distributions are Ubuntu 22.04 or newer, Debian 11 or newer.

1.  Download the [latest headscale package](https://github.com/juanfont/headscale/releases/latest) for your platform (`.deb` for Ubuntu and Debian).

    ```shell
    HEADSCALE_VERSION="" # See above URL for latest version, e.g. "X.Y.Z" (NOTE: do not add the "v" prefix!)
    HEADSCALE_ARCH="" # Your system architecture, e.g. "amd64"
    wget --output-document=headscale.deb \
     "https://github.com/juanfont/headscale/releases/download/v${HEADSCALE_VERSION}/headscale_${HEADSCALE_VERSION}_linux_${HEADSCALE_ARCH}.deb"
    ```

1.  Install headscale:

    ```shell
    sudo apt install ./headscale.deb
    ```

1.  [Configure headscale by editing the configuration file](../../ref/configuration.md):

    ```shell
    sudo nano /etc/headscale/config.yaml
    ```

1.  Enable and start the headscale service:

    ```shell
    sudo systemctl enable --now headscale
    ```

1.  Verify that headscale is running as intended:

    ```shell
    sudo systemctl status headscale
    ```

## Using standalone binaries (advanced)

!!! warning "Advanced"

    This installation method is considered advanced as one needs to take care of the local user and the systemd
    service themselves. If possible, use the [DEB packages](#using-packages-for-debianubuntu-recommended) or a
    [community package](./community.md) instead.

This section describes the installation of headscale according to the [Requirements and
assumptions](../requirements.md#assumptions). Headscale is run by a dedicated local user and the service itself is
managed by systemd.

1.  Download the latest [`headscale` binary from GitHub's release page](https://github.com/juanfont/headscale/releases):

    ```shell
    sudo wget --output-document=/usr/local/bin/headscale \
    https://github.com/juanfont/headscale/releases/download/v<HEADSCALE VERSION>/headscale_<HEADSCALE VERSION>_linux_<ARCH>
    ```

1.  Make `headscale` executable:

    ```shell
    sudo chmod +x /usr/local/bin/headscale
    ```

1.  Add a dedicated local user to run headscale:

    ```shell
    sudo useradd \
     --create-home \
     --home-dir /var/lib/headscale/ \
     --system \
     --user-group \
     --shell /usr/sbin/nologin \
     headscale
    ```

1.  Download the example configuration for your chosen version and save it as: `/etc/headscale/config.yaml`. Adjust the
    configuration to suit your local environment. See [Configuration](../../ref/configuration.md) for details.

    ```shell
    sudo mkdir -p /etc/headscale
    sudo nano /etc/headscale/config.yaml
    ```

1.  Copy [headscale's systemd service file](https://github.com/juanfont/headscale/blob/main/packaging/systemd/headscale.service)
    to `/etc/systemd/system/headscale.service` and adjust it to suit your local setup. The following parameters likely need
    to be modified: `ExecStart`, `WorkingDirectory`, `ReadWritePaths`.

1.  In `/etc/headscale/config.yaml`, override the default `headscale` unix socket with a path that is writable by the
    `headscale` user or group:

    ```yaml title="config.yaml"
    unix_socket: /var/run/headscale/headscale.sock
    ```

1.  Reload systemd to load the new configuration file:

    ```shell
    systemctl daemon-reload
    ```

1.  Enable and start the new headscale service:

    ```shell
    systemctl enable --now headscale
    ```

1.  Verify that headscale is running as intended:

    ```shell
    systemctl status headscale
    ```
