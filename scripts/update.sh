#!/bin/bash


# Updates Code Server to the latest version
case $(uname -s) in
  Darwin) # Mac
    curl -s https://api.github.com/repos/codercom/code-server/releases/latest | \
    grep "browser_download_url.*code-server.*darwin-x64.zip" | cut -d '"' -f 4 | \
    awk '{print "url = "$1""}' | curl --create-dirs -o ~/code-server-darwin.zip --progress-bar -LK -
    mkdir -p ~/code-server-darwin && tar -C "$_" xpvf ~/code-server-darwin.zip
    chmod +x ~/code-server-darwin/code-server
    ;;
  Linux)
    curl -s https://api.github.com/repos/codercom/code-server/releases/latest | \
    grep "browser_download_url.*code-server.*linux-x64.tar.gz" | cut -d '"' -f 4 | \
    wget -O ~/code-server-linux.tar.gz --show-progress -qi -
    mkdir -p ~/code-server-linux && tar -xzvf ~/code-server-linux.tar.gz --strip 1 -C "$_"
    chmod +x ~/code-server-linux/code-server
    ;;
  *)
    echo "Unsupported operating system"
    ;;
esac
