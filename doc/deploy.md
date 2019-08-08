# Set up instance
## EC2 on AWS
- Click **Launch Instance** from your [EC2 dashboard](https://console.aws.amazon.com/ec2/v2/home).
- Select the Ubuntu Server 18.04 LTS (HVM), SSD Volume Type
- Select an appropriate instance size (we recommend t2.medium/large, depending
  on team size and number of repositories/languages enabled), then
  **Next: Configure Instance Details**.
- Select **Next: ...** until you get to the **Configure Security Group** page,
  then add a **Custom TCP Rule** rule with port range set to `8080` and source
  set to "Anywhere".
  > Rules with source of 0.0.0.0/0 allow all IP addresses to access your
  > instance. We recommend setting [security group rules](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-network-security.html?icmpid=docs_ec2_console)
  > to allow access from known IP addresses only.
- Click **Launch**.
- You will be prompted to create a key pair.
- From the dropdown choose "create a new pair", give the key pair a name.
- Click **Download Key Pair** and store the file in a safe place.
- Click **Launch Instances**.
- Head to your [EC2 dashboard](https://console.aws.amazon.com/ec2/v2/home)
  and choose instances from the left panel.
- In the description of your EC2 instance copy the public DNS (iPv4) address
  using the copy to clipboard button.
- Open a terminal on your computer and SSH into your instance:
  ```
  ssh -i ${path to key pair} ubuntu@${public address}
  ```

## DigitalOcean
[Open your DigitalOcean dashboard](https://cloud.digitalocean.com/droplets/new)
to create a new droplet

- **Choose an image -** Select the **Distributions** tab and then choose Ubuntu.
- **Choose a size -** We recommend at least 4GB RAM and 2 CPU, more depending
  on team size and number of repositories/languages enabled.
- Launch your instance.
- Open a terminal on your computer and SSH into your instance:
  ```
  ssh root@${instance ip}
  ```

## Google Cloud
> Pre-requisite: Set up the [Google Cloud SDK](https://cloud.google.com/sdk/docs/)
> on your local machine

- [Open your Google Cloud console](https://console.cloud.google.com/compute/instances)
  to create a new VM instance and click **Create Instance**.
- Choose an appropriate machine type (we recommend 2 vCPU and 7.5 GB RAM, more
  depending on team size and number of repositories/languages enabled).
- Choose Ubuntu 16.04 LTS as your boot disk.
- Expand the "Management, security, disks, networking, sole tenancy" section,
  go to the "Networking" tab, then under network tags add "code-server".
- Create your VM, and **take note** of its public IP address.
- Visit "VPC network" in the console and go to "Firewall rules". Create a new
  firewall rule called "http-8080". Under "Target tags" add "code-server", and
  under "Protocols and ports" tick "Specified protocols and ports" and "tcp".
  Beside "tcp", add "8080", then create the rule.
- Open a terminal on your computer and SSH into your Google Cloud VM:
  ```
  gcloud compute ssh --zone ${region} ${instance name}
  ```
# Run code-server
- Download the latest code-server release from the
  [releases page](https://github.com/cdr/code-server/releases/latest)
  to the instance, extract the file, then run the code-server binary:
  ```
  wget https://github.com/cdr/code-server/releases/download/{version}/code-server{version}-linux-x64.tar.gz
  tar -xvzf code-server{version}-linux-x64.tar.gz
  cd code-server{version}-linux-x64
  ./code-server
  ```
- Open your browser and visit http://$public_ip:8080/ where `$public_ip` is
  your instance's public IP address.
- For long-term use, set up a systemd service to run code-server.
