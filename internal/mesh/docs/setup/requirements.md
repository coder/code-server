# Requirements

Headscale should just work as long as the following requirements are met:

- A server with a public IP address for headscale. A dual-stack setup with a public IPv4 and a public IPv6 address is
  recommended.
- Headscale is served via HTTPS on port 443[^1].
- A reasonably modern Linux or BSD based operating system.
- A dedicated local user account to run headscale.
- A little bit of command line knowledge to configure and operate headscale.

## Assumptions

The headscale documentation and the provided examples are written with a few assumptions in mind:

- Headscale is running as system service via a dedicated local user `headscale`.
- The [configuration](../ref/configuration.md) is loaded from `/etc/headscale/config.yaml`.
- SQLite is used as database.
- The data directory for headscale (used for private keys, ACLs, SQLite database, …) is located in `/var/lib/headscale`.
- URLs and values that need to be replaced by the user are either denoted as `<VALUE_TO_CHANGE>` or use placeholder
  values such as `headscale.example.com`.

Please adjust to your local environment accordingly.

[^1]:
    The Tailscale client assumes HTTPS on port 443 in certain situations. Serving headscale either via HTTP or via HTTPS
    on a port other than 443 is possible but sticking with HTTPS on port 443 is strongly recommended for production
    setups. See [issue 2164](https://github.com/juanfont/headscale/issues/2164) for more information.
