# Deploy on Google Cloud

This tutorial shows you how to deploy `code-server` to a single node running on Google Cloud.

If you're just starting out, we recommend [installing code-server locally](../../self-hosted/index.md). It takes only a few minutes and lets you try out all of the features. You can also try out the IDE on a container hosted [by Coder](http://coder.com/signup)

---

## Deploy to Google Cloud VM
> Pre-requisite: Please [set up Google Cloud SDK](https://cloud.google.com/sdk/docs/) on your local machine

- [Open your Google Cloud console](https://console.cloud.google.com/compute/instances) to create a new VM instance and click **Create Instance**
- Choose an appropriate machine type (we recommend 2 vCPU and 7.5 GB RAM, more depending on team size and number of repositories/languages enabled)
- Choose Ubuntu 16.04 LTS as your boot disk
- Check the boxes for **Allow HTTP traffic** and **Allow HTTPS traffic** in the **Firewall** section
- Create your VM, and **take note** of it's public IP address.
- Copy the link to download the latest Linux binary from our [releases page](https://github.com/codercom/code-server/releases)

---

## Final Steps

1. SSH into your Google Cloud VM
```
gcloud compute ssh --zone [region] [instance name]
```
2. Download the binary using the link we copied to clipboard
```
wget https://github.com/codercom/code-server/releases/download/0.1.4/code-server-linux
```
3. Make the binary executable if you run into any errors regarding permission:
  ```
  chmod +x code-server-linux
  ```
> To ensure the connection between you and your server is encrypted view our guide on [securing your setup](../security/ssl.md)
4. Start the code-server
```
sudo ./code-server-linux -p 80
```
> For instructions on how to keep the server running after you end your SSH session please checkout [how to use systemd](https://www.linode.com/docs/quick-answers/linux/start-service-at-boot/) to start linux based services if they are killed
5. Access code-server from the public IP of your Google Cloud instance we noted earlier in your browser. 
> example: 32.32.32.234
6. You will be greeted with this page. Code-server is using a self-signed SSL certificate for easy setup. To proceed to the IDE, click **"Advanced"**<img src ="../../assets/chrome_warning.png">
7. Then click **"proceed anyway"**<img src="../../assets/chrome_confirm.png">
---
> NOTE: If you get stuck or need help, [file an issue](https://github.com/codercom/code-server/issues/new?&title=Improve+self-hosted+quickstart+guide), [tweet (@coderhq)](https://twitter.com/coderhq) or [email](mailto:support@coder.com?subject=Self-hosted%20quickstart%20guide).