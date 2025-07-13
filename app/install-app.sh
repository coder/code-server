#!/usr/bin/env bash
# Statik-Server App Installer
# Creates desktop app with state-of-the-art CLI interface

set -e

APP_NAME="Statik-Server"
APP_VERSION="v1.0.0"
APP_COMMENT="Sovereign AI Development Mesh"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Installation directories
APPDIR="$HOME/.local/share/applications"
ICNDIR="$HOME/.local/share/icons"
BINDIR="$HOME/.local/bin"

echo "🔥 Installing Statik-Server App Interface..."
echo "============================================="

# Create directories
mkdir -p "$APPDIR" "$ICNDIR" "$BINDIR"

# Copy icon to system location
if [[ -f "$SCRIPT_DIR/src/AscendAI-v1.0.3.png" ]]; then
    cp "$SCRIPT_DIR/src/AscendAI-v1.0.3.png" "$ICNDIR/statik-server.png"
    echo "✅ Icon installed to $ICNDIR/statik-server.png"
elif [[ -f "$SCRIPT_DIR/src/browser/media/pwa-icon-512.png" ]]; then
    cp "$SCRIPT_DIR/src/browser/media/pwa-icon-512.png" "$ICNDIR/statik-server.png"
    echo "✅ Icon installed to $ICNDIR/statik-server.png"
else
    echo "⚠️  No icon found, creating placeholder"
fi

# Create main CLI script
cat > "$APPDIR/statik_cli.sh" << 'EOF'
#!/usr/bin/env bash
set -e

# Guarantee login+interactive shell for environment
if [[ -z "$LOGIN_SHELL_STARTED" ]]; then
    export LOGIN_SHELL_STARTED=1
    exec "$SHELL" -l -i "$0" "$@"
    exit 1
fi

APP_TITLE="Statik-Server v1.0.0"
SUB_TITLE="Sovereign AI Development Mesh"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATIK_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$HOME/.statik/logs/statik-server.log"
PID_FILE="$HOME/.statik/statik-server.pid"

# Detect preferred shell
USER_SHELL="$(getent passwd "$USER" | cut -d: -f7 2>/dev/null || echo "${SHELL:-/bin/bash}")"

# Terminal emulators
EMULATORS=(x-terminal-emulator gnome-terminal konsole xfce4-terminal lxterminal tilix mate-terminal)

function relaunch_in_terminal() {
    for TERM_APP in "${EMULATORS[@]}"; do
        if command -v "$TERM_APP" &>/dev/null; then
            if [[ "$USER_SHELL" =~ (bash|zsh) ]]; then
                exec "$TERM_APP" -- "$USER_SHELL" -ilc "$0"
            else
                exec "$TERM_APP" -- "$USER_SHELL" -ic "$0"
            fi
            exit 0
        fi
    done
    echo "[ERROR] No graphical terminal emulator found. Exiting."
    exit 1
}

# Check if we're in a terminal, if not relaunch in one
if ! [ -t 0 ]; then
    relaunch_in_terminal
fi

function get_status() {
    if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo -e "\033[1;32m●\033[0m Running (PID: $(cat "$PID_FILE"))"
    else
        echo -e "\033[1;31m●\033[0m Stopped"
    fi
}

function show_system_info() {
    local uptime=$(uptime -p | sed 's/^up //')
    local load=$(uptime | awk -F'load average:' '{ print $2 }' | awk '{ print $1 }' | sed 's/,//')
    local memory=$(free -h | awk '/^Mem:/ { print $3"/"$2 }')
    local disk=$(df -h ~ | tail -1 | awk '{ print $3"/"$2" ("$5")" }')
    
    echo -e "System Info:"
    echo -e "  Uptime: \033[1;33m$uptime\033[0m"
    echo -e "  Load: \033[1;33m$load\033[0m"
    echo -e "  Memory: \033[1;33m$memory\033[0m"
    echo -e "  Disk: \033[1;33m$disk\033[0m"
}

