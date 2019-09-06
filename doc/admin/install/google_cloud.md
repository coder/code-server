# Deploy on Google Cloud Platform

This tutorial shows you how to deploy `code-server` to a single node running on
Google Cloud Platform.

If you're just starting out, we recommend
[installing code-server locally](self-hosted-docs). It takes only a few minutes
and lets you try out all of the features locally.

If you get stuck or need help at anytime, [file an issue](create-issue),
[tweet (@coderhq)](twitter-coderhq) or [email](email-coder).

[self-hosted-docs]: ../../self-hosted/index.md
[create-issue]: https://github.com/cdr/code-server/issues/new?title=Improve+Google+Cloud+quickstart+guide
[twitter-coderhq]: https://twitter.com/coderhq
[email-coder]: mailto:support@coder.com?subject=Google%20Cloud%20quickstart%20guide

---

## Deploy to Google Cloud VM

[Open your Google Cloud console](create-instance) to create a new VM instance.

1. Click **Create Instance**.
2. Choose an appropriate machine type (we recommend 2 vCPU and 7.5 GB RAM, or
   more depending on team size and number of repositories/languages enabled).
3. Choose **Ubuntu 16.04 LTS** as your boot disk.
4. Expand the **Management, security, disks, networking, sole tenancy** section,
   go to the **Networking** tab, then under network tags add `code-server`.
5. Create your VM, and **take note** of its public IP address.
6. Visit **VPC networks** in the console and go to **Firewall rules**. Create a
   new firewall rule called `http-8443`. Under **Target tags**, add
   `code-server`, and under **Protocols and ports** tick **Specified protocols and
   ports** and **tcp**. Beside **tcp**, add `8443`, then create the rule.

[create-instance]: https://console.cloud.google.com/compute/instances

---

## Final Steps

Please [set up Google Cloud SDK](gcloud-sdk) on your local machine, or access
your instance terminal using another method.

<!-- TODO: add a screenshot of the initial terminal like other guides -->

1. SSH into your Google Cloud VM:
   ```
   gcloud compute ssh --zone [region] [instance name]
   ```
2. At this point it is time to download the `code-server` binary. We will, of
   course, want the linux version. Find the latest code-server release from the
   [GitHub releases](code-server-latest) page.
3. Right click the Linux x64 `.tar.gz` release asset and copy the URL. In the
   SSH terminal, run the following command:
   ```
   wget (paste the URL here)
   ```
4. Extract the downloaded file with the following command:
   ```
   tar -xvzf code-server*.tar.gz
   ```
5. Navigate to extracted directory with this command:
   ```
   cd code-server*/
   ```
6. Ensure the code-server binary is executable with the following command:
   ```
   chmod +x code-server
   ```
7. Finally, to start code-server run this command:
   ```
   ./code-server
   ```
8. code-server will start up, and the password will be printed in the output.
   Make sure to copy the password for the next step.
9. Open your browser and visit `https://$public_ip:8443/` (where `$public_ip`
   is your Instance's public IP address). You will be greeted with a page
   similar to the following screenshot. code-server is using a self-signed SSL
   certificate for easy setup. In Chrome/Chromium, click **Advanced** then
   click **proceed anyway**. In Firefox, click **Advanced**, then **Add
   Exception**, then finally **Confirm Security Exception**.
   <img src="../../assets/chrome_warning.png">

[gcloud-sdk]: https://cloud.google.com/sdk/docs/
[code-server-latest]: https://github.com/cdr/code-server/releases/latest

---

### Post Installation Steps

To ensure the connection between you and your server is encrypted, view our
guides on [securing your setup](security-guide).

For instructions on how to keep the server running after you end your SSH
session please checkout [how to use systemd](systemd-guide). systemd will run
code-server for you in the background as a service and restart it for you if it
crashes.

[security-guide]: ../../security/index.md
[systemd-guide]: https://www.digitalocean.com/community/tutorials/how-to-configure-a-linux-service-to-start-automatically-after-a-crash-or-reboot-part-1-practical-examples
