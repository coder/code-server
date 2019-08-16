# Generate a Certificate Using Let's Encrypt 🔒

To get around the certificate warnings in Chrome, you might want to install a
certificate from a trusted Certificate Authority (CA). Luckily, there are CAs
like [Let's Encrypt](lets-encrypt) which provide certificates for free.

[lets-encrypt]: https://letsencrypt.org/

---

### Using Certbot

[Certbot](certbot) is the program we'll be using to issue certificates from
Let's Encrypt.

> Pre-requisites: You will need a domain name or subdomain pointed to the IP
> address of your server.

1. Install Certbot by heading to the [instructions page](certbot-instructions).
   Select **None of the above** for the software and the right operating system
   for your setup.
2. Follow the installation instructions, and stop once you get up to the part
   where you run the `certbot certonly` command.
3. Ensure your code-server instance isn't running, and any other webservers that
   could interfere are also stopped.
4. Run the following command, replacing `code.example.com` with the
   hostname/domain you want to run your server on, to issue a certificate:
   ```
   sudo certbot certonly --standalone -d code.example.com
   ```
5. Follow the prompts, providing your email address and accepting the terms
   where required.
6. Once the process is complete, it should print the paths to the certificates
   and keys that were generated. You can now restart any webservers you stopped
   in step 2.

[certbot]: https://certbot.eff.org/
[certbot-instructions]: https://certbot.eff.org/instructions

---

### Starting code-server with a Certificate and Key

Just add the `--cert` and `--cert-key` flags when you run code-server:

```shell
./code-server --cert=/etc/letsencrypt/live/code.example.com/fullchain.pem --cert-key=/etc/letsencrypt/live/code.example.com/privkey.pem
```

You can now verify that your SSL installation is working properly by checking
your site with [SSL Labs' SSL Test](ssl-labs-test).

[ssl-labs-test]: https://www.ssllabs.com/ssltest/

---

### Next Steps

You probably want to setup automatic renewal of your certificates, as they
expire every 3 months. You can find instructions on how to do this in
[Certbot's documentation](certbot-renew-docs).

[certbot-renew-docs]: https://certbot.eff.org/docs/using.html?highlight=hooks#renewing-certificates
