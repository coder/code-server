FROM codercom/ubuntu-dev

RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -

RUN sudo apt-get update && \
  sudo apt-get install -y yarn && \
  sudo apt install build-essential

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash && \
  . ~/.nvm/nvm.sh \
  && nvm install lts/dubnium
