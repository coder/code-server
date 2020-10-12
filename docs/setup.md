# How to Set Up code-server

This guide walks you through the process of setting up and using code-server, allowing you to run VS Code on any machine anywhere and access it using a web browser.

## Step 1: Set up the host machine

You can run code-server on a machine in your possession or using a virtual machine hosted by Google, Amazon, etc.

We recommend the following as a minimum:

- 1 GB of RAM
- 2 CPU cores

code-server works with most Linux distributions, but for this guide, we assume that you're using Debian on a virtual machine hosted by Google Cloud.

1. Sign up for a Google Cloud Platform account, and create a new project (you can name the project whatever you'd like, and there's no need to select an organization for the project).
2. In the left-hand navigation bar, go to Compute Engine > VM Instances
3. Click **Create** to create a new VM instance
4. Provide a **name** for your new VM.
5. Choose the **region** that's located closest to you, as well as a **zone** (Google should automatically make suggestioins on the options that are best for you)
6. Under **Machine Configuration**, we recommend an **E2** series instance from the **general-purpose** family
7. For **Machine Type**, select **Custom**. We recommend adding at least 2 vCPU and 2 GB of RAM (you can add more at a later time if necessary)
8. Optional: we highly recommend switching the persistent disk to a solid-state drive with at least 32 GB of space. To do so, go to **Boot disk** and click **Change**. Under **Boot disk type**, select **SSD persistent disk** and set **Size (GB)** to **32**
9. Click the **Management, security, disks, networking, sole tenancy** link to expand additional config options for your instance.
10. Edit the interface so that it uses a static external IP address. To do so, go to **Networking** > **Networking interfaces**. Under **External IP**, click **Create IP address**. In the pop-up window, provide a name and click **reserve**. Then, click **Done**
11. If you aren't already using a [project-wide SSH key](https://cloud.google.com/compute/docs/instances/adding-removing-ssh-keys#project-wide), switch to **Security** > **SSH Keys**. Provide your **SSH key** in the box provided
12. Click **Create** to proceed.

Once GCP creates your instance, it's ready to use.

## Step 2: Install code-server

To install code-server, run:

```bash
curl -fsSL https://code-server.dev/install.sh | sh
```

The install script will print out how to run and start using code-server.

## Step 3: Expose code-server

