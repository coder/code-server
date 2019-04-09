#!/bin/bash

# Updates Code Server to the latest version
curl -s https://api.github.com/repos/codercom/code-server/releases/latest | grep "browser_download_url.*code-server.*linux-x64.tar.gz" | cut -d '"' -f 4 | wget -O ~/code-server-linux.tar.gz --show-progress -qi -
mkdir -p ~/code-server-linux && tar -xzvf ~/code-server-linux.tar.gz --strip 1 -C "$_"
cd ~/code-server-linux || return
chmod +x code-server