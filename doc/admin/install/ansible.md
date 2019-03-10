# Deploy with Ansible

This tutorial will show you how to deploy code-server using Ansible.


## Prerequisite: Grabbing Ansible

First is to grab Ansible from your Package Manager. Fedora/RHEL/CentOS and Ubuntu/Debian has this.

## Picking the right Playbook

Playbooks are found in `playbooks/` in this repository. 

The Playbooks are named based on what code-server variant its gonna install.

Pick only the following if :

- `install-release.yml`: if you want a stable experience, this is the official distribution by the Coder team.

- `install-git.yml`: if you want to live on the edge or to help catch bugs in the master tree.

Keep in mind to use `install-release.yml` if you aim for stability for your organization's machines.

## Running the Playbook

Finally run the playbook you've chosen after installing Ansible.

`ansible-playbook install-<variant>.yml`

or

`./install-<variant>.yml`