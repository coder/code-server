# Features

Headscale aims to implement a self-hosted, open source alternative to the Tailscale control server. Headscale's goal is
to provide self-hosters and hobbyists with an open-source server they can use for their projects and labs. This page
provides on overview of Headscale's feature and compatibility with the Tailscale control server:

- [x] Full "base" support of Tailscale's features
- [x] Node registration
    - [x] Interactive
    - [x] Pre authenticated key
- [x] [DNS](../ref/dns.md)
    - [x] [MagicDNS](https://tailscale.com/kb/1081/magicdns)
    - [x] [Global and restricted nameservers (split DNS)](https://tailscale.com/kb/1054/dns#nameservers)
    - [x] [search domains](https://tailscale.com/kb/1054/dns#search-domains)
    - [x] [Extra DNS records (Headscale only)](../ref/dns.md#setting-extra-dns-records)
- [x] [Taildrop (File Sharing)](https://tailscale.com/kb/1106/taildrop)
- [x] [Routes](../ref/routes.md)
    - [x] [Subnet routers](../ref/routes.md#subnet-router)
    - [x] [Exit nodes](../ref/routes.md#exit-node)
- [x] Dual stack (IPv4 and IPv6)
- [x] Ephemeral nodes
- [x] Embedded [DERP server](https://tailscale.com/kb/1232/derp-servers)
- [x] Access control lists ([GitHub label "policy"](https://github.com/juanfont/headscale/labels/policy%20%F0%9F%93%9D))
    - [x] ACL management via API
    - [x] Some [Autogroups](https://tailscale.com/kb/1396/targets#autogroups), currently: `autogroup:internet`,
      `autogroup:nonroot`, `autogroup:member`, `autogroup:tagged`
    - [x] [Auto approvers](https://tailscale.com/kb/1337/acl-syntax#auto-approvers) for [subnet
      routers](../ref/routes.md#automatically-approve-routes-of-a-subnet-router) and [exit
      nodes](../ref/routes.md#automatically-approve-an-exit-node-with-auto-approvers)
    - [x] [Tailscale SSH](https://tailscale.com/kb/1193/tailscale-ssh)
* [x] [Node registration using Single-Sign-On (OpenID Connect)](../ref/oidc.md) ([GitHub label "OIDC"](https://github.com/juanfont/headscale/labels/OIDC))
    - [x] Basic registration
    - [x] Update user profile from identity provider
    - [ ] OIDC groups cannot be used in ACLs
- [ ] [Funnel](https://tailscale.com/kb/1223/funnel) ([#1040](https://github.com/juanfont/headscale/issues/1040))
- [ ] [Serve](https://tailscale.com/kb/1312/serve) ([#1234](https://github.com/juanfont/headscale/issues/1921))
- [ ] [Network flow logs](https://tailscale.com/kb/1219/network-flow-logs) ([#1687](https://github.com/juanfont/headscale/issues/1687))
