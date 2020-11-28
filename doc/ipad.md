<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# iPad

- [Known Issues](#known-issues)
- [How to access code-server with a self signed certificate on iPad?](#how-to-access-code-server-with-a-self-signed-certificate-on-ipad)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Known Issues

- Getting self signed certificates certificates to work is involved, see below.
- Keyboard may disappear sometimes [#1313](https://github.com/cdr/code-server/issues/1313), [#979](https://github.com/cdr/code-server/issues/979)
- Trackpad scrolling does not work [#1455](https://github.com/cdr/code-server/issues/1455)
- See [issues tagged with the iPad label](https://github.com/cdr/code-server/issues?q=is%3Aopen+is%3Aissue+label%3AiPad) for more.

## How to access code-server with a self signed certificate on iPad?

Accessing a self signed certificate on iPad isn't as easy as accepting through all
the security warnings. Safari will prevent WebSocket connections unless the certificate
is installed as a profile on the device.

The below assumes you are using the self signed certificate that code-server
generates for you. If not, that's fine but you'll have to make sure your certificate
abides by the following guidelines from Apple: https://support.apple.com/en-us/HT210176

**note**: Another undocumented requirement we noticed is that the certificate has to have `basicConstraints=CA:true`.

The following instructions assume you have code-server installed and running
with a self signed certificate. If not, please first go through [./guide.md](./guide.md)!

**warning**: Your iPad must access code-server via a domain name. It could be local
DNS like `mymacbookpro.local` but it must be a domain name. Otherwise Safari will
refuse to allow WebSockets to connect.

1. Your certificate **must** have a subject alt name that matches the hostname
   at which you will access code-server from your iPad. You can pass this to code-server
   so that it generates the certificate correctly with `--cert-host`.
2. Share your self signed certificate with the iPad.
   - code-server will print the location of the certificate it has generated in the logs.

```
[2020-10-30T08:55:45.139Z] info    - Using generated certificate and key for HTTPS: ~/.local/share/code-server/mymbp_local.crt
```

- You can mail it to yourself or if you have a Mac, it's easiest to just Airdrop to the iPad.

3. When opening the `*.crt` file, you'll be prompted to go into settings to install.
4. Go to `Settings -> General -> Profile`, select the profile and then hit `Install`.
   - It should say the profile is verified.
5. Go to `Settings -> About -> Certificate Trust Settings` and enable full trust for
   the certificate.
6. Now you can access code-server! 🍻
