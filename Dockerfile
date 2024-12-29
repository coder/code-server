ARG SERVER_VERSION=20241223_895aa2908981
FROM registry.goldenhelix.com/gh/server:${SERVER_VERSION}

USER root

# Install various locales to support users from different regions
COPY ./install_locales.sh /tmp/install_locales.sh
RUN bash /tmp/install_locales.sh

# Copy the release-standalone directory
COPY ./release-standalone /opt/code-server
COPY ./startup.sh /opt/code-server/startup.sh

# Remove the existing node binary and create symlink to the system node
RUN rm -f /opt/code-server/lib/node && \
    ln -s /opt/node/bin/node /opt/code-server/lib/node && \
    chmod +x /opt/code-server/startup.sh

# Set the environment variables
ARG LANG='en_US.UTF-8'
ARG LANGUAGE='en_US:en'
ARG LC_ALL='en_US.UTF-8'
ARG START_XFCE4=1
ARG TZ='Etc/UTC'
ENV HOME=/home/ghuser \
    SHELL=/bin/bash \
    USERNAME=ghuser \
    LANG=$LANG \
    LANGUAGE=$LANGUAGE \
    LC_ALL=$LC_ALL \
    TZ=$TZ \
    AUTH_USER=ghuser \
    CODE_SERVER_SESSION_SOCKET=/home/ghuser/.config/code-server/code-server-ipc.sock \
    PASSWORD=ghuserpassword \
    PORT=8080

### Ports and user
EXPOSE $PORT
WORKDIR $HOME
USER 1000

RUN mkdir -p $HOME/.config/code-server && \
echo "bind-addr: 0.0.0.0:8080" > $HOME/.config/code-server/config.yaml && \
echo "auth: password" >> $HOME/.config/code-server/config.yaml && \
echo "password: \${PASSWORD}" >> $HOME/.config/code-server/config.yaml && \
echo "cert: true" >> $HOME/.config/code-server/config.yaml


RUN mkdir -p $HOME/Workspace/Documents

ENTRYPOINT ["/opt/code-server/startup.sh"]
