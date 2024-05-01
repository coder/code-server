# Coder

To install and run code-server in a Coder workspace, we suggest using the `install.sh`
script in your template like so:

```terraform
resource "coder_agent" "dev" {
  arch           = "amd64"
  os             = "linux"
  startup_script = <<EOF
    #!/bin/sh
    set -x
    # install and start code-server
    curl -fsSL https://code-server.dev/install.sh | sh -s -- --version 4.8.3
    code-server --auth none --port 13337 &
    EOF
}

resource "coder_app" "code-server" {
  agent_id     = coder_agent.dev.id
  slug         = "code-server"
  display_name = "code-server"
  url          = "http://localhost:13337/"
  icon         = "/icon/code.svg"
  subdomain    = false
  share        = "owner"

  healthcheck {
    url       = "http://localhost:13337/healthz"
    interval  = 3
    threshold = 10
  }
}
```

Or use our official [`code-server`](https://registry.coder.com/modules/code-server) module from the Coder [module registry](htpps://registry.coder.com/modules):

```terraform
module "code-server" {
  source     = "registry.coder.com/modules/code-server/coder"
  version    = "1.0.5"
  agent_id   = coder_agent.example.id
  extensions = ["dracula-theme.theme-dracula", "ms-azuretools.vscode-docker"]
}
```

If you run into issues, ask for help on the `coder/coder` [Discussions
here](https://github.com/coder/coder/discussions).
