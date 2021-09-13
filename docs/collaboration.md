# Collaboration

With third-party extensions, you can use code-server to collaborate with other developers in real time.

## Code sharing using Duckly

[Duckly](https://duckly.com/) allows you to share your code in real-time even with people using different IDEs (like JetBrains and VSCode).

- Cross-IDE support,
- Real-time typing,
- P2P encrypted,
- Voice and audio chat,
- Terminal sharing

### Installing the Duckly Extension

Duckly uses an extension to provide real time sharing features

1. Install the Duckly extension from OpenVSX on `code-server`.

```bash
SERVICE_URL=https://open-vsx.org/vscode/gallery \
  ITEM_URL=https://open-vsx.org/vscode/item \
  code-server --install-extension gitduck.code-streaming
```

2. Refresh you `code-server` window. You should now be able to see the Duckly extension.

### Sharing with Duckly

As `code-server` is based on VS Code, you can follow the steps described on Duckly's [Pair programming with VS Code](https://duckly.com/tools/vscode) page and skip the installation step.
