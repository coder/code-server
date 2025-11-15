# EC2 Module for Code-Server Deployment
# Deploys code-server on EC2 instances with Auto Scaling, ALB, and OAuth2 Proxy

# Get latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Generate random password for code-server if not provided
resource "random_password" "code_server" {
  count   = var.code_server_password == "" ? 1 : 0
  length  = 32
  special = true
}

# Store password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "code_server_password" {
  name                    = "${var.name_prefix}-code-server-password"
  description             = "Code-Server password"
  recovery_window_in_days = 7

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "code_server_password" {
  secret_id     = aws_secretsmanager_secret.code_server_password.id
  secret_string = var.code_server_password != "" ? var.code_server_password : random_password.code_server[0].result
}

# User data script for EC2 instances
locals {
  user_data = templatefile("${path.module}/user-data.sh", {
    code_server_version = var.code_server_version
    region              = var.aws_region
    secret_name         = aws_secretsmanager_secret.code_server_password.name
    oauth2_client_id    = var.oauth2_client_id
    oauth2_client_secret = var.oauth2_client_secret
    oauth2_issuer_url   = var.oauth2_issuer_url
    oauth2_redirect_url = var.oauth2_redirect_url
    cookie_secret       = var.oauth2_cookie_secret
    allowed_emails      = join(",", var.oauth2_allowed_emails)
  })
}

# Launch Template
resource "aws_launch_template" "code_server" {
  name_prefix   = "${var.name_prefix}-code-server-"
  image_id      = var.ami_id != "" ? var.ami_id : data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = var.iam_instance_profile_name
  }

  vpc_security_group_ids = [var.security_group_id]

  user_data = base64encode(local.user_data)

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = var.ebs_volume_size
      volume_type           = var.ebs_volume_type
      encrypted             = true
      kms_key_id            = var.kms_key_arn
      delete_on_termination = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(
      var.tags,
      {
        Name = "${var.name_prefix}-code-server"
      }
    )
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(
      var.tags,
      {
        Name = "${var.name_prefix}-code-server-volume"
      }
    )
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = var.tags
}

# Auto Scaling Group
resource "aws_autoscaling_group" "code_server" {
  name                = "${var.name_prefix}-code-server-asg"
  vpc_zone_identifier = var.subnet_ids
  target_group_arns   = [aws_lb_target_group.code_server.arn, aws_lb_target_group.oauth2_proxy.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  min_size            = var.min_instances
  max_size            = var.max_instances
  desired_capacity    = var.desired_instances

  launch_template {
    id      = aws_launch_template.code_server.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.name_prefix}-code-server"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = var.tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [desired_capacity]
  }
}

# Application Load Balancer
resource "aws_lb" "code_server" {
  name               = "${var.name_prefix}-code-server-alb"
  internal           = var.internal_alb
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.alb_subnet_ids

  enable_deletion_protection = var.enable_deletion_protection
  enable_http2               = true
  enable_cross_zone_load_balancing = true

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-code-server-alb"
    }
  )
}

# Target Group for OAuth2 Proxy
resource "aws_lb_target_group" "oauth2_proxy" {
  name     = "${var.name_prefix}-oauth2-tg"
  port     = 4180
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/ping"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-oauth2-tg"
    }
  )
}

# Target Group for Code-Server
resource "aws_lb_target_group" "code_server" {
  name     = "${var.name_prefix}-code-server-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/healthz"
    matcher             = "200"
  }

  deregistration_delay = 30

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-code-server-tg"
    }
  )
}

# HTTPS Listener (primary)
resource "aws_lb_listener" "https" {
  count             = var.certificate_arn != "" ? 1 : 0
  load_balancer_arn = aws_lb.code_server.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.oauth2_proxy.arn
  }

  tags = var.tags
}

# HTTP Listener (redirect to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.code_server.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = var.certificate_arn != "" ? "redirect" : "forward"

    dynamic "redirect" {
      for_each = var.certificate_arn != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    target_group_arn = var.certificate_arn == "" ? aws_lb_target_group.oauth2_proxy.arn : null
  }

  tags = var.tags
}

# CloudWatch Log Group for Code-Server
resource "aws_cloudwatch_log_group" "code_server" {
  name              = "/aws/ec2/${var.name_prefix}-code-server"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  count                  = var.enable_autoscaling ? 1 : 0
  name                   = "${var.name_prefix}-code-server-scale-up"
  autoscaling_group_name = aws_autoscaling_group.code_server.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = 1
  cooldown               = 300
}

resource "aws_autoscaling_policy" "scale_down" {
  count                  = var.enable_autoscaling ? 1 : 0
  name                   = "${var.name_prefix}-code-server-scale-down"
  autoscaling_group_name = aws_autoscaling_group.code_server.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = -1
  cooldown               = 300
}

# CloudWatch Alarms for Auto Scaling
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count               = var.enable_autoscaling ? 1 : 0
  alarm_name          = "${var.name_prefix}-code-server-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.code_server.name
  }

  alarm_description = "This metric monitors ec2 cpu utilization"
  alarm_actions     = [aws_autoscaling_policy.scale_up[0].arn]

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  count               = var.enable_autoscaling ? 1 : 0
  alarm_name          = "${var.name_prefix}-code-server-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "20"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.code_server.name
  }

  alarm_description = "This metric monitors ec2 cpu utilization"
  alarm_actions     = [aws_autoscaling_policy.scale_down[0].arn]

  tags = var.tags
}
