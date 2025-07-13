# CHANGELOG

## Next

### Database integrity improvements

This release includes a significant database migration that addresses longstanding
issues with the database schema and data integrity that has accumulated over the
years. The migration introduces a `schema.sql` file as the source of truth for
the expected database schema to ensure new migrations that will cause divergence
does not occur again.

These issues arose from a combination of factors discovered over time: SQLite
foreign keys not being enforced for many early versions, all migrations being
run in one large function until version 0.23.0, and inconsistent use of GORM's
AutoMigrate feature. Moving forward, all new migrations will be explicit SQL
operations rather than relying on GORM AutoMigrate, and foreign keys will be
enforced throughout the migration process.

We are only improving SQLite databases with this change - PostgreSQL databases
are not affected.

Please read the [PR description](https://github.com/juanfont/headscale/pull/2617)
for more technical details about the issues and solutions.

**SQLite Database Backup Example:**
```bash
# Stop headscale
systemctl stop headscale

# Backup sqlite database
cp /var/lib/headscale/db.sqlite /var/lib/headscale/db.sqlite.backup

# Backup sqlite WAL/SHM files (if they exist)
cp /var/lib/headscale/db.sqlite-wal /var/lib/headscale/db.sqlite-wal.backup
cp /var/lib/headscale/db.sqlite-shm /var/lib/headscale/db.sqlite-shm.backup

# Start headscale (migration will run automatically)
systemctl start headscale
```

### BREAKING

- Policy: Zero or empty destination port is no longer allowed
  [#2606](https://github.com/juanfont/headscale/pull/2606)

### Changes

- **Database schema migration improvements for SQLite**
  [#2617](https://github.com/juanfont/headscale/pull/2617)
  - **IMPORTANT: Backup your SQLite database before upgrading**
  - Introduces safer table renaming migration strategy
  - Addresses longstanding database integrity issues

- Remove policy v1 code [#2600](https://github.com/juanfont/headscale/pull/2600)
- Refactor Debian/Ubuntu packaging and drop support for Ubuntu 20.04.
  [#2614](https://github.com/juanfont/headscale/pull/2614)
- Support client verify for DERP
  [#2046](https://github.com/juanfont/headscale/pull/2046)
- Remove redundant check regarding `noise` config
  [#2658](https://github.com/juanfont/headscale/pull/2658)
- Refactor OpenID Connect documentation
  [#2625](https://github.com/juanfont/headscale/pull/2625)
- Don't crash if config file is missing
  [#2656](https://github.com/juanfont/headscale/pull/2656)

## 0.26.1 (2025-06-06)

### Changes

- Ensure nodes are matching both node key and machine key when connecting.
  [#2642](https://github.com/juanfont/headscale/pull/2642)

## 0.26.0 (2025-05-14)

### BREAKING

#### Routes

Route internals have been rewritten, removing the dedicated route table in the
database. This was done to simplify the codebase, which had grown unnecessarily
complex after the routes were split into separate tables. The overhead of having
to go via the database and keeping the state in sync made the code very hard to
reason about and prone to errors. The majority of the route state is only
relevant when headscale is running, and is now only kept in memory. As part of
this, the CLI and API has been simplified to reflect the changes;

```console
$ headscale nodes list-routes
ID | Hostname           | Approved | Available       | Serving (Primary)
1  | ts-head-ruqsg8     |          | 0.0.0.0/0, ::/0 |
2  | ts-unstable-fq7ob4 |          | 0.0.0.0/0, ::/0 |

$ headscale nodes approve-routes --identifier 1 --routes 0.0.0.0/0,::/0
Node updated

$ headscale nodes list-routes
ID | Hostname           | Approved        | Available       | Serving (Primary)
1  | ts-head-ruqsg8     | 0.0.0.0/0, ::/0 | 0.0.0.0/0, ::/0 | 0.0.0.0/0, ::/0
2  | ts-unstable-fq7ob4 |                 | 0.0.0.0/0, ::/0 |
```

Note that if an exit route is approved (0.0.0.0/0 or ::/0), both IPv4 and IPv6
will be approved.

- Route API and CLI has been removed
  [#2422](https://github.com/juanfont/headscale/pull/2422)
- Routes are now managed via the Node API
  [#2422](https://github.com/juanfont/headscale/pull/2422)
- Only routes accessible to the node will be sent to the node
  [#2561](https://github.com/juanfont/headscale/pull/2561)

#### Policy v2

This release introduces a new policy implementation. The new policy is a
complete rewrite, and it introduces some significant quality and consistency
improvements. In principle, there are not really any new features, but some long
standing bugs should have been resolved, or be easier to fix in the future. The
new policy code passes all of our tests.

**Changes**

- The policy is validated and "resolved" when loading, providing errors for
  invalid rules and conditions.
  - Previously this was done as a mix between load and runtime (when it was
    applied to a node).
  - This means that when you convert the first time, what was previously a
    policy that loaded, but failed at runtime, will now fail at load time.
- Error messages should be more descriptive and informative.
  - There is still work to be here, but it is already improved with "typing"
    (e.g. only Users can be put in Groups)
- All users must contain an `@` character.
  - If your user naturally contains and `@`, like an email, this will just work.
  - If its based on usernames, or other identifiers not containing an `@`, an
    `@` should be appended at the end. For example, if your user is `john`, it
    must be written as `john@` in the policy.

<details>

<summary>Migration notes when the policy is stored in the database.</summary>

This section **only** applies if the policy is stored in the database and
Headscale 0.26 doesn't start due to a policy error
(`failed to load ACL policy`).

- Start Headscale 0.26 with the environment variable `HEADSCALE_POLICY_V1=1`
  set. You can check that Headscale picked up the environment variable by
  observing this message during startup: `Using policy manager version: 1`
- Dump the policy to a file: `headscale policy get > policy.json`
- Edit `policy.json` and migrate to policy V2. Use the command
  `headscale policy check --file policy.json` to check for policy errors.
- Load the modified policy: `headscale policy set --file policy.json`
- Restart Headscale **without** the environment variable `HEADSCALE_POLICY_V1`.
  Headscale should now print the message `Using policy manager version: 2` and
  startup successfully.

</details>

**SSH**

The SSH policy has been reworked to be more consistent with the rest of the
policy. In addition, several inconsistencies between our implementation and
Tailscale's upstream has been closed and this might be a breaking change for
some users. Please refer to the
[upstream documentation](https://tailscale.com/kb/1337/acl-syntax#tailscale-ssh)
for more information on which types are allowed in `src`, `dst` and `users`.

There is one large inconsistency left, we allow `*` as a destination as we
currently do not support `autogroup:self`, `autogroup:member` and
`autogroup:tagged`. The support for `*` will be removed when we have support for
the autogroups.

**Current state**

The new policy is passing all tests, both integration and unit tests. This does
not mean it is perfect, but it is a good start. Corner cases that is currently
working in v1 and not tested might be broken in v2 (and vice versa).

**We do need help testing this code**

#### Other breaking changes

- Disallow `server_url` and `base_domain` to be equal
  [#2544](https://github.com/juanfont/headscale/pull/2544)
- Return full user in API for pre auth keys instead of string
  [#2542](https://github.com/juanfont/headscale/pull/2542)
- Pre auth key API/CLI now uses ID over username
  [#2542](https://github.com/juanfont/headscale/pull/2542)
- A non-empty list of global nameservers needs to be specified via
  `dns.nameservers.global` if the configuration option `dns.override_local_dns`
  is enabled or is not specified in the configuration file. This aligns with
  behaviour of tailscale.com.
  [#2438](https://github.com/juanfont/headscale/pull/2438)

### Changes

- Use Go 1.24 [#2427](https://github.com/juanfont/headscale/pull/2427)
- Add `headscale policy check` command to check policy
  [#2553](https://github.com/juanfont/headscale/pull/2553)
- `oidc.map_legacy_users` and `oidc.strip_email_domain` has been removed
  [#2411](https://github.com/juanfont/headscale/pull/2411)
- Add more information to `/debug` endpoint
  [#2420](https://github.com/juanfont/headscale/pull/2420)
  - It is now possible to inspect running goroutines and take profiles
  - View of config, policy, filter, ssh policy per node, connected nodes and
    DERPmap
- OIDC: Fetch UserInfo to get EmailVerified if necessary
  [#2493](https://github.com/juanfont/headscale/pull/2493)
  - If a OIDC provider doesn't include the `email_verified` claim in its ID
    tokens, Headscale will attempt to get it from the UserInfo endpoint.
- OIDC: Try to populate name, email and username from UserInfo
  [#2545](https://github.com/juanfont/headscale/pull/2545)
- Improve performance by only querying relevant nodes from the database for node
  updates [#2509](https://github.com/juanfont/headscale/pull/2509)
- node FQDNs in the netmap will now contain a dot (".") at the end. This aligns
  with behaviour of tailscale.com
  [#2503](https://github.com/juanfont/headscale/pull/2503)
- Restore support for "Override local DNS"
  [#2438](https://github.com/juanfont/headscale/pull/2438)
- Add documentation for routes
  [#2496](https://github.com/juanfont/headscale/pull/2496)
- Add support for `autogroup:member`, `autogroup:tagged`
  [#2572](https://github.com/juanfont/headscale/pull/2572)

## 0.25.1 (2025-02-25)

### Changes

- Fix issue where registration errors are sent correctly
  [#2435](https://github.com/juanfont/headscale/pull/2435)
- Fix issue where routes passed on registration were not saved
  [#2444](https://github.com/juanfont/headscale/pull/2444)
- Fix issue where registration page was displayed twice
  [#2445](https://github.com/juanfont/headscale/pull/2445)

## 0.25.0 (2025-02-11)

### BREAKING

- Authentication flow has been rewritten
  [#2374](https://github.com/juanfont/headscale/pull/2374) This change should be
  transparent to users with the exception of some buxfixes that has been
  discovered and was fixed as part of the rewrite.
  - When a node is registered with _a new user_, it will be registered as a new
    node ([#2327](https://github.com/juanfont/headscale/issues/2327) and
    [#1310](https://github.com/juanfont/headscale/issues/1310)).
  - A logged out node logging in with the same user will replace the existing
    node.
- Remove support for Tailscale clients older than 1.62 (Capability version 87)
  [#2405](https://github.com/juanfont/headscale/pull/2405)

### Changes

- `oidc.map_legacy_users` is now `false` by default
  [#2350](https://github.com/juanfont/headscale/pull/2350)
- Print Tailscale version instead of capability versions for outdated nodes
  [#2391](https://github.com/juanfont/headscale/pull/2391)
- Do not allow renaming of users from OIDC
  [#2393](https://github.com/juanfont/headscale/pull/2393)
- Change minimum hostname length to 2
  [#2393](https://github.com/juanfont/headscale/pull/2393)
- Fix migration error caused by nodes having invalid auth keys
  [#2412](https://github.com/juanfont/headscale/pull/2412)
- Pre auth keys belonging to a user are no longer deleted with the user
  [#2396](https://github.com/juanfont/headscale/pull/2396)
- Pre auth keys that are used by a node can no longer be deleted
  [#2396](https://github.com/juanfont/headscale/pull/2396)
- Rehaul HTTP errors, return better status code and errors to users
  [#2398](https://github.com/juanfont/headscale/pull/2398)
- Print headscale version and commit on server startup
  [#2415](https://github.com/juanfont/headscale/pull/2415)

## 0.24.3 (2025-02-07)

### Changes

- Fix migration error caused by nodes having invalid auth keys
  [#2412](https://github.com/juanfont/headscale/pull/2412)
- Pre auth keys belonging to a user are no longer deleted with the user
  [#2396](https://github.com/juanfont/headscale/pull/2396)
- Pre auth keys that are used by a node can no longer be deleted
  [#2396](https://github.com/juanfont/headscale/pull/2396)

## 0.24.2 (2025-01-30)

### Changes

- Fix issue where email and username being equal fails to match in Policy
  [#2388](https://github.com/juanfont/headscale/pull/2388)
- Delete invalid routes before adding a NOT NULL constraint on node_id
  [#2386](https://github.com/juanfont/headscale/pull/2386)

## 0.24.1 (2025-01-23)

### Changes

- Fix migration issue with user table for PostgreSQL
  [#2367](https://github.com/juanfont/headscale/pull/2367)
- Relax username validation to allow emails
  [#2364](https://github.com/juanfont/headscale/pull/2364)
- Remove invalid routes and add stronger constraints for routes to avoid API
  panic [#2371](https://github.com/juanfont/headscale/pull/2371)
- Fix panic when `derp.update_frequency` is 0
  [#2368](https://github.com/juanfont/headscale/pull/2368)

## 0.24.0 (2025-01-17)

### Security fix: OIDC changes in Headscale 0.24.0

The following issue _only_ affects Headscale installations which authenticate
with OIDC.

_Headscale v0.23.0 and earlier_ identified OIDC users by the "username" part of
their email address (when `strip_email_domain: true`, the default) or whole
email address (when `strip_email_domain: false`).

Depending on how Headscale and your Identity Provider (IdP) were configured,
only using the `email` claim could allow a malicious user with an IdP account to
take over another Headscale user's account, even when
`strip_email_domain: false`.

This would also cause a user to lose access to their Headscale account if they
changed their email address.

_Headscale v0.24.0_ now identifies OIDC users by the `iss` and `sub` claims.
[These are guaranteed by the OIDC specification to be stable and unique](https://openid.net/specs/openid-connect-core-1_0.html#ClaimStability),
even if a user changes email address. A well-designed IdP will typically set
`sub` to an opaque identifier like a UUID or numeric ID, which has no relation
to the user's name or email address.

Headscale v0.24.0 and later will also automatically update profile fields with
OIDC data on login. This means that users can change those details in your IdP,
and have it populate to Headscale automatically the next time they log in.
However, this may affect the way you reference users in policies.

Headscale v0.23.0 and earlier never recorded the `iss` and `sub` fields, so all
legacy (existing) OIDC accounts _need to be migrated_ to be properly secured.

#### What do I need to do to migrate?

Headscale v0.24.0 has an automatic migration feature, which is enabled by
default (`map_legacy_users: true`). **This will be disabled by default in a
future version of Headscale – any unmigrated users will get new accounts.**

The migration will mostly be done automatically, with one exception. If your
OIDC does not provide an `email_verified` claim, Headscale will ignore the
`email`. This means that either the administrator will have to mark the user
emails as verified, or ensure the users verify their emails. Any unverified
emails will be ignored, meaning that the users will get new accounts instead of
being migrated.

After this exception is ensured, make all users log into Headscale with their
account, and Headscale will automatically update the account record. This will
be transparent to the users.

When all users have logged in, you can disable the automatic migration by
setting `map_legacy_users: false` in your configuration file.

Please note that `map_legacy_users` will be set to `false` by default in v0.25.0
and the migration mechanism will be removed in v0.26.0.

<details>

<summary>What does automatic migration do?</summary>

##### What does automatic migration do?

When automatic migration is enabled (`map_legacy_users: true`), Headscale will
first match an OIDC account to a Headscale account by `iss` and `sub`, and then
fall back to matching OIDC users similarly to how Headscale v0.23.0 did:

- If `strip_email_domain: true` (the default): the Headscale username matches
  the "username" part of their email address.
- If `strip_email_domain: false`: the Headscale username matches the _whole_
  email address.

On migration, Headscale will change the account's username to their
`preferred_username`. **This could break any ACLs or policies which are
configured to match by username.**

Like with Headscale v0.23.0 and earlier, this migration only works for users who
haven't changed their email address since their last Headscale login.

A _successful_ automated migration should otherwise be transparent to users.

Once a Headscale account has been migrated, it will be _unavailable_ to be
matched by the legacy process. An OIDC login with a matching username, but
_non-matching_ `iss` and `sub` will instead get a _new_ Headscale account.

Because of the way OIDC works, Headscale's automated migration process can
_only_ work when a user tries to log in after the update.

Legacy account migration should have no effect on new installations where all
users have a recorded `sub` and `iss`.

</details>

<details>

<summary>What happens when automatic migration is disabled?</summary>

##### What happens when automatic migration is disabled?

When automatic migration is disabled (`map_legacy_users: false`), Headscale will
only try to match an OIDC account to a Headscale account by `iss` and `sub`.

If there is no match, it will get a _new_ Headscale account – even if there was
a legacy account which _could_ have matched and migrated.

We recommend new Headscale users explicitly disable automatic migration – but it
should otherwise have no effect if every account has a recorded `iss` and `sub`.

When automatic migration is disabled, the `strip_email_domain` setting will have
no effect.

</details>

Special thanks to @micolous for reviewing, proposing and working with us on
these changes.

#### Other OIDC changes

Headscale now uses
[the standard OIDC claims](https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims)
to populate and update user information every time they log in:

| Headscale profile field | OIDC claim           | Notes / examples                                                                                          |
| ----------------------- | -------------------- | --------------------------------------------------------------------------------------------------------- |
| email address           | `email`              | Only used when `"email_verified": true`                                                                   |
| display name            | `name`               | eg: `Sam Smith`                                                                                           |
| username                | `preferred_username` | Varies depending on IdP and configuration, eg: `ssmith`, `ssmith@idp.example.com`, `\\example.com\ssmith` |
| profile picture         | `picture`            | URL to a profile picture or avatar                                                                        |

These should show up nicely in the Tailscale client.

This will also affect the way you
[reference users in policies](https://github.com/juanfont/headscale/pull/2205).

### BREAKING

- Remove `dns.use_username_in_magic_dns` configuration option
  [#2020](https://github.com/juanfont/headscale/pull/2020),
  [#2279](https://github.com/juanfont/headscale/pull/2279)
  - Having usernames in magic DNS is no longer possible.
- Remove versions older than 1.56
  [#2149](https://github.com/juanfont/headscale/pull/2149)
  - Clean up old code required by old versions
- User gRPC/API [#2261](https://github.com/juanfont/headscale/pull/2261):
  - If you depend on a Headscale Web UI, you should wait with this update until
    the UI have been updated to match the new API.
  - `GET /api/v1/user/{name}` and `GetUser` have been removed in favour of
    `ListUsers` with an ID parameter
  - `RenameUser` and `DeleteUser` now require an ID instead of a name.

### Changes

- Improved compatibility of built-in DERP server with clients connecting over
  WebSocket [#2132](https://github.com/juanfont/headscale/pull/2132)
- Allow nodes to use SSH agent forwarding
  [#2145](https://github.com/juanfont/headscale/pull/2145)
- Fixed processing of fields in post request in MoveNode rpc
  [#2179](https://github.com/juanfont/headscale/pull/2179)
- Added conversion of 'Hostname' to 'givenName' in a node with FQDN rules
  applied [#2198](https://github.com/juanfont/headscale/pull/2198)
- Fixed updating of hostname and givenName when it is updated in HostInfo
  [#2199](https://github.com/juanfont/headscale/pull/2199)
- Fixed missing `stable-debug` container tag
  [#2232](https://github.com/juanfont/headscale/pull/2232)
- Loosened up `server_url` and `base_domain` check. It was overly strict in some
  cases. [#2248](https://github.com/juanfont/headscale/pull/2248)
- CLI for managing users now accepts `--identifier` in addition to `--name`,
  usage of `--identifier` is recommended
  [#2261](https://github.com/juanfont/headscale/pull/2261)
- Add `dns.extra_records_path` configuration option
  [#2262](https://github.com/juanfont/headscale/issues/2262)
- Support client verify for DERP
  [#2046](https://github.com/juanfont/headscale/pull/2046)
- Add PKCE Verifier for OIDC
  [#2314](https://github.com/juanfont/headscale/pull/2314)

## 0.23.0 (2024-09-18)

This release was intended to be mainly a code reorganisation and refactoring,
significantly improving the maintainability of the codebase. This should allow
us to improve further and make it easier for the maintainers to keep on top of
the project. However, as you all have noticed, it turned out to become a much
larger, much longer release cycle than anticipated. It has ended up to be a
release with a lot of rewrites and changes to the code base and functionality of
Headscale, cleaning up a lot of technical debt and introducing a lot of
improvements. This does come with some breaking changes,

**Please remember to always back up your database between versions**

#### Here is a short summary of the broad topics of changes:

Code has been organised into modules, reducing use of global variables/objects,
isolating concerns and “putting the right things in the logical place”.

The new
[policy](https://github.com/juanfont/headscale/tree/main/hscontrol/policy) and
[mapper](https://github.com/juanfont/headscale/tree/main/hscontrol/mapper)
package, containing the ACL/Policy logic and the logic for creating the data
served to clients (the network “map”) has been rewritten and improved. This
change has allowed us to finish SSH support and add additional tests throughout
the code to ensure correctness.

The
[“poller”, or streaming logic](https://github.com/juanfont/headscale/blob/main/hscontrol/poll.go)
has been rewritten and instead of keeping track of the latest updates, checking
at a fixed interval, it now uses go channels, implemented in our new
[notifier](https://github.com/juanfont/headscale/tree/main/hscontrol/notifier)
package and it allows us to send updates to connected clients immediately. This
should both improve performance and potential latency before a client picks up
an update.

Headscale now supports sending “delta” updates, thanks to the new mapper and
poller logic, allowing us to only inform nodes about new nodes, changed nodes
and removed nodes. Previously we sent the entire state of the network every time
an update was due.

While we have a pretty good
[test harness](https://github.com/search?q=repo%3Ajuanfont%2Fheadscale+path%3A_test.go&type=code)
for validating our changes, the changes came down to
[284 changed files with 32,316 additions and 24,245 deletions](https://github.com/juanfont/headscale/compare/b01f1f1867136d9b2d7b1392776eb363b482c525...ed78ecd)
and bugs are expected. We need help testing this release. In addition, while we
think the performance should in general be better, there might be regressions in
parts of the platform, particularly where we prioritised correctness over speed.

There are also several bugfixes that has been encountered and fixed as part of
implementing these changes, particularly after improving the test harness as
part of adopting [#1460](https://github.com/juanfont/headscale/pull/1460).

### BREAKING

- Code reorganisation, a lot of code has moved, please review the following PRs
  accordingly [#1473](https://github.com/juanfont/headscale/pull/1473)
- Change the structure of database configuration, see
  [config-example.yaml](./config-example.yaml) for the new structure.
  [#1700](https://github.com/juanfont/headscale/pull/1700)
  - Old structure has been remove and the configuration _must_ be converted.
  - Adds additional configuration for PostgreSQL for setting max open, idle
    connection and idle connection lifetime.
- API: Machine is now Node
  [#1553](https://github.com/juanfont/headscale/pull/1553)
- Remove support for older Tailscale clients
  [#1611](https://github.com/juanfont/headscale/pull/1611)
  - The oldest supported client is 1.42
- Headscale checks that _at least_ one DERP is defined at start
  [#1564](https://github.com/juanfont/headscale/pull/1564)
  - If no DERP is configured, the server will fail to start, this can be because
    it cannot load the DERPMap from file or url.
- Embedded DERP server requires a private key
  [#1611](https://github.com/juanfont/headscale/pull/1611)
  - Add a filepath entry to
    [`derp.server.private_key_path`](https://github.com/juanfont/headscale/blob/b35993981297e18393706b2c963d6db882bba6aa/config-example.yaml#L95)
- Docker images are now built with goreleaser (ko)
  [#1716](https://github.com/juanfont/headscale/pull/1716)
  [#1763](https://github.com/juanfont/headscale/pull/1763)
  - Entrypoint of container image has changed from shell to headscale, require
    change from `headscale serve` to `serve`
  - `/var/lib/headscale` and `/var/run/headscale` is no longer created
    automatically, see [container docs](./docs/setup/install/container.md)
- Prefixes are now defined per v4 and v6 range.
  [#1756](https://github.com/juanfont/headscale/pull/1756)
  - `ip_prefixes` option is now `prefixes.v4` and `prefixes.v6`
  - `prefixes.allocation` can be set to assign IPs at `sequential` or `random`.
    [#1869](https://github.com/juanfont/headscale/pull/1869)
- MagicDNS domains no longer contain usernames []()
  - This is in preparation to fix Headscales implementation of tags which
    currently does not correctly remove the link between a tagged device and a
    user. As tagged devices will not have a user, this will require a change to
    the DNS generation, removing the username, see
    [#1369](https://github.com/juanfont/headscale/issues/1369) for more
    information.
  - `use_username_in_magic_dns` can be used to turn this behaviour on again, but
    note that this option _will be removed_ when tags are fixed.
    - dns.base_domain can no longer be the same as (or part of) server_url.
    - This option brings Headscales behaviour in line with Tailscale.
- YAML files are no longer supported for headscale policy.
  [#1792](https://github.com/juanfont/headscale/pull/1792)
  - HuJSON is now the only supported format for policy.
- DNS configuration has been restructured
  [#2034](https://github.com/juanfont/headscale/pull/2034)
  - Please review the new [config-example.yaml](./config-example.yaml) for the
    new structure.

### Changes

- Use versioned migrations
  [#1644](https://github.com/juanfont/headscale/pull/1644)
- Make the OIDC callback page better
  [#1484](https://github.com/juanfont/headscale/pull/1484)
- SSH support [#1487](https://github.com/juanfont/headscale/pull/1487)
- State management has been improved
  [#1492](https://github.com/juanfont/headscale/pull/1492)
- Use error group handling to ensure tests actually pass
  [#1535](https://github.com/juanfont/headscale/pull/1535) based on
  [#1460](https://github.com/juanfont/headscale/pull/1460)
- Fix hang on SIGTERM [#1492](https://github.com/juanfont/headscale/pull/1492)
  taken from [#1480](https://github.com/juanfont/headscale/pull/1480)
- Send logs to stderr by default
  [#1524](https://github.com/juanfont/headscale/pull/1524)
- Fix [TS-2023-006](https://tailscale.com/security-bulletins/#ts-2023-006)
  security UPnP issue [#1563](https://github.com/juanfont/headscale/pull/1563)
- Turn off gRPC logging [#1640](https://github.com/juanfont/headscale/pull/1640)
  fixes [#1259](https://github.com/juanfont/headscale/issues/1259)
- Added the possibility to manually create a DERP-map entry which can be
  customized, instead of automatically creating it.
  [#1565](https://github.com/juanfont/headscale/pull/1565)
- Add support for deleting api keys
  [#1702](https://github.com/juanfont/headscale/pull/1702)
- Add command to backfill IP addresses for nodes missing IPs from configured
  prefixes. [#1869](https://github.com/juanfont/headscale/pull/1869)
- Log available update as warning
  [#1877](https://github.com/juanfont/headscale/pull/1877)
- Add `autogroup:internet` to Policy
  [#1917](https://github.com/juanfont/headscale/pull/1917)
- Restore foreign keys and add constraints
  [#1562](https://github.com/juanfont/headscale/pull/1562)
- Make registration page easier to use on mobile devices
- Make write-ahead-log default on and configurable for SQLite
  [#1985](https://github.com/juanfont/headscale/pull/1985)
- Add APIs for managing headscale policy.
  [#1792](https://github.com/juanfont/headscale/pull/1792)
- Fix for registering nodes using preauthkeys when running on a postgres
  database in a non-UTC timezone.
  [#764](https://github.com/juanfont/headscale/issues/764)
- Make sure integration tests cover postgres for all scenarios
- CLI commands (all except `serve`) only requires minimal configuration, no more
  errors or warnings from unset settings
  [#2109](https://github.com/juanfont/headscale/pull/2109)
- CLI results are now concistently sent to stdout and errors to stderr
  [#2109](https://github.com/juanfont/headscale/pull/2109)
- Fix issue where shutting down headscale would hang
  [#2113](https://github.com/juanfont/headscale/pull/2113)

## 0.22.3 (2023-05-12)

### Changes

- Added missing ca-certificates in Docker image
  [#1463](https://github.com/juanfont/headscale/pull/1463)

## 0.22.2 (2023-05-10)

### Changes

- Add environment flags to enable pprof (profiling)
  [#1382](https://github.com/juanfont/headscale/pull/1382)
  - Profiles are continuously generated in our integration tests.
- Fix systemd service file location in `.deb` packages
  [#1391](https://github.com/juanfont/headscale/pull/1391)
- Improvements on Noise implementation
  [#1379](https://github.com/juanfont/headscale/pull/1379)
- Replace node filter logic, ensuring nodes with access can see each other
  [#1381](https://github.com/juanfont/headscale/pull/1381)
- Disable (or delete) both exit routes at the same time
  [#1428](https://github.com/juanfont/headscale/pull/1428)
- Ditch distroless for Docker image, create default socket dir in
  `/var/run/headscale` [#1450](https://github.com/juanfont/headscale/pull/1450)

## 0.22.1 (2023-04-20)

### Changes

- Fix issue where systemd could not bind to port 80
  [#1365](https://github.com/juanfont/headscale/pull/1365)

## 0.22.0 (2023-04-20)

### Changes

- Add `.deb` packages to release process
  [#1297](https://github.com/juanfont/headscale/pull/1297)
- Update and simplify the documentation to use new `.deb` packages
  [#1349](https://github.com/juanfont/headscale/pull/1349)
- Add 32-bit Arm platforms to release process
  [#1297](https://github.com/juanfont/headscale/pull/1297)
- Fix longstanding bug that would prevent "\*" from working properly in ACLs
  (issue [#699](https://github.com/juanfont/headscale/issues/699))
  [#1279](https://github.com/juanfont/headscale/pull/1279)
- Fix issue where IPv6 could not be used in, or while using ACLs (part of
  [#809](https://github.com/juanfont/headscale/issues/809))
  [#1339](https://github.com/juanfont/headscale/pull/1339)
- Target Go 1.20 and Tailscale 1.38 for Headscale
  [#1323](https://github.com/juanfont/headscale/pull/1323)

## 0.21.0 (2023-03-20)

### Changes

- Adding "configtest" CLI command.
  [#1230](https://github.com/juanfont/headscale/pull/1230)
- Add documentation on connecting with iOS to `/apple`
  [#1261](https://github.com/juanfont/headscale/pull/1261)
- Update iOS compatibility and added documentation for iOS
  [#1264](https://github.com/juanfont/headscale/pull/1264)
- Allow to delete routes
  [#1244](https://github.com/juanfont/headscale/pull/1244)

## 0.20.0 (2023-02-03)

### Changes

- Fix wrong behaviour in exit nodes
  [#1159](https://github.com/juanfont/headscale/pull/1159)
- Align behaviour of `dns_config.restricted_nameservers` to tailscale
  [#1162](https://github.com/juanfont/headscale/pull/1162)
- Make OpenID Connect authenticated client expiry time configurable
  [#1191](https://github.com/juanfont/headscale/pull/1191)
  - defaults to 180 days like Tailscale SaaS
  - adds option to use the expiry time from the OpenID token for the node (see
    config-example.yaml)
- Set ControlTime in Map info sent to nodes
  [#1195](https://github.com/juanfont/headscale/pull/1195)
- Populate Tags field on Node updates sent
  [#1195](https://github.com/juanfont/headscale/pull/1195)

## 0.19.0 (2023-01-29)

### BREAKING

- Rename Namespace to User
  [#1144](https://github.com/juanfont/headscale/pull/1144)
  - **BACKUP your database before upgrading**
- Command line flags previously taking `--namespace` or `-n` will now require
  `--user` or `-u`

## 0.18.0 (2023-01-14)

### Changes

- Reworked routing and added support for subnet router failover
  [#1024](https://github.com/juanfont/headscale/pull/1024)
- Added an OIDC AllowGroups Configuration options and authorization check
  [#1041](https://github.com/juanfont/headscale/pull/1041)
- Set `db_ssl` to false by default
  [#1052](https://github.com/juanfont/headscale/pull/1052)
- Fix duplicate nodes due to incorrect implementation of the protocol
  [#1058](https://github.com/juanfont/headscale/pull/1058)
- Report if a machine is online in CLI more accurately
  [#1062](https://github.com/juanfont/headscale/pull/1062)
- Added config option for custom DNS records
  [#1035](https://github.com/juanfont/headscale/pull/1035)
- Expire nodes based on OIDC token expiry
  [#1067](https://github.com/juanfont/headscale/pull/1067)
- Remove ephemeral nodes on logout
  [#1098](https://github.com/juanfont/headscale/pull/1098)
- Performance improvements in ACLs
  [#1129](https://github.com/juanfont/headscale/pull/1129)
- OIDC client secret can be passed via a file
  [#1127](https://github.com/juanfont/headscale/pull/1127)

## 0.17.1 (2022-12-05)

### Changes

- Correct typo on macOS standalone profile link
  [#1028](https://github.com/juanfont/headscale/pull/1028)
- Update platform docs with Fast User Switching
  [#1016](https://github.com/juanfont/headscale/pull/1016)

## 0.17.0 (2022-11-26)

### BREAKING

- `noise.private_key_path` has been added and is required for the new noise
  protocol.
- Log level option `log_level` was moved to a distinct `log` config section and
  renamed to `level` [#768](https://github.com/juanfont/headscale/pull/768)
- Removed Alpine Linux container image
  [#962](https://github.com/juanfont/headscale/pull/962)

### Important Changes

- Added support for Tailscale TS2021 protocol
  [#738](https://github.com/juanfont/headscale/pull/738)
- Add experimental support for
  [SSH ACL](https://tailscale.com/kb/1018/acls/#tailscale-ssh) (see docs for
  limitations) [#847](https://github.com/juanfont/headscale/pull/847)
  - Please note that this support should be considered _partially_ implemented
  - SSH ACLs status:
    - Support `accept` and `check` (SSH can be enabled and used for connecting
      and authentication)
    - Rejecting connections **are not supported**, meaning that if you enable
      SSH, then assume that _all_ `ssh` connections **will be allowed**.
    - If you decided to try this feature, please carefully managed permissions
      by blocking port `22` with regular ACLs or do _not_ set `--ssh` on your
      clients.
    - We are currently improving our testing of the SSH ACLs, help us get an
      overview by testing and giving feedback.
  - This feature should be considered dangerous and it is disabled by default.
    Enable by setting `HEADSCALE_EXPERIMENTAL_FEATURE_SSH=1`.

### Changes

- Add ability to specify config location via env var `HEADSCALE_CONFIG`
  [#674](https://github.com/juanfont/headscale/issues/674)
- Target Go 1.19 for Headscale
  [#778](https://github.com/juanfont/headscale/pull/778)
- Target Tailscale v1.30.0 to build Headscale
  [#780](https://github.com/juanfont/headscale/pull/780)
- Give a warning when running Headscale with reverse proxy improperly configured
  for WebSockets [#788](https://github.com/juanfont/headscale/pull/788)
- Fix subnet routers with Primary Routes
  [#811](https://github.com/juanfont/headscale/pull/811)
- Added support for JSON logs
  [#653](https://github.com/juanfont/headscale/issues/653)
- Sanitise the node key passed to registration url
  [#823](https://github.com/juanfont/headscale/pull/823)
- Add support for generating pre-auth keys with tags
  [#767](https://github.com/juanfont/headscale/pull/767)
- Add support for evaluating `autoApprovers` ACL entries when a machine is
  registered [#763](https://github.com/juanfont/headscale/pull/763)
- Add config flag to allow Headscale to start if OIDC provider is down
  [#829](https://github.com/juanfont/headscale/pull/829)
- Fix prefix length comparison bug in AutoApprovers route evaluation
  [#862](https://github.com/juanfont/headscale/pull/862)
- Random node DNS suffix only applied if names collide in namespace.
  [#766](https://github.com/juanfont/headscale/issues/766)
- Remove `ip_prefix` configuration option and warning
  [#899](https://github.com/juanfont/headscale/pull/899)
- Add `dns_config.override_local_dns` option
  [#905](https://github.com/juanfont/headscale/pull/905)
- Fix some DNS config issues
  [#660](https://github.com/juanfont/headscale/issues/660)
- Make it possible to disable TS2019 with build flag
  [#928](https://github.com/juanfont/headscale/pull/928)
- Fix OIDC registration issues
  [#960](https://github.com/juanfont/headscale/pull/960) and
  [#971](https://github.com/juanfont/headscale/pull/971)
- Add support for specifying NextDNS DNS-over-HTTPS resolver
  [#940](https://github.com/juanfont/headscale/pull/940)
- Make more sslmode available for postgresql connection
  [#927](https://github.com/juanfont/headscale/pull/927)

## 0.16.4 (2022-08-21)

### Changes

- Add ability to connect to PostgreSQL over TLS/SSL
  [#745](https://github.com/juanfont/headscale/pull/745)
- Fix CLI registration of expired machines
  [#754](https://github.com/juanfont/headscale/pull/754)

## 0.16.3 (2022-08-17)

### Changes

- Fix issue with OIDC authentication
  [#747](https://github.com/juanfont/headscale/pull/747)

## 0.16.2 (2022-08-14)

### Changes

- Fixed bugs in the client registration process after migration to NodeKey
  [#735](https://github.com/juanfont/headscale/pull/735)

## 0.16.1 (2022-08-12)

### Changes

- Updated dependencies (including the library that lacked armhf support)
  [#722](https://github.com/juanfont/headscale/pull/722)
- Fix missing group expansion in function `excludeCorrectlyTaggedNodes`
  [#563](https://github.com/juanfont/headscale/issues/563)
- Improve registration protocol implementation and switch to NodeKey as main
  identifier [#725](https://github.com/juanfont/headscale/pull/725)
- Add ability to connect to PostgreSQL via unix socket
  [#734](https://github.com/juanfont/headscale/pull/734)

## 0.16.0 (2022-07-25)

**Note:** Take a backup of your database before upgrading.

### BREAKING

- Old ACL syntax is no longer supported ("users" & "ports" -> "src" & "dst").
  Please check [the new syntax](https://tailscale.com/kb/1018/acls/).

### Changes

- **Drop** armhf (32-bit ARM) support.
  [#609](https://github.com/juanfont/headscale/pull/609)
- Headscale fails to serve if the ACL policy file cannot be parsed
  [#537](https://github.com/juanfont/headscale/pull/537)
- Fix labels cardinality error when registering unknown pre-auth key
  [#519](https://github.com/juanfont/headscale/pull/519)
- Fix send on closed channel crash in polling
  [#542](https://github.com/juanfont/headscale/pull/542)
- Fixed spurious calls to setLastStateChangeToNow from ephemeral nodes
  [#566](https://github.com/juanfont/headscale/pull/566)
- Add command for moving nodes between namespaces
  [#362](https://github.com/juanfont/headscale/issues/362)
- Added more configuration parameters for OpenID Connect (scopes, free-form
  parameters, domain and user allowlist)
- Add command to set tags on a node
  [#525](https://github.com/juanfont/headscale/issues/525)
- Add command to view tags of nodes
  [#356](https://github.com/juanfont/headscale/issues/356)
- Add --all (-a) flag to enable routes command
  [#360](https://github.com/juanfont/headscale/issues/360)
- Fix issue where nodes was not updated across namespaces
  [#560](https://github.com/juanfont/headscale/pull/560)
- Add the ability to rename a nodes name
  [#560](https://github.com/juanfont/headscale/pull/560)
  - Node DNS names are now unique, a random suffix will be added when a node
    joins
  - This change contains database changes, remember to **backup** your database
    before upgrading
- Add option to enable/disable logtail (Tailscale's logging infrastructure)
  [#596](https://github.com/juanfont/headscale/pull/596)
  - This change disables the logs by default
- Use [Prometheus]'s duration parser, supporting days (`d`), weeks (`w`) and
  years (`y`) [#598](https://github.com/juanfont/headscale/pull/598)
- Add support for reloading ACLs with SIGHUP
  [#601](https://github.com/juanfont/headscale/pull/601)
- Use new ACL syntax [#618](https://github.com/juanfont/headscale/pull/618)
- Add -c option to specify config file from command line
  [#285](https://github.com/juanfont/headscale/issues/285)
  [#612](https://github.com/juanfont/headscale/pull/601)
- Add configuration option to allow Tailscale clients to use a random WireGuard
  port. [kb/1181/firewalls](https://tailscale.com/kb/1181/firewalls)
  [#624](https://github.com/juanfont/headscale/pull/624)
- Improve obtuse UX regarding missing configuration
  (`ephemeral_node_inactivity_timeout` not set)
  [#639](https://github.com/juanfont/headscale/pull/639)
- Fix nodes being shown as 'offline' in `tailscale status`
  [#648](https://github.com/juanfont/headscale/pull/648)
- Improve shutdown behaviour
  [#651](https://github.com/juanfont/headscale/pull/651)
- Drop Gin as web framework in Headscale
  [648](https://github.com/juanfont/headscale/pull/648)
  [677](https://github.com/juanfont/headscale/pull/677)
- Make tailnet node updates check interval configurable
  [#675](https://github.com/juanfont/headscale/pull/675)
- Fix regression with HTTP API
  [#684](https://github.com/juanfont/headscale/pull/684)
- nodes ls now print both Hostname and Name(Issue
  [#647](https://github.com/juanfont/headscale/issues/647) PR
  [#687](https://github.com/juanfont/headscale/pull/687))

## 0.15.0 (2022-03-20)

**Note:** Take a backup of your database before upgrading.

### BREAKING

- Boundaries between Namespaces has been removed and all nodes can communicate
  by default [#357](https://github.com/juanfont/headscale/pull/357)
  - To limit access between nodes, use [ACLs](./docs/ref/acls.md).
- `/metrics` is now a configurable host:port endpoint:
  [#344](https://github.com/juanfont/headscale/pull/344). You must update your
  `config.yaml` file to include:
  ```yaml
  metrics_listen_addr: 127.0.0.1:9090
  ```

### Features

- Add support for writing ACL files with YAML
  [#359](https://github.com/juanfont/headscale/pull/359)
- Users can now use emails in ACL's groups
  [#372](https://github.com/juanfont/headscale/issues/372)
- Add shorthand aliases for commands and subcommands
  [#376](https://github.com/juanfont/headscale/pull/376)
- Add `/windows` endpoint for Windows configuration instructions + registry file
  download [#392](https://github.com/juanfont/headscale/pull/392)
- Added embedded DERP (and STUN) server into Headscale
  [#388](https://github.com/juanfont/headscale/pull/388)

### Changes

- Fix a bug were the same IP could be assigned to multiple hosts if joined in
  quick succession [#346](https://github.com/juanfont/headscale/pull/346)
- Simplify the code behind registration of machines
  [#366](https://github.com/juanfont/headscale/pull/366)
  - Nodes are now only written to database if they are registered successfully
- Fix a limitation in the ACLs that prevented users to write rules with `*` as
  source [#374](https://github.com/juanfont/headscale/issues/374)
- Reduce the overhead of marshal/unmarshal for Hostinfo, routes and endpoints by
  using specific types in Machine
  [#371](https://github.com/juanfont/headscale/pull/371)
- Apply normalization function to FQDN on hostnames when hosts registers and
  retrieve information [#363](https://github.com/juanfont/headscale/issues/363)
- Fix a bug that prevented the use of `tailscale logout` with OIDC
  [#508](https://github.com/juanfont/headscale/issues/508)
- Added Tailscale repo HEAD and unstable releases channel to the integration
  tests targets [#513](https://github.com/juanfont/headscale/pull/513)

## 0.14.0 (2022-02-24)

**UPCOMING ### BREAKING From the **next\*\* version (`0.15.0`), all machines
will be able to communicate regardless of if they are in the same namespace.
This means that the behaviour currently limited to ACLs will become default.
From version `0.15.0`, all limitation of communications must be done with ACLs.

This is a part of aligning `headscale`'s behaviour with Tailscale's upstream
behaviour.

### BREAKING

- ACLs have been rewritten to align with the bevaviour Tailscale Control Panel
  provides. **NOTE:** This is only active if you use ACLs
  - Namespaces are now treated as Users
  - All machines can communicate with all machines by default
  - Tags should now work correctly and adding a host to Headscale should now
    reload the rules.
  - The documentation have a [fictional example](./docs/ref/acls.md) that should
    cover some use cases of the ACLs features

### Features

- Add support for configurable mTLS [docs](./docs/ref/tls.md)
  [#297](https://github.com/juanfont/headscale/pull/297)

### Changes

- Remove dependency on CGO (switch from CGO SQLite to pure Go)
  [#346](https://github.com/juanfont/headscale/pull/346)

**0.13.0 (2022-02-18):**

### Features

- Add IPv6 support to the prefix assigned to namespaces
- Add API Key support
  - Enable remote control of `headscale` via CLI
    [docs](./docs/ref/remote-cli.md)
  - Enable HTTP API (beta, subject to change)
- OpenID Connect users will be mapped per namespaces
  - Each user will get its own namespace, created if it does not exist
  - `oidc.domain_map` option has been removed
  - `strip_email_domain` option has been added (see
    [config-example.yaml](./config-example.yaml))

### Changes

- `ip_prefix` is now superseded by `ip_prefixes` in the configuration
  [#208](https://github.com/juanfont/headscale/pull/208)
- Upgrade `tailscale` (1.20.4) and other dependencies to latest
  [#314](https://github.com/juanfont/headscale/pull/314)
- fix swapped machine<->namespace labels in `/metrics`
  [#312](https://github.com/juanfont/headscale/pull/312)
- remove key-value based update mechanism for namespace changes
  [#316](https://github.com/juanfont/headscale/pull/316)

**0.12.4 (2022-01-29):**

### Changes

- Make gRPC Unix Socket permissions configurable
  [#292](https://github.com/juanfont/headscale/pull/292)
- Trim whitespace before reading Private Key from file
  [#289](https://github.com/juanfont/headscale/pull/289)
- Add new command to generate a private key for `headscale`
  [#290](https://github.com/juanfont/headscale/pull/290)
- Fixed issue where hosts deleted from control server may be written back to the
  database, as long as they are connected to the control server
  [#278](https://github.com/juanfont/headscale/pull/278)

## 0.12.3 (2022-01-13)

### Changes

- Added Alpine container [#270](https://github.com/juanfont/headscale/pull/270)
- Minor updates in dependencies
  [#271](https://github.com/juanfont/headscale/pull/271)

## 0.12.2 (2022-01-11)

Happy New Year!

### Changes

- Fix Docker release [#258](https://github.com/juanfont/headscale/pull/258)
- Rewrite main docs [#262](https://github.com/juanfont/headscale/pull/262)
- Improve Docker docs [#263](https://github.com/juanfont/headscale/pull/263)

## 0.12.1 (2021-12-24)

(We are skipping 0.12.0 to correct a mishap done weeks ago with the version
tagging)

### BREAKING

- Upgrade to Tailscale 1.18
  [#229](https://github.com/juanfont/headscale/pull/229)
  - This change requires a new format for private key, private keys are now
    generated automatically:
    1. Delete your current key
    2. Restart `headscale`, a new key will be generated.
    3. Restart all Tailscale clients to fetch the new key

### Changes

- Unify configuration example
  [#197](https://github.com/juanfont/headscale/pull/197)
- Add stricter linting and formatting
  [#223](https://github.com/juanfont/headscale/pull/223)

### Features

- Add gRPC and HTTP API (HTTP API is currently disabled)
  [#204](https://github.com/juanfont/headscale/pull/204)
- Use gRPC between the CLI and the server
  [#206](https://github.com/juanfont/headscale/pull/206),
  [#212](https://github.com/juanfont/headscale/pull/212)
- Beta OpenID Connect support
  [#126](https://github.com/juanfont/headscale/pull/126),
  [#227](https://github.com/juanfont/headscale/pull/227)

## 0.11.0 (2021-10-25)

### BREAKING

- Make headscale fetch DERP map from URL and file
  [#196](https://github.com/juanfont/headscale/pull/196)
