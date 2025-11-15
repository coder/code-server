#!/bin/bash
# User data script for Code-Server EC2 instances
# This script installs code-server, oauth2-proxy, and configures them

set -e

# Update system
yum update -y

# Install dependencies
yum install -y docker git wget curl jq

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -aG docker ec2-user

# Install CloudWatch Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
rm -f ./amazon-cloudwatch-agent.rpm

# Configure CloudWatch Agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/code-server.log",
            "log_group_name": "/aws/ec2/${var.name_prefix}-code-server",
            "log_stream_name": "{instance_id}/code-server"
          },
          {
            "file_path": "/var/log/oauth2-proxy.log",
            "log_group_name": "/aws/ec2/${var.name_prefix}-code-server",
            "log_stream_name": "{instance_id}/oauth2-proxy"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "CodeServer",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
          {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"},
          "cpu_time_guest"
        ],
        "metrics_collection_interval": 60,
        "totalcpu": false
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# Get code-server password from Secrets Manager
CODE_SERVER_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id ${secret_name} \
  --region ${region} \
  --query SecretString \
  --output text)

# Create docker-compose configuration
mkdir -p /opt/code-server
cat > /opt/code-server/docker-compose.yml <<EOF
version: "3.8"

services:
  code-server:
    image: codercom/code-server:${code_server_version}
    container_name: code-server
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - /home/ec2-user/workspace:/home/coder/workspace
      - /home/ec2-user/.config:/home/coder/.config
    environment:
      - PASSWORD=$CODE_SERVER_PASSWORD
      - SUDO_PASSWORD=$CODE_SERVER_PASSWORD
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  oauth2-proxy:
    image: quay.io/oauth2-proxy/oauth2-proxy:latest
    container_name: oauth2-proxy
    restart: unless-stopped
    ports:
      - "4180:4180"
    command:
      - --provider=oidc
      - --email-domain=*
      - --upstream=http://code-server:8080
      - --http-address=0.0.0.0:4180
      - --redirect-url=${oauth2_redirect_url}
      - --oidc-issuer-url=${oauth2_issuer_url}
      - --cookie-secret=${cookie_secret}
      - --cookie-secure=true
      - --cookie-httponly=true
      - --cookie-samesite=lax
      - --set-xauthrequest=true
      - --pass-access-token=true
      - --pass-authorization-header=true
      - --set-authorization-header=true
      - --skip-provider-button=false
%{ if allowed_emails != "" ~}
      - --authenticated-emails-file=/etc/oauth2-proxy/emails.txt
%{ endif ~}
    environment:
      - OAUTH2_PROXY_CLIENT_ID=${oauth2_client_id}
      - OAUTH2_PROXY_CLIENT_SECRET=${oauth2_client_secret}
%{ if allowed_emails != "" ~}
    volumes:
      - /opt/code-server/allowed-emails.txt:/etc/oauth2-proxy/emails.txt:ro
%{ endif ~}
    depends_on:
      - code-server
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
EOF

%{ if allowed_emails != "" ~}
# Create allowed emails file
cat > /opt/code-server/allowed-emails.txt <<EOF
$(echo "${allowed_emails}" | tr ',' '\n')
EOF
%{ endif ~}

# Create workspace directory
mkdir -p /home/ec2-user/workspace
mkdir -p /home/ec2-user/.config
chown -R 1000:1000 /home/ec2-user/workspace /home/ec2-user/.config

# Install docker-compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Start services
cd /opt/code-server
docker-compose up -d

# Create systemd service for docker-compose
cat > /etc/systemd/system/code-server.service <<EOF
[Unit]
Description=Code-Server Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/code-server
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
systemctl daemon-reload
systemctl enable code-server.service

# Create log files
touch /var/log/code-server.log
touch /var/log/oauth2-proxy.log
chmod 644 /var/log/code-server.log /var/log/oauth2-proxy.log

# Set up log forwarding from Docker containers
cat > /etc/cron.d/code-server-logs <<EOF
* * * * * root docker logs code-server --tail 100 >> /var/log/code-server.log 2>&1
* * * * * root docker logs oauth2-proxy --tail 100 >> /var/log/oauth2-proxy.log 2>&1
EOF

echo "Code-Server installation completed successfully!"
