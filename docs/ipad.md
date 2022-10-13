<!-- prettier-ignore-start -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# iPad

- [Using the code-server progressive web app (PWA)](#using-the-code-server-progressive-web-app-pwa)
- [Access code-server using Servediter](#access-code-server-using-servediter)
- [Raspberry Pi USB-C network](#raspberry-pi-usb-c-network)
- [Recommendations](#recommendations)
- [Known issues](#known-issues)
  - [Workaround for issue with `ctrl+c` not stopping a running process in the terminal](#workaround-for-issue-with-ctrlc-not-stopping-a-running-process-in-the-terminal)
- [Access code-server with a self-signed certificate on an iPad](#access-code-server-with-a-self-signed-certificate-on-an-ipad)
  - [Certificate requirements](#certificate-requirements)
  - [Sharing a self-signed certificate with an iPad](#sharing-a-self-signed-certificate-with-an-ipad)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
<!-- prettier-ignore-end -->

Once you've installed code-server, you can access it from an iPad.

## Using the code-server progressive web app (PWA)

To use code-server on an iPad, we recommend installing the code-server
progressive web app (PWA):

1. Open code-server in Safari.
2. Click the **Share** icon.
3. Click **Add to Home Screen**.

You can now open code-server from the Home screen, and when you do, you'll be
using the PWA. Running code-server as a PWA gets you more screen real estate and
access to top-level keyboard shortcuts since its running like a native app.

For example, you can use `cmd+w` to close an active file in the workbench. You
can add this to `keybindings.json`:

1. Open code-server
2. Go to **Command Palette** > **Open Keyboard Shortcuts (JSON)**
3. Add the following to `keybindings.json`

   ```json
   {
     "key": "cmd+w",
     "command": "workbench.action.closeActiveEditor"
   }
   ```

4. Test the command by using `cmd+w` to close an active file.

## Access code-server using Servediter

If you are unable to get the self-signed certificate working, or you do not have a domain
name to use, you can use [Servediter for code-server](https://apps.apple.com/us/app/servediter-for-code-server/id1504491325).

> Servediter for code-server is **not** officially supported by the code-server team!

To use Servediter:

1. Download the app from the App Store.
2. When prompted, provide your server information. If you are running a local
   server or a [Raspberry Pi connected via USB-C](#raspberry-pi-usb-c-network), you will input your settings
   into **Self Hosted Server**.

## Raspberry Pi USB-C network

We've heard of users having great success using code-server on an iPad connected
to a Raspberry Pi via USB-C (the Raspberry Pi provides both power and direct
network access). Setting this up requires you to turn on **Network over USB-C**
on the Raspberry Pi, then continuing with code-server as usual on the iPad.

For more information, see:

- [General introduction to Pi as an iPad
  accessory](https://www.youtube.com/watch?v=IR6sDcKo3V8)
- [iPad with Pi FAQ](https://www.youtube.com/watch?v=SPSlyqo5Q2Q)
- [Technical guide to connecting a Raspberry Pi to an
  iPad](https://www.geeky-gadgets.com/connect-a-raspberry-pi-4-to-an-ipad-pro-21-01-2020/)

You may also find the following tips from [Acker
Apple](http://github.com/ackerapple/) helpful:

> Here are my keys to success. I bought a 4" touch screen with fan included that
> attaches as a case to the Pi. I use the touch screen for anytime I have
> connection issues, otherwise I turn off the Pi screen. I gave my Pi a network
> name so I can easily connect at home on wifi or when on go with 1 usb-c cable
> that supplys both power and network connectivity. Lastly, not all usb-c cables
> are equal and not all will work so try different usb-c cables if you are going
> mad (confirm over wifi first then move to cable).

## Recommendations

Once you can access code-server on your iPad, you may find the following tips
and tricks helpful:

- Use multi-task mode to make code changes and see the browser at the same time
  - This prevents the iOS background from dropping an app's state if you are
    switching between code-server and browser (with both in full-screen)
- Be sure you are using the debug/terminal that is built into VS Code so that
  you don’t need another terminal app running
  - This also prevents switching between full screen apps and losing your view
    due to iOS' background app memory management

## Known issues

- Getting self-signed certificates to work [is an involved
  process](#access-code-server-with-a-self-signed-certificate-on-an-ipad)
- Keyboard issues:
  - The keyboard disappear sometimes
    [#979](https://github.com/coder/code-server/issues/979)
  - Some expectations regarding shortcuts may not be met:
    - `cmd + n` opens new browser window instead of new file, and it's difficult
      to set alternative as a workaround
    - In general, expect to edit your keyboard shortcuts
  - There's no escape key by default on the Magic Keyboard, so most users set
    the globe key to be an escape key
- Trackpad scrolling does not work on iPadOS < 14.5
  ([#1455](https://github.com/coder/code-server/issues/1455))
  - [WebKit fix](https://bugs.webkit.org/show_bug.cgi?id=210071#c13)
- Keyboard may lose focus in Safari / split view [#4182](https://github.com/coder/code-server/issues/4182)
- Terminal text does not appear by default [#3824](https://github.com/coder/code-server/issues/3824)
- Copy & paste in terminal does not work well with keyboard shortcuts [#3491](https://github.com/coder/code-server/issues/3491)
- `ctrl+c` does not stop a long-running process in the browser
  - Tracking upstream issue here:
    [#114009](https://github.com/microsoft/vscode/issues/114009)
  - See [workaround](#ctrl-c-workaround)

Additionally, see [issues in the code-server repo that are tagged with the `os-ios`
label](https://github.com/coder/code-server/issues?q=is%3Aopen+is%3Aissue+label%3Aos-ios)
for more information.

### Workaround for issue with `ctrl+c` not stopping a running process in the terminal

This's currently an issue with `ctrl+c` not stopping a running process in the
integrated terminal. We have filed an issue upstream and are tracking
[here](https://github.com/microsoft/vscode/issues/114009).

In the meantime, you can manually define a shortcut as a workaround:

1. Open the Command Palette
2. Look for **Preferences: Open Keyboard Shortcuts (JSON)**
3. Add the following snippet:

   ```json
   {
     "key": "ctrl+c",
     "command": "workbench.action.terminal.sendSequence",
     "args": {
       "text": "\u0003"
     },
     "when": "terminalFocus"
   }
   ```

_Source: [StackOverflow](https://stackoverflow.com/a/52735954/3015595)_

## Access code-server with a self-signed certificate on an iPad

If you've installed code-server and are [running it with a self-signed
certificate](./guide.md#using-a-self-signed-certificate), you may see multiple
security warnings from Safari. To fix this, you'll need to install the
self-signed certificate generated by code-server as a profile on your device (you'll also need to do this to
enable WebSocket connections).

### Certificate requirements

- We're assuming that you're using the self-signed certificate code-server
  generates for you (if not, make sure that your certificate [abides by the
  guidelines issued by Apple](https://support.apple.com/en-us/HT210176)).
- We've noticed that the certificate has to include `basicConstraints=CA:true`.
- Your certificate must have a subject alt name that matches the hostname you'll
  use to access code-server from the iPad. You can pass this name to code-server
  so that it generates the certificate correctly using `--cert-host`.

### Sharing a self-signed certificate with an iPad

To share a self-signed certificate with an iPad:

1. Get the location of the certificate code-server generated; code-server prints
   the certificate's location in its logs:

   ```console
   [2020-10-30T08:55:45.139Z] info - Using generated certificate and key for HTTPS: ~/.local/share/code-server/mymbp_local.crt
   ```

2. Send the certificate to the iPad, either by emailing it to yourself or using
   Apple's Airdrop feature.

3. Open the `*.crt` file so that you're prompted to go into Settings to install.

4. Go to **Settings** > **General** > **Profile**, and select the profile. Tap **Install**.

5. Go to **Settings** > **About** > **Certificate Trust Settings** and [enable
   full trust for your certificate](https://support.apple.com/en-us/HT204477).

You should be able to access code-server without all of Safari's warnings now.

**warning**: Your iPad must access code-server via a domain name. It could be local
DNS like `mymacbookpro.local`, but it must be a domain name. Otherwise, Safari will
not allow WebSockets connections.
