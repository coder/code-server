# Frequently Asked Questions

## What is the design goal of headscale?

Headscale aims to implement a self-hosted, open source alternative to the
[Tailscale](https://tailscale.com/) control server. Headscale's goal is to
provide self-hosters and hobbyists with an open-source server they can use for
their projects and labs. It implements a narrow scope, a _single_ Tailscale
network (tailnet), suitable for a personal use, or a small open-source
organisation.

## How can I contribute?

Headscale is "Open Source, acknowledged contribution", this means that any
contribution will have to be discussed with the Maintainers before being submitted.

Please see [Contributing](contributing.md) for more information.

## Why is 'acknowledged contribution' the chosen model?

Both maintainers have full-time jobs and families, and we want to avoid burnout. We also want to avoid frustration from contributors when their PRs are not accepted.

We are more than happy to exchange emails, or to have dedicated calls before a PR is submitted.

## When/Why is Feature X going to be implemented?

We don't know. We might be working on it. If you're interested in contributing, please post a feature request about it.

Please be aware that there are a number of reasons why we might not accept specific contributions:

- It is not possible to implement the feature in a way that makes sense in a self-hosted environment.
- Given that we are reverse-engineering Tailscale to satisfy our own curiosity, we might be interested in implementing the feature ourselves.
- You are not sending unit and integration tests with it.

## Do you support Y method of deploying headscale?

We currently support deploying headscale using our binaries and the DEB packages. Visit our [installation guide using
official releases](../setup/install/official.md) for more information.

In addition to that, you may use packages provided by the community or from distributions. Learn more in the
[installation guide using community packages](../setup/install/community.md).

For convenience, we also [build container images with headscale](../setup/install/container.md). But **please be aware that
we don't officially support deploying headscale using Docker**. On our [Discord server](https://discord.gg/c84AZQhmpx)
we have a "docker-issues" channel where you can ask for Docker-specific help to the community.

## Scaling / How many clients does Headscale support?

It depends. As often stated, Headscale is not enterprise software and our focus
is homelabbers and self-hosters. Of course, we do not prevent people from using
it in a commercial/professional setting and often get questions about scaling.

Please note that when Headscale is developed, performance is not part of the
consideration as the main audience is considered to be users with a moddest
amount of devices. We focus on correctness and feature parity with Tailscale
SaaS over time.

To understand if you might be able to use Headscale for your usecase, I will
describe two scenarios in an effort to explain what is the central bottleneck
of Headscale:

1. An environment with 1000 servers

   - they rarely "move" (change their endpoints)
   - new nodes are added rarely

2. An environment with 80 laptops/phones (end user devices)

   - nodes move often, e.g. switching from home to office

Headscale calculates a map of all nodes that need to talk to each other,
creating this "world map" requires a lot of CPU time. When an event that
requires changes to this map happens, the whole "world" is recalculated, and a
new "world map" is created for every node in the network.

This means that under certain conditions, Headscale can likely handle 100s
of devices (maybe more), if there is _little to no change_ happening in the
network. For example, in Scenario 1, the process of computing the world map is
extremly demanding due to the size of the network, but when the map has been
created and the nodes are not changing, the Headscale instance will likely
return to a very low resource usage until the next time there is an event
requiring the new map.

In the case of Scenario 2, the process of computing the world map is less
demanding due to the smaller size of the network, however, the type of nodes
will likely change frequently, which would lead to a constant resource usage.

Headscale will start to struggle when the two scenarios overlap, e.g. many nodes
with frequent changes will cause the resource usage to remain constantly high.
In the worst case scenario, the queue of nodes waiting for their map will grow
to a point where Headscale never will be able to catch up, and nodes will never
learn about the current state of the world.

We expect that the performance will improve over time as we improve the code
base, but it is not a focus. In general, we will never make the tradeoff to make
things faster on the cost of less maintainable or readable code. We are a small
team and have to optimise for maintainabillity.

## Which database should I use?

We recommend the use of SQLite as database for headscale:

- SQLite is simple to setup and easy to use
- It scales well for all of headscale's usecases
- Development and testing happens primarily on SQLite
- PostgreSQL is still supported, but is considered to be in "maintenance mode"

The headscale project itself does not provide a tool to migrate from PostgreSQL to SQLite. Please have a look at [the
related tools documentation](../ref/integration/tools.md) for migration tooling provided by the community.

The choice of database has little to no impact on the performance of the server,
see [Scaling / How many clients does Headscale support?](#scaling-how-many-clients-does-headscale-support) for understanding how Headscale spends its resources.

## Why is my reverse proxy not working with headscale?

We don't know. We don't use reverse proxies with headscale ourselves, so we don't have any experience with them. We have
[community documentation](../ref/integration/reverse-proxy.md) on how to configure various reverse proxies, and a
dedicated "reverse-proxy-issues" channel on our [Discord server](https://discord.gg/c84AZQhmpx) where you can ask for
help to the community.

## Can I use headscale and tailscale on the same machine?

Running headscale on a machine that is also in the tailnet can cause problems with subnet routers, traffic relay nodes, and MagicDNS. It might work, but it is not supported.

## Why do two nodes see each other in their status, even if an ACL allows traffic only in one direction?

A frequent use case is to allow traffic only from one node to another, but not the other way around. For example, the
workstation of an administrator should be able to connect to all nodes but the nodes themselves shouldn't be able to
connect back to the administrator's node. Why do all nodes see the administrator's workstation in the output of
`tailscale status`?

This is essentially how Tailscale works. If traffic is allowed to flow in one direction, then both nodes see each other
in their output of `tailscale status`. Traffic is still filtered according to the ACL, with the exception of `tailscale
ping` which is always allowed in either direction.

See also <https://tailscale.com/kb/1087/device-visibility>.
