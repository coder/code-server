#!/bin/bash
set -e

if [ -d "${OPENSSL_DIR}" ]; then
    exit 0
fi

NORMALPATH=$(pwd)

sudo apt-get install -y --no-install-recommends curl

case "${LIBRARY}" in
"libressl")
    URL1="http://ftp.eu.openbsd.org/pub/OpenBSD/LibreSSL/libressl-${VERSION}.tar.gz"
    URL2="http://ftp3.usa.openbsd.org/pub/OpenBSD/LibreSSL/libressl-${VERSION}.tar.gz"
    ;;
"openssl")
    URL1="https://openssl.org/source/openssl-${VERSION}.tar.gz"
    URL2="http://mirrors.ibiblio.org/openssl/source/openssl-${VERSION}.tar.gz"
    ;;
esac

case "${TARGET}" in
"x86_64-unknown-linux-gnu")
    OS_COMPILER=linux-x86_64
    ;;
"i686-unknown-linux-gnu")
    OS_COMPILER=linux-elf
    OS_FLAGS=-m32
    ;;
"arm-unknown-linux-gnueabihf")
    OS_COMPILER=linux-armv4
    export AR=arm-linux-gnueabihf-ar
    export CC=arm-linux-gnueabihf-gcc
    ;;
esac

mkdir -p /tmp/build
cd /tmp/build

OUT=/tmp/openssl.tgz
MAX_REDIRECTS=5
curl -o ${OUT} -L --max-redirs ${MAX_REDIRECTS} "${URL1}" \
  || curl -o ${OUT} -L --max-redirs ${MAX_REDIRECTS} "${URL2}"

tar --strip-components=1 -xzf ${OUT}

case "${LIBRARY}" in
"openssl")
    ./Configure --prefix="${OPENSSL_DIR}" ${OS_COMPILER} -fPIC -g ${OS_FLAGS} no-shared -static
    ;;
"libressl")
    ./configure --prefix="${OPENSSL_DIR}" --disable-shared --with-pic
    ;;
esac

make "-j$(nproc)"
sudo make install_sw

case "${LIBRARY}" in
"openssl")
    if [[ ! -f  "${OPENSSL_DIR}/ssl/openssl.cnf" ]]; then sudo mkdir -p "${OPENSSL_DIR}/ssl" && sudo cp apps/openssl.cnf "${OPENSSL_DIR}/ssl/openssl.cnf" ; fi
    ;;
"libressl")
    if [[ ! -f  "${OPENSSL_DIR}/ssl/openssl.cnf" ]]; then sudo mkdir -p "${OPENSSL_DIR}/ssl" && sudo cp apps/openssl/openssl.cnf "${OPENSSL_DIR}/ssl/openssl.cnf" ; fi
    ;;
esac

sudo chmod -Rf 0755 /openssl

cd "${NORMALPATH}"

rm -r -f node_modules && npm i
