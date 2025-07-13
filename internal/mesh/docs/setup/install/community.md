# Community packages

Several Linux distributions and community members provide packages for headscale. Those packages may be used instead of
the [official releases](./official.md) provided by the headscale maintainers. Such packages offer improved integration
for their targeted operating system and usually:

- setup a dedicated local user account to run headscale
- provide a default configuration
- install headscale as system service

!!! warning "Community packages might be outdated"

    The packages mentioned on this page might be outdated or unmaintained. Use the [official releases](./official.md) to
    get the current stable version or to test pre-releases.

    [![Packaging status](https://repology.org/badge/vertical-allrepos/headscale.svg)](https://repology.org/project/headscale/versions)

## Arch Linux

Arch Linux offers a package for headscale, install via:

```shell
pacman -S headscale
```

The [AUR package `headscale-git`](https://aur.archlinux.org/packages/headscale-git) can be used to build the current
development version.

## Fedora, RHEL, CentOS

A third-party repository for various RPM based distributions is available at:
<https://copr.fedorainfracloud.org/coprs/jonathanspw/headscale/>. The site provides detailed setup and installation
instructions.

## Nix, NixOS

A Nix package is available as: `headscale`. See the [NixOS package site for installation
details](https://search.nixos.org/packages?show=headscale).

## Gentoo

```shell
emerge --ask net-vpn/headscale
```

Gentoo specific documentation is available [here](https://wiki.gentoo.org/wiki/User:Maffblaster/Drafts/Headscale).

## OpenBSD

Headscale is available in ports. The port installs headscale as system service with `rc.d` and provides usage
instructions upon installation.

```shell
pkg_add headscale
```
