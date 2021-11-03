const https = require('https');
const fs = require('fs');

const url = `https://github.com/koalaman/shellcheck/releases/download/stable/shellcheck-stable.${process.platform}.x86_64.tar.xz`;

const isRedirect = (statusCode) => {
  return statusCode >= 300 && statusCode < 400;
};

const download = (url) => {
  https
    .get(url, res => {
      if (isRedirect(res.statusCode)) {
        download(res.headers.location);
      } else {
        res.pipe(process.stdout);
      }
    })
    .on('error', err => {
      console.log('Error: ' + err.message);
    });
};

download(url);
