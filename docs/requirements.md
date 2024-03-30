# Requirements

You'll need a machine on which you can run code-server. You can use a physical
machine you have, or you can use a VM on GCP/AWS.

At the minimum, we recommend:

- 1 GB of RAM
- 2 CPU cores

You can use any Linux distribution, but [our
docs](https://coder.com/docs/code-server/latest/guide) assume that you're using
Debian hosted by Google Cloud (see the following section for instructions on
setting this up).

Your environment must have WebSockets enabled, since code-server uses WebSockets
for communication between the browser and the server.

## Set up a VM on Google Cloud

The following steps walk you through setting up a VM running Debian using Google
Cloud (though you are welcome to use any machine or VM provider).

If you're [signing up with Google](https://console.cloud.google.com/getting-started) for the first time, you should get a 3-month trial with
\$300 of credits.

After you sign up and create a new Google Cloud Provider (GCP) project, create a
new Compute Engine VM instance:

1. Using the sidebar, navigate to **Compute Engine** > **VM Instances**.
2. Click **Create Instance**.
3. Provide a **name** for new instance.
4. Choose the **region** that's closest to you based on [GCP
   ping](https://gcping.com/).
5. Choose a **zone** (any option is fine).
6. We recommend choosing an **E2 series instance** from the [general-purpose
   family](https://cloud.google.com/compute/docs/machine-types#general_purpose).
7. Change the instance type to **custom** and set at least **2 cores** and **2
   GB of RAM**. You can add more resources if desired, though you can also edit
   your instance at a later point.
8. Though optional, we highly recommend switching the persistent disk to an SSD
   with at least 32 GB. To do so, click **change** under **Boot Disk**. Then,
   change the type to **SSD Persistent Disk**, and set the size to **32**. (You
   can also grow your disk at a later date).
9. Go to **Networking** > **Networking Interfaces** and edit the existing
   interface to use a static internal IP. Click **Done** to save.
10. If you don't have a [project-wide SSH
    key](https://cloud.google.com/compute/docs/instances/adding-removing-ssh-keys#project-wide),
    go to **Security** > **SSH Keys** to add your public key.
11. Click **Create** to proceed.

Notes:

- To lower costs, you can shut down your server when you're not using it.
- We recommend using the `gcloud cli` to avoid using the GCP Dashboard if possible.
- For serving code-server over HTTPS, we recommend using an external domain name along with a service such as Let's Encrypt
