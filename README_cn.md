# code-server

[!["Open Issues"](https://img.shields.io/github/issues-raw/codercom/code-server.svg)](https://github.com/codercom/code-server/issues)
[!["Latest Release"](https://img.shields.io/github/release/codercom/code-server.svg)](https://github.com/codercom/code-server/releases/latest)
[![MIT license](https://img.shields.io/badge/license-MIT-green.svg)](#)
[![Discord](https://discordapp.com/api/guilds/463752820026376202/widget.png)](https://discord.gg/zxSwN8Z)

`code-server` 是部署运行在远程服务器上的 [VS Code](https://github.com/Microsoft/vscode), 并通过本地浏览器访问.

通过 `code-server` 可以：
- 在 Chromebook、平板、笔记本电脑为您提供一致的代码开发环境
    - 只要您拥有一台 Windows 或者 Mac 主机，如果是Linux会更加方便。
- 将云端服务器的优势发挥到极致: 加快测试、编译、下载速度……
- 旅途中极大地节约设备电量。
    - 所有运算都发生在云主机上.
    - 不需要再运行额外的 Chrome 实例.


![Screenshot](/doc/assets/ide.png)

## 快速入门

在 coder.com 上 [立即尝试 `code-server`](https://coder.com/signup).

或者**私有化部署**

1.  [下载 release 版本](https://github.com/codercom/code-server/releases) (目前仅支持 Linux 和 OSX , Windows 版本仍在开发中)
2.  启动程序并通过第一个参数设定初始目录

    ```
    code-server <初始目录>
    ```
	> 启动后会打印一个随机的密码，用于在浏览器上登录。在浏览器中通过 https://localhost:8443 访问 `code-server`。

	> code-server 使用了 SSL 自签名证书进行 https 加密，打开浏览器时可能会受到证书不安全的提示，按照提示操作即可，详细介绍请[阅读此处](doc/self-hosted/index.md)。

详细的操作、部署步骤, 请阅读 [私有化部署教程](doc/self-hosted/index.md).

关于 [Google Cloud](doc/admin/install/google_cloud.md), [AWS](doc/admin/install/aws.md), 和 [Digital Ocean](doc/admin/install/digitalocean.md) 部署的快速入门指南.

如何 [加密连接](/doc/security/ssl.md).

## 开发情况

### 已知问题

- debug 插件无效.

### 开发计划

- 支持 Windows .
- 提供 Electron 程序和 ChromeOS applications ，进行本地和远程的交互.
- 增加运行 VS Code unit tests，以保证功能和特性的完善.

## 贡献

开发规范待定.

## License

[MIT](LICENSE)

## Enterprise

关于 enterprise 版本，请访问我们的 [enterprise版本页面](https://coder.com/enterprise) 了解详细信息。


## 商业化

如果您有兴趣将 `code-server` 商业化, 请联系  contact@coder.com.
