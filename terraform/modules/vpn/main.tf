# VPN Module for Code-Server
# Creates AWS Client VPN endpoint for secure access to private resources

# CloudWatch Log Group for VPN connection logs
resource "aws_cloudwatch_log_group" "vpn" {
  name              = "/aws/vpn/${var.name_prefix}"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

resource "aws_cloudwatch_log_stream" "vpn" {
  name           = "vpn-connection-logs"
  log_group_name = aws_cloudwatch_log_group.vpn.name
}

# Client VPN Endpoint
resource "aws_ec2_client_vpn_endpoint" "main" {
  description            = "Client VPN endpoint for ${var.name_prefix}"
  server_certificate_arn = var.server_certificate_arn
  client_cidr_block      = var.client_cidr_block
  split_tunnel           = var.split_tunnel
  vpc_id                 = var.vpc_id

  # Authentication using certificate-based or Active Directory
  authentication_options {
    type                       = var.authentication_type
    root_certificate_chain_arn = var.authentication_type == "certificate-authentication" ? var.client_certificate_arn : null

    # For Active Directory authentication
    active_directory_id = var.authentication_type == "directory-service-authentication" ? var.active_directory_id : null
  }

  # Additional authentication option for MFA (optional)
  dynamic "authentication_options" {
    for_each = var.enable_saml_authentication ? [1] : []
    content {
      type                           = "federated-authentication"
      saml_provider_arn              = var.saml_provider_arn
      self_service_saml_provider_arn = var.self_service_saml_provider_arn
    }
  }

  # Connection logging
  connection_log_options {
    enabled               = true
    cloudwatch_log_group  = aws_cloudwatch_log_group.vpn.name
    cloudwatch_log_stream = aws_cloudwatch_log_stream.vpn.name
  }

  # DNS servers to use
  dns_servers = var.dns_servers

  # Transport protocol
  transport_protocol = var.transport_protocol

  # VPN port
  vpn_port = var.vpn_port

  # Session timeout
  session_timeout_hours = var.session_timeout_hours

  # Client connect options (for custom authorization)
  dynamic "client_connect_options" {
    for_each = var.enable_client_connect_handler ? [1] : []
    content {
      enabled             = true
      lambda_function_arn = var.client_connect_lambda_arn
    }
  }

  # Client login banner
  dynamic "client_login_banner_options" {
    for_each = var.client_login_banner != "" ? [1] : []
    content {
      enabled     = true
      banner_text = var.client_login_banner
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-vpn-endpoint"
    }
  )
}

# Associate VPN endpoint with subnets
resource "aws_ec2_client_vpn_network_association" "main" {
  count                  = length(var.subnet_ids)
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.main.id
  subnet_id              = var.subnet_ids[count.index]

  lifecycle {
    # The issue why we are ignoring changes is that on the first resource creation, its terraform-aws-client-vpn-endpoint
    # This will change on AWS's next apply to the instance ID.
    ignore_changes = [subnet_id]
  }
}

# Authorization rule to allow access to VPC CIDR
resource "aws_ec2_client_vpn_authorization_rule" "vpc_access" {
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.main.id
  target_network_cidr    = var.vpc_cidr
  authorize_all_groups   = var.authorize_all_groups
  access_group_id        = var.authorize_all_groups ? null : var.access_group_id
  description            = "Allow access to VPC"
}

# Additional authorization rules for specific CIDRs
resource "aws_ec2_client_vpn_authorization_rule" "additional" {
  count                  = length(var.additional_authorization_rules)
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.main.id
  target_network_cidr    = var.additional_authorization_rules[count.index].cidr
  authorize_all_groups   = var.additional_authorization_rules[count.index].authorize_all_groups
  access_group_id        = var.additional_authorization_rules[count.index].access_group_id
  description            = var.additional_authorization_rules[count.index].description
}

# Route to direct traffic to the VPC
resource "aws_ec2_client_vpn_route" "vpc_route" {
  count                  = var.split_tunnel ? 1 : 0
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.main.id
  destination_cidr_block = var.vpc_cidr
  target_vpc_subnet_id   = aws_ec2_client_vpn_network_association.main[0].subnet_id
  description            = "Route to VPC"

  depends_on = [aws_ec2_client_vpn_network_association.main]
}

# Additional routes for specific networks
resource "aws_ec2_client_vpn_route" "additional" {
  count                  = length(var.additional_routes)
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.main.id
  destination_cidr_block = var.additional_routes[count.index].cidr
  target_vpc_subnet_id   = aws_ec2_client_vpn_network_association.main[0].subnet_id
  description            = var.additional_routes[count.index].description

  depends_on = [aws_ec2_client_vpn_network_association.main]
}

# Security group for VPN endpoint
resource "aws_security_group" "vpn" {
  name_prefix = "${var.name_prefix}-vpn-"
  description = "Security group for Client VPN endpoint"
  vpc_id      = var.vpc_id

  ingress {
    description = "VPN traffic"
    from_port   = var.vpn_port
    to_port     = var.vpn_port
    protocol    = var.transport_protocol == "tcp" ? "tcp" : "udp"
    cidr_blocks = var.vpn_ingress_cidr_blocks
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-vpn-sg"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Apply security group to VPN endpoint
resource "aws_ec2_client_vpn_endpoint_security_group_association" "main" {
  count                  = var.apply_security_group ? 1 : 0
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.main.id
  security_group_id      = aws_security_group.vpn.id
}
