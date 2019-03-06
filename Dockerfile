FROM ubuntu
WORKDIR /app
RUN  apt-get update \
  && apt-get install -y wget \
  && rm -rf /var/lib/apt/lists/*
RUN wget https://github.com/$(wget https://github.com/codercom/code-server/releases/latest -O - | egrep '/.*/.*-linux.tar.gz' -o)
RUN tar -xvzf *
RUN cd * && chmod +x code-server
EXPOSE 9000
CMD cd * && ./code-server -p 9000