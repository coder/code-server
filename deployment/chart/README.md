# code-server

[code-server](https://github.com/cdr/code-server) code-server is VS Code running
on a remote server, accessible through the browser.

## TL;DR;

```console
$ git clone https://github.com/cdr/code-server.git
$ helm install deployment/chart
```

## Introduction

This chart bootstraps a code-server deployment on a
[Kubernetes](http://kubernetes.io) cluster using the [Helm](https://helm.sh)
package manager.

## Prerequisites

  - Kubernetes 1.6+

## Installing the Chart

To install the chart with the release name `my-release`:

```console
$ helm install --name my-release deployment/chart
```

The command deploys code-server on the Kubernetes cluster in the default
configuration. The [configuration](#configuration) section lists the parameters
that can be configured during installation.

> **Tip**: List all releases using `helm list`

## Uninstalling the Chart

To uninstall/delete the `my-release` deployment:

```console
$ helm delete my-release
```

The command removes all the Kubernetes components associated with the chart and
deletes the release.

## Configuration

The following table lists the configurable parameters of the nginx-ingress chart
and their default values.


The following table lists the configurable parameters of the code-server chart
and their default values.

| Parameter                         | Description                                | Default                                                   |
| --------------------------------- | ------------------------------------------ | --------------------------------------------------------- |
| `image.registry`                  | Code-server image registry                 | `docker.io`                                               |
| `image.repository`                | Code-server Image name                     | `codercom/code-server`                                    |
| `image.tag`                       | Code-server Image tag                      | `{TAG_NAME}`                                              |
| `image.pullPolicy`                | Code-server image pull policy              | `IfNotPresent`                                            |
| `nameOverride`                    | String to partially override code-server.fullname template with a string (will prepend the release name) | `nil` |
| `fullnameOverride`                | String to fully override code-server.fullname template with a string                                   |
| `hostnameOverride`                | String to fully override code-server container hostname                                                |
| `service.type`                    | Kubernetes Service type                    | `NodePort`                                                |
| `service.port`                    | Service HTTP port                          | `8443`                                                    |
| `ingress.enabled`                 | Enable ingress controller resource         | `false`                                                   |
| `ingress.hosts[0].name`           | Hostname to your code-server installation  | `code-server.local`                                       |
| `ingress.hosts[0].path`           | Path within the url structure              | `/`                                                       |
| `ingress.hosts[0].tls`            | Utilize TLS backend in ingress             | `false`                                                   |
| `ingress.hosts[0].certManager`    | Add annotations for cert-manager           | `false`                                                   |
| `ingress.hosts[0].tlsSecret`      | TLS Secret (certificates)                  | `code-server.local-tls-secret`                            |
| `ingress.hosts[0].annotations`    | Annotations for this host's ingress record | `[]`                                                      |
| `ingress.secrets[0].name`         | TLS Secret Name                            | `nil`                                                     |
| `ingress.secrets[0].certificate`  | TLS Secret Certificate                     | `nil`                                                     |
| `ingress.secrets[0].key`          | TLS Secret Key                             | `nil`                                                     |
| `extraArgs`                       | Additional code-server container arguments | `{}`                                                      |
| `extraVars`                       | Optional environment variables for code-server | `{}`                                                  |
| `volumePermissions.enabled`       | Enable volume permissions init container       | `true`                                                |
| `volumePermissions.securityContext.runAsUser` | User ID for the init container | `0`                                                       |
| `securityContext.enabled`         | Enable security context     | `true`                                                                   |
| `securityContext.fsGroup`         | Group ID for the container  | `1000`                                                                   |
| `securityContext.runAsUser`       | User ID for the container	  | `1000`                                                                   |
| `resources`                       | CPU/Memory resource requests/limits        | `{}`                                                      |
| `persistence.enabled`             | Enable persistence using PVC               | `true`                                                    |
| `persistence.storageClass`        | PVC Storage Class for code-server volume        | `nil`                                                |
| `persistence.accessMode`          | PVC Access Mode for code-server volume          | `ReadWriteOnce`                                      |
| `persistence.size`                | PVC Storage Request for code-server volume      | `8Gi`                                                |
| `extraContainers`                 | Sidecar containers to add to the code-server pod  | `{}` |
| `extraSecretMounts`               | Additional code-server server secret mounts       | `[]`                                                    |
| `extraVolumeMounts`               | Additional code-server server volume mounts       | `[]`                                                    |
| `extraConfigmapMounts`            | Additional code-server server configMap volume mounts  | `[]`                                               |

Specify each parameter using the `--set key=value[,key=value]` argument to `helm
install`. For example,

```console
$ helm install --name my-release \
  --set persistence.enabled=false \
    deployment/chart
```

The above command sets the the persistence storage to false.

Alternatively, a YAML file that specifies the values for the above parameters
can be provided while installing the chart. For example,

```console
$ helm install --name my-release -f values.yaml deployment/chart
```

> **Tip**: You can use the default [values.yaml](values.yaml)