while true; do
    clear
    echo -e "\033[1;36m$APP_TITLE\033[0m"
    echo -e "\033[0;32m$SUB_TITLE\033[0m"
    echo -e "Status: $(get_status)"
    echo ""
    show_system_info
    echo ""
    echo "Choose an action:"
    echo "1) Start Statik-Server"
    echo "2) Stop Statik-Server"
    echo "3) Restart Statik-Server"
    echo "4) Build/Update Server"
    echo "5) View Logs"
    echo "6) System Status"
    echo "7) Mesh VPN Status"
    echo "8) Open in Browser"
    echo "9) Configuration"
    echo "0) Exit"
    echo "u) Uninstall"
    echo -n "Select> "
    read -r CHOICE

    case $CHOICE in
        1)
            echo "🚀 Starting Statik-Server..."
            cd "$STATIK_DIR" && ./scripts/startup.sh &
            echo $! > "$PID_FILE"
            echo -e "\nStatik-Server started! Access at: http://localhost:8080"
            echo "Press enter to continue..."
            read -r
            ;;
        2)
            echo "🛑 Stopping Statik-Server..."
            if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
                kill "$(cat "$PID_FILE")"
                rm -f "$PID_FILE"
                echo "✅ Statik-Server stopped"
            else
                echo "⚠️  Statik-Server not running"
            fi
            echo "Press enter to continue..."
            read -r
            ;;
        3)
            echo "🔄 Restarting Statik-Server..."
            if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
                kill "$(cat "$PID_FILE")"
                sleep 2
            fi
            cd "$STATIK_DIR" && ./scripts/startup.sh &
            echo $! > "$PID_FILE"
            echo -e "\nStatik-Server restarted!"
            echo "Press enter to continue..."
            read -r
            ;;
        4)
            echo "🔨 Building/Updating Statik-Server..."
            cd "$STATIK_DIR" && ./scripts/build.sh
            echo -e "\nBuild complete!"
            echo "Press enter to continue..."
            read -r
            ;;
        5)
            echo -e "\n\033[0;36m[Last 40 lines from: $LOG_FILE]\033[0m"
            tail -n 40 "$LOG_FILE" 2>/dev/null || echo "No log file found"
            echo -e "\nPress enter to continue..."
            read -r
            ;;
        6)
            clear
            echo -e "\033[1;36mStatik-Server System Status\033[0m"
            echo "=========================="
            echo -e "Server Status: $(get_status)"
            echo ""
            show_system_info
            echo ""
            echo "Service Ports:"
            echo "  VS Code Server: 8080"
            echo "  Mesh VPN Admin: 8081"
            echo "  Headscale API: 50443"
            echo ""
            netstat -tlnp 2>/dev/null | grep -E ':(8080|8081|50443)' || echo "  No services listening"
            echo -e "\nPress enter to continue..."
            read -r
            ;;
        7)
            clear
            echo -e "\033[1;36mMesh VPN Status\033[0m"
            echo "==============="
            if command -v headscale >/dev/null; then
                echo "Headscale nodes:"
                headscale nodes list 2>/dev/null || echo "  No nodes registered"
                echo ""
                echo "Auth keys:"
                headscale preauthkeys list 2>/dev/null || echo "  No auth keys"
            else
                echo "  Headscale not found in PATH"
            fi
            echo -e "\nPress enter to continue..."
            read -r
            ;;
        8)
            echo "🌐 Opening Statik-Server in browser..."
            if command -v xdg-open >/dev/null; then
                xdg-open "http://localhost:8080" &
            elif command -v open >/dev/null; then
                open "http://localhost:8080" &
            else
                echo "Please open http://localhost:8080 in your browser"
            fi
            echo "Press enter to continue..."
            read -r
            ;;
        9)
            clear
            echo -e "\033[1;36mStatik-Server Configuration\033[0m"
            echo "========================="
            echo "1) Set GitHub Token"
            echo "2) View Current Config"
            echo "3) Reset Configuration"
            echo "4) Back to Main Menu"
            echo -n "Select> "
            read -r CONFIG_CHOICE
            case $CONFIG_CHOICE in
                1)
                    echo -n "Enter GitHub Token (with Copilot access): "
                    read -r -s GITHUB_TOKEN
                    echo ""
                    mkdir -p "$(dirname "$HOME/.statik/keys/github-token")"
                    echo "$GITHUB_TOKEN" > "$HOME/.statik/keys/github-token"
                    echo "✅ GitHub token saved"
                    ;;
                2)
                    echo "Current configuration:"
                    echo "  Config dir: $HOME/.statik"
                    echo "  GitHub token: $(test -f "$HOME/.statik/keys/github-token" && echo "✅ Set" || echo "❌ Not set")"
                    echo "  Mesh keys: $(test -f "$HOME/.statik/keys/preauth.key" && echo "✅ Set" || echo "❌ Not set")"
                    ;;
                3)
                    echo -e "\033[1;31mWARNING: This will reset all configuration!\033[0m"
                    echo -n "Type 'RESET' to confirm: "
                    read -r CONFIRM
                    if [[ "$CONFIRM" == "RESET" ]]; then
                        rm -rf "$HOME/.statik"
                        echo "✅ Configuration reset"
                    fi
                    ;;
            esac
            echo "Press enter to continue..."
            read -r
            ;;
        0)
            exit 0
            ;;
        u)
            echo -e "\n\033[1;31mWARNING: This will uninstall Statik-Server completely.\033[0m"
            echo -n "Type 'UNINSTALL' to confirm: "
            read -r CONFIRM
            if [[ "$CONFIRM" == "UNINSTALL" ]]; then
                rm -f "$HOME/.local/share/applications/Statik-Server.desktop"
                rm -f "$HOME/.local/share/applications/statik_cli.sh"
                rm -f "$HOME/.local/share/icons/statik-server.png"
                rm -f "$HOME/.local/bin/statik-server"
                echo "✅ Statik-Server app uninstalled"
                exit 0
            else
                echo "Uninstall cancelled."
            fi
            echo "Press enter to continue..."
            read -r
            ;;
        *)
            echo "Invalid choice. Press enter to try again..."
            read -r
            ;;
    esac
