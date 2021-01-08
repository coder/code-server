<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# iPad

- [Known Issues](#known-issues)
- [How to access code-server with a self signed certificate on iPad?](#how-to-access-code-server-with-a-self-signed-certificate-on-ipad)
  - [Servediter iPad App](#servediter-ipad-app)
- [Raspberry Pi USB-C Network](#raspberry-pi-usb-c-network)
- [Recommendations](#recommendations)
- [By 2022 iPad coding more desirable on Arm Macs](#by-2022-ipad-coding-more-desirable-on-arm-macs)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Known Issues

- Getting self signed certificates certificates to work is involved, see below.
- Keyboard issues
  - May disappear sometimes [#1313](https://github.com/cdr/code-server/issues/1313), [#979](https://github.com/cdr/code-server/issues/979)
  - Some short cuts expectations may not be met
    - `command + n` opens new browser window instead of new file and difficult to even set to another quick key
    - In general it's just note worthy you most likely will need to edit keyboard shortcuts
  - No escape key by default on Magic Keyboard but everyone sets the globe key to be an escape key
    - Opinion: It's actually an awesome joy having the escape key at bottom of keyboard
- Trackpad scrolling does not work [#1455](https://github.com/cdr/code-server/issues/1455)
  - [Bug tracking of a WebKit fix here](https://bugs.webkit.org/show_bug.cgi?id=210071#c13)
  - [tracking of WebKit patch](https://trac.webkit.org/changeset/270712/webkit)
  - Alternative: Install line-jump extension and use keyboard to nav by jumping large amount of lines
  - Alternative: Just use touch scrolling
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
   the certificate. [more apple support here](https://support.apple.com/en-us/HT204477)
6. Now you can access code-server! 🍻

### Servediter iPad App

If you are unable to get the self signed certificate working or you do not have a domain
name to use, you can use the Servediter iPad App instead!

**note**: This is not an officially supported app by the code-server team!

Download [Serveediter](https://apps.apple.com/us/app/servediter-for-code-server/id1504491325) from the
App Store and then input your server information. If you are running a local server or mabye a usb-c
connected Raspberry Pi, you will input your settings into "Self Hosted Server".

## Raspberry Pi USB-C Network

It is a bit out of scope for this project, however, great success is being reported using iPad on the go with just a single USB-C cable connected to a Raspberry Pi both powering and supplying direct network access. Many support articles already exist but the key steps boil down to turning on Network over USB-C on the Raspberry Pi itself and the rest of the steps are just like getting Code Server running any where else.

Resources worthy of review:

- [General intro to Pi as an iPad accessory](https://www.youtube.com/watch?v=IR6sDcKo3V8)
- [iPad with Pi FAQ](https://www.youtube.com/watch?v=SPSlyqo5Q2Q)
- [Technical guide to perform the steps](https://www.geeky-gadgets.com/connect-a-raspberry-pi-4-to-an-ipad-pro-21-01-2020/)

> Here are my keys to success. I bought a 4" touch screen with fan included that attaches as a case to the Pi. I use the touch screen for anytime I have connection issues, otherwise I turn off the Pi screen. I gave my Pi a network name so I can easily connect at home on wifi or when on go with 1 usb-c cable that supplys both power and network connectivity. Lastly, not all usb-c cables are equal and not all will work so try different usb-c cables if you are going mad (confirm over wifi first then move to cable).
>
> -- <cite>[Acker Apple](http://github.com/ackerapple/)</cite>

## Recommendations

Once you have code-server accessible to your iPad a few things could help save you time:

- Use multi task mode to make code changes and see browser at the same time
  - Prevents iOs background dropping an App's state if you are full screen switching between code-server and browser
- Be sure you are using the debug/terminal that is built into VS Code so that you don’t need another terminal app running
  - Again, prevents switching between full screen app and losing your view to iOs background app memory management
- You should be of a mindset willing to deal and adapt with differences in having an imperfect experience, for the perceived joyful benefits of interacting with your computer in more intuitive ways

## By 2022 iPad coding more desirable on Arm Macs

> This section is generalized opinions intended to inform fellow Apple product consumers of perceived over time changes coming down the line

The general feeling from overall Apple movements recently, is that the Mac arm processors are in fact helping support the direction of having Macs with touch screens. Many great YouTube videos of interest call out highly suggestive evidence. In the past Apple has hard declared reasons of body fatigue and such as why not to encourage nor further developments on the iPad touch experience mixed with a keyboard/mouse/trackpad. Regardless, products and software have been released further supporting just that very experience.

The iPad coding experience has been a joy for some of us that are willing to trade an imperfect experience for a uniquely effective focus driven experience. Note worthy, some of us think it's a trashy waste of time. This experience is undoubtably going to get better just by the work that can be seen by all parties, even in our own code-server attempt to make it better.

Lastly, it is note worthy that if you have decided to incorporate a Raspberry Pi into you iPad coding experience, they are Arm processors. You are perfectly lined up with the future of Macs as well.
