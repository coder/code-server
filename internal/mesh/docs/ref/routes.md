# Routes

Headscale supports route advertising and can be used to manage [subnet routers](https://tailscale.com/kb/1019/subnets)
and [exit nodes](https://tailscale.com/kb/1103/exit-nodes) for a tailnet.

- [Subnet routers](#subnet-router) may be used to connect an existing network such as a virtual
  private cloud or an on-premise network with your tailnet. Use a subnet router to access devices where Tailscale can't
  be installed or to gradually rollout Tailscale.
- [Exit nodes](#exit-node) can be used to route all Internet traffic for another Tailscale
  node. Use it to securely access the Internet on an untrusted Wi-Fi or to access online services that expect traffic
  from a specific IP address.

## Subnet router

The setup of a subnet router requires double opt-in, once from a subnet router and once on the control server to allow
its use within the tailnet. Optionally, use [`autoApprovers` to automatically approve routes from a subnet
router](#automatically-approve-routes-of-a-subnet-router).

### Setup a subnet router

#### Configure a node as subnet router

Register a node and advertise the routes it should handle as comma separated list:

```console
$ sudo tailscale up --login-server <YOUR_HEADSCALE_URL> --advertise-routes=10.0.0.0/8,192.168.0.0/24
```

If the node is already registered, it can advertise new routes or update previously announced routes with:

```console
$ sudo tailscale set --advertise-routes=10.0.0.0/8,192.168.0.0/24
```

Finally, [enable IP forwarding](#enable-ip-forwarding) to route traffic.

#### Enable the subnet router on the control server

The routes of a tailnet can be displayed with the `headscale nodes list-routes` command. A subnet router with the
hostname `myrouter` announced the IPv4 networks `10.0.0.0/8` and `192.168.0.0/24`. Those need to be approved before they
can be used.

```console
$ headscale nodes list-routes
ID | Hostname | Approved | Available                  | Serving (Primary)
1  | myrouter |          | 10.0.0.0/8, 192.168.0.0/24 |
```

Approve all desired routes of a subnet router by specifying them as comma separated list:

```console
$ headscale nodes approve-routes --identifier 1 --routes 10.0.0.0/8,192.168.0.0/24
Node updated
```

The node `myrouter` can now route the IPv4 networks `10.0.0.0/8` and `192.168.0.0/24` for the tailnet.

```console
$ headscale nodes list-routes
ID | Hostname | Approved                   | Available                  | Serving (Primary)
1  | myrouter | 10.0.0.0/8, 192.168.0.0/24 | 10.0.0.0/8, 192.168.0.0/24 | 10.0.0.0/8, 192.168.0.0/24
```

#### Use the subnet router

To accept routes advertised by a subnet router on a node:

```console
$ sudo tailscale set --accept-routes
```

Please refer to the official [Tailscale
documentation](https://tailscale.com/kb/1019/subnets#use-your-subnet-routes-from-other-devices) for how to use a subnet
router on different operating systems.

### Restrict the use of a subnet router with ACL

The routes announced by subnet routers are available to the nodes in a tailnet. By default, without an ACL enabled, all
nodes can accept and use such routes. Configure an ACL to explicitly manage who can use routes.

The ACL snippet below defines three hosts, a subnet router `router`, a regular node `node` and `service.example.net` as
internal service that can be reached via a route on the subnet router `router`. It allows the node `node` to access
`service.example.net` on port 80 and 443 which is reachable via the subnet router. Access to the subnet router itself is
denied.

```json title="Access the routes of a subnet router without the subnet router itself"
{
  "hosts": {
    // the router is not referenced but announces 192.168.0.0/24"
    "router": "100.64.0.1/32",
    "node": "100.64.0.2/32",
    "service.example.net": "192.168.0.1/32"
  },
  "acls": [
    {
      "action": "accept",
      "src": ["node"],
      "dst": ["service.example.net:80,443"]
    }
  ]
}
```

### Automatically approve routes of a subnet router

The initial setup of a subnet router usually requires manual approval of their announced routes on the control server
before they can be used by a node in a tailnet. Headscale supports the `autoApprovers` section of an ACL to automate the
approval of routes served with a subnet router.

The ACL snippet below defines the tag `tag:router` owned by the user `alice`. This tag is used for `routes` in the
`autoApprovers` section. The IPv4 route `192.168.0.0/24` is automatically approved once announced by a subnet router
owned by the user `alice` and that also advertises the tag `tag:router`.

```json title="Subnet routers owned by alice and tagged with tag:router are automatically approved"
{
  "tagOwners": {
    "tag:router": ["alice@"]
  },
  "autoApprovers": {
    "routes": {
      "192.168.0.0/24": ["tag:router"]
    }
  },
  "acls": [
    // more rules
  ]
}
```

Advertise the route `192.168.0.0/24` from a subnet router that also advertises the tag `tag:router` when joining the tailnet:

```console
$ sudo tailscale up --login-server <YOUR_HEADSCALE_URL> --advertise-tags tag:router --advertise-routes 192.168.0.0/24
```

Please see the [official Tailscale documentation](https://tailscale.com/kb/1337/acl-syntax#autoapprovers) for more
information on auto approvers.

## Exit node

The setup of an exit node requires double opt-in, once from an exit node and once on the control server to allow its use
within the tailnet. Optionally, use [`autoApprovers` to automatically approve an exit
node](#automatically-approve-an-exit-node-with-auto-approvers).

### Setup an exit node

#### Configure a node as exit node

Register a node and make it advertise itself as an exit node:

```console
$ sudo tailscale up --login-server <YOUR_HEADSCALE_URL> --advertise-exit-node
```

If the node is already registered, it can advertise exit capabilities like this:

```console
$ sudo tailscale set --advertise-exit-node
```

Finally, [enable IP forwarding](#enable-ip-forwarding) to route traffic.

#### Enable the exit node on the control server

The routes of a tailnet can be displayed with the `headscale nodes list-routes` command. An exit node can be recognized
by its announced routes: `0.0.0.0/0` for IPv4 and `::/0` for IPv6. The exit node with the hostname `myexit` is already
available, but needs to be approved:

```console
$ headscale nodes list-routes
ID | Hostname | Approved | Available       | Serving (Primary)
1  | myexit   |          | 0.0.0.0/0, ::/0 |
```

For exit nodes, it is sufficient to approve either the IPv4 or IPv6 route. The other will be approved automatically.

```console
$ headscale nodes approve-routes --identifier 1 --routes 0.0.0.0/0
Node updated
```

The node `myexit` is now approved as exit node for the tailnet:

```console
$ headscale nodes list-routes
ID | Hostname | Approved        | Available       | Serving (Primary)
1  | myexit   | 0.0.0.0/0, ::/0 | 0.0.0.0/0, ::/0 | 0.0.0.0/0, ::/0
```

#### Use the exit node

The exit node can now be used on a node with:

```console
$ sudo tailscale set --exit-node myexit
```

Please refer to the official [Tailscale documentation](https://tailscale.com/kb/1103/exit-nodes#use-the-exit-node) for
how to use an exit node on different operating systems.

### Restrict the use of an exit node with ACL

An exit node is offered to all nodes in a tailnet. By default, without an ACL enabled, all nodes in a tailnet can select
and use an exit node. Configure `autogroup:internet` in an ACL rule to restrict who can use _any_ of the available exit
nodes.

```json title="Example use of autogroup:internet"
{
  "acls": [
    {
      "action": "accept",
      "src": ["..."],
      "dst": ["autogroup:internet:*"]
    }
  ]
}
```

### Automatically approve an exit node with auto approvers

The initial setup of an exit node usually requires manual approval on the control server before it can be used by a node
in a tailnet. Headscale supports the `autoApprovers` section of an ACL to automate the approval of a new exit node as
soon as it joins the tailnet.

The ACL snippet below defines the tag `tag:exit` owned by the user `alice`. This tag is used for `exitNode` in the
`autoApprovers` section. A new exit node which is owned by the user `alice` and that also advertises the tag `tag:exit`
is automatically approved:

```json title="Exit nodes owned by alice and tagged with tag:exit are automatically approved"
{
  "tagOwners": {
    "tag:exit": ["alice@"]
  },
  "autoApprovers": {
    "exitNode": ["tag:exit"]
  },
  "acls": [
    // more rules
  ]
}
```

Advertise a node as exit node and also advertise the tag `tag:exit` when joining the tailnet:

```console
$ sudo tailscale up --login-server <YOUR_HEADSCALE_URL> --advertise-tags tag:exit --advertise-exit-node
```

Please see the [official Tailscale documentation](https://tailscale.com/kb/1337/acl-syntax#autoapprovers) for more
information on auto approvers.

## High availability

Headscale has limited support for high availability routing. Multiple subnet routers with overlapping routes or multiple
exit nodes can be used to provide high availability for users. If one router node goes offline, another one can serve
the same routes to clients. Please see the official [Tailscale documentation on high
availability](https://tailscale.com/kb/1115/high-availability#subnet-router-high-availability) for details.

!!! bug

    In certain situations it might take up to 16 minutes for Headscale to detect a node as offline. A failover node
    might not be selected fast enough, if such a node is used as subnet router or exit node causing service
    interruptions for clients. See [issue 2129](https://github.com/juanfont/headscale/issues/2129) for more information.

## Troubleshooting

### Enable IP forwarding

A subnet router or exit node is routing traffic on behalf of other nodes and thus requires IP forwarding. Check the
official [Tailscale documentation](https://tailscale.com/kb/1019/subnets/?tab=linux#enable-ip-forwarding) for how to
enable IP forwarding.