done
EOF

chmod +x "$APPDIR/statik_cli.sh"
echo "✅ CLI script created at $APPDIR/statik_cli.sh"

# Create desktop entry
cat > "$APPDIR/Statik-Server.desktop" << EOF
[Desktop Entry]
Type=Application
Name=$APP_NAME $APP_VERSION
Comment=$APP_COMMENT
Exec=$APPDIR/statik_cli.sh
Icon=$ICNDIR/statik-server.png
Terminal=true
Categories=Development;Utility;Network;
Keywords=vscode;ai;copilot;mesh;vpn;development;
StartupNotify=true
EOF

chmod +x "$APPDIR/Statik-Server.desktop"
echo "✅ Desktop entry created at $APPDIR/Statik-Server.desktop"

# Create command-line launcher (GUI)
cat > "$BINDIR/statik-server" << EOF
#!/usr/bin/env bash
# Statik-Server GUI launcher
exec "$APPDIR/statik_cli.sh" "\$@"
EOF

chmod +x "$BINDIR/statik-server"
echo "✅ GUI launcher created at $BINDIR/statik-server"

# Create direct CLI launcher
if [[ -f "$SCRIPT_DIR/statik-cli" ]]; then
    cp "$SCRIPT_DIR/statik-cli" "$BINDIR/statik-cli"
    chmod +x "$BINDIR/statik-cli"
    echo "✅ CLI command created at $BINDIR/statik-cli"
fi

# Update desktop database
if command -v update-desktop-database >/dev/null; then
    update-desktop-database "$APPDIR" 2>/dev/null || true
fi

# Update icon cache
if command -v gtk-update-icon-cache >/dev/null; then
    gtk-update-icon-cache "$ICNDIR" 2>/dev/null || true
fi

echo ""
echo "🎉 Statik-Server App Interface Installed Successfully!"
echo "======================================================"
echo ""
echo "Access methods:"
echo "  📱 GUI App: Search 'Statik-Server' in your application menu"
echo "  💻 CLI: Run 'statik-cli [command]' in terminal"
echo "  🖥️  GUI CLI: Run 'statik-server' for interactive interface"
echo "  🔗 Direct: $APPDIR/statik_cli.sh"
echo ""
echo "Features:"
echo "  ✅ State-of-the-art CLI interface with direct commands"
echo "  ✅ Interactive GUI with full system monitoring"
echo "  ✅ Desktop integration with icon"
echo "  ✅ Full pre-launch and runtime control"
echo "  ✅ System monitoring and status"
echo "  ✅ Mesh VPN management"
echo "  ✅ Configuration management"
echo "  ✅ Log viewing and troubleshooting"
echo "  ✅ Browser integration"
echo ""
echo "Next steps:"
echo "  1. Set up GitHub token: statik-cli config token"
echo "  2. Build the server: statik-cli build"
echo "  3. Start the server: statik-cli start"
echo "  4. Check status: statik-cli status"
echo "  5. Open in browser: statik-cli open"
echo ""
