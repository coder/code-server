# Running headscale in a container

!!! warning "Community documentation"

    This page is not actively maintained by the headscale authors and is
    written by community members. It is _not_ verified by headscale developers.

    **It might be outdated and it might miss necessary steps**.

This documentation has the goal of showing a user how-to set up and run headscale in a container. A container runtime
such as [Docker](https://www.docker.com) or [Podman](https://podman.io) is required. The container image can be found on
[Docker Hub](https://hub.docker.com/r/headscale/headscale) and [GitHub Container
Registry](https://github.com/juanfont/headscale/pkgs/container/headscale). The container image URLs are:

- [Docker Hub](https://hub.docker.com/r/headscale/headscale): `docker.io/headscale/headscale:<VERSION>`
- [GitHub Container Registry](https://github.com/juanfont/headscale/pkgs/container/headscale):
  `ghcr.io/juanfont/headscale:<VERSION>`

## Configure and run headscale

1.  Create a directory on the Docker host to store headscale's [configuration](../../ref/configuration.md) and the [SQLite](https://www.sqlite.org/) database:

    ```shell
    mkdir -p ./headscale/{config,lib,run}
    cd ./headscale
    ```

1.  Download the example configuration for your chosen version and save it as: `$(pwd)/config/config.yaml`. Adjust the
    configuration to suit your local environment. See [Configuration](../../ref/configuration.md) for details.

1.  Start headscale from within the previously created `./headscale` directory:

    ```shell
    docker run \
      --name headscale \
      --detach \
      --volume "$(pwd)/config:/etc/headscale" \
      --volume "$(pwd)/lib:/var/lib/headscale" \
      --volume "$(pwd)/run:/var/run/headscale" \
      --publish 127.0.0.1:8080:8080 \
      --publish 127.0.0.1:9090:9090 \
      docker.io/headscale/headscale:<VERSION> \
      serve
    ```

    Note: use `0.0.0.0:8080:8080` instead of `127.0.0.1:8080:8080` if you want to expose the container externally.

    This command mounts the local directories inside the container, forwards port 8080 and 9090 out of the container so
    the headscale instance becomes available and then detaches so headscale runs in the background.

    A similar configuration for `docker-compose`:

    ```yaml title="docker-compose.yaml"
    services:
      headscale:
        image: docker.io/headscale/headscale:<VERSION>
        restart: unless-stopped
        container_name: headscale
        ports:
          - "127.0.0.1:8080:8080"
          - "127.0.0.1:9090:9090"
        volumes:
          # Please set <HEADSCALE_PATH> to the absolute path
          # of the previously created headscale directory.
          - <HEADSCALE_PATH>/config:/etc/headscale
          - <HEADSCALE_PATH>/lib:/var/lib/headscale
          - <HEADSCALE_PATH>/run:/var/run/headscale
        command: serve
    ```

1.  Verify headscale is running:

    Follow the container logs:

    ```shell
    docker logs --follow headscale
    ```

    Verify running containers:

    ```shell
    docker ps
    ```

    Verify headscale is available:

    ```shell
    curl http://127.0.0.1:9090/metrics
    ```

1.  Create a headscale user:

    ```shell
    docker exec -it headscale \
      headscale users create myfirstuser
    ```

### Register a machine (normal login)

On a client machine, execute the `tailscale up` command to login:

```shell
tailscale up --login-server YOUR_HEADSCALE_URL
```

To register a machine when running headscale in a container, take the headscale command and pass it to the container:

```shell
docker exec -it headscale \
  headscale nodes register --user myfirstuser --key <YOUR_MACHINE_KEY>
```

### Register a machine using a pre authenticated key

Generate a key using the command line:

```shell
docker exec -it headscale \
  headscale preauthkeys create --user myfirstuser --reusable --expiration 24h
```

This will return a pre-authenticated key that can be used to connect a node to headscale with the `tailscale up` command:

```shell
tailscale up --login-server <YOUR_HEADSCALE_URL> --authkey <YOUR_AUTH_KEY>
```

## Debugging headscale running in Docker

The Headscale container image is based on a "distroless" image that does not contain a shell or any other debug tools. If you need to debug headscale running in the Docker container, you can use the `-debug` variant, for example `docker.io/headscale/headscale:x.x.x-debug`.

### Running the debug Docker container

To run the debug Docker container, use the exact same commands as above, but replace `docker.io/headscale/headscale:x.x.x` with `docker.io/headscale/headscale:x.x.x-debug` (`x.x.x` is the version of headscale). The two containers are compatible with each other, so you can alternate between them.

### Executing commands in the debug container

The default command in the debug container is to run `headscale`, which is located at `/ko-app/headscale` inside the container.

Additionally, the debug container includes a minimalist Busybox shell.

To launch a shell in the container, use:

```shell
docker run -it docker.io/headscale/headscale:x.x.x-debug sh
```

You can also execute commands directly, such as `ls /ko-app` in this example:

```shell
docker run docker.io/headscale/headscale:x.x.x-debug ls /ko-app
```

Using `docker exec -it` allows you to run commands in an existing container.
