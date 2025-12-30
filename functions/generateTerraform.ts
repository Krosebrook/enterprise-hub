import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      architecture_id,
      architecture_name,
      services,
      cloud_provider,
      region,
      environment,
      components
    } = await req.json();

    // Generate Terraform configurations based on cloud provider
    const files = {};

    // Main Terraform configuration
    files['main.tf'] = generateMainTF(cloud_provider, region, environment, architecture_name);

    // Variables
    files['variables.tf'] = generateVariablesTF(cloud_provider, services, components);

    // Outputs
    files['outputs.tf'] = generateOutputsTF(cloud_provider, components);

    // Provider-specific modules
    if (components.vpc || components.kubernetes || components.relational_db) {
      if (cloud_provider === 'aws') {
        files['aws-resources.tf'] = generateAWSResources(components, services, region, environment, architecture_name);
      } else if (cloud_provider === 'gcp') {
        files['gcp-resources.tf'] = generateGCPResources(components, services, region, environment, architecture_name);
      } else if (cloud_provider === 'azure') {
        files['azure-resources.tf'] = generateAzureResources(components, services, region, environment, architecture_name);
      }
    }

    // README with instructions
    files['README.md'] = generateREADME(cloud_provider, region, environment, architecture_name);

    return Response.json({
      files,
      provider: cloud_provider,
      region,
      environment
    });
  } catch (error) {
    console.error('Error generating Terraform:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateMainTF(provider, region, environment, architectureName) {
  const projectName = architectureName.toLowerCase().replace(/\s+/g, '-');
  
  if (provider === 'aws') {
    return `terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }

  backend "s3" {
    bucket = "${projectName}-terraform-state"
    key    = "${environment}/terraform.tfstate"
    region = "${region}"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "${architectureName}"
      ManagedBy   = "Terraform"
    }
  }
}

locals {
  project_name = "${projectName}"
  environment  = var.environment
  common_tags = {
    Project     = "${architectureName}"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}`;
  } else if (provider === 'gcp') {
    return `terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }

  backend "gcs" {
    bucket = "${projectName}-terraform-state"
    prefix = "${environment}"
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

locals {
  project_name = "${projectName}"
  environment  = var.environment
  common_labels = {
    project     = "${projectName}"
    environment = var.environment
    managed_by  = "terraform"
  }
}`;
  } else {
    return `terraform {
  required_version = ">= 1.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }

  backend "azurerm" {
    resource_group_name  = "${projectName}-terraform-rg"
    storage_account_name = "${projectName}tfstate"
    container_name       = "tfstate"
    key                  = "${environment}.terraform.tfstate"
  }
}

provider "azurerm" {
  features {}
}

locals {
  project_name = "${projectName}"
  environment  = var.environment
  common_tags = {
    Project     = "${architectureName}"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}`;
  }
}

function generateVariablesTF(provider, services, components) {
  let vars = '';

  if (provider === 'aws') {
    vars = `variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}`;

    if (components.kubernetes) {
      vars += `

variable "eks_cluster_version" {
  description = "Kubernetes version for EKS"
  type        = string
  default     = "1.28"
}

variable "eks_node_instance_types" {
  description = "EC2 instance types for EKS nodes"
  type        = list(string)
  default     = ["t3.medium", "t3.large"]
}

variable "eks_node_desired_size" {
  description = "Desired number of EKS worker nodes"
  type        = number
  default     = 3
}

variable "eks_node_min_size" {
  description = "Minimum number of EKS worker nodes"
  type        = number
  default     = 2
}

variable "eks_node_max_size" {
  description = "Maximum number of EKS worker nodes"
  type        = number
  default     = 10
}`;
    }

    if (components.relational_db) {
      vars += `

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 100
}

variable "rds_engine_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15.4"
}

variable "rds_backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}`;
    }
  } else if (provider === 'gcp') {
    vars = `variable "gcp_project_id" {
  description = "GCP project ID"
  type        = string
}

variable "gcp_region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_subnet_cidr" {
  description = "CIDR range for VPC subnet"
  type        = string
  default     = "10.0.0.0/24"
}`;

    if (components.kubernetes) {
      vars += `

variable "gke_cluster_version" {
  description = "GKE cluster version"
  type        = string
  default     = "1.28"
}

variable "gke_node_machine_type" {
  description = "Machine type for GKE nodes"
  type        = string
  default     = "e2-medium"
}

variable "gke_node_count" {
  description = "Number of nodes per zone"
  type        = number
  default     = 1
}

variable "gke_min_node_count" {
  description = "Minimum nodes per zone"
  type        = number
  default     = 1
}

variable "gke_max_node_count" {
  description = "Maximum nodes per zone"
  type        = number
  default     = 3
}`;
    }

    if (components.relational_db) {
      vars += `

variable "cloudsql_tier" {
  description = "Cloud SQL tier"
  type        = string
  default     = "db-n1-standard-2"
}

variable "cloudsql_disk_size" {
  description = "Disk size in GB"
  type        = number
  default     = 100
}

variable "cloudsql_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "POSTGRES_15"
}`;
    }
  } else {
    vars = `variable "azure_region" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vnet_address_space" {
  description = "Address space for VNet"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}`;

    if (components.kubernetes) {
      vars += `

variable "aks_kubernetes_version" {
  description = "Kubernetes version for AKS"
  type        = string
  default     = "1.28"
}

variable "aks_node_vm_size" {
  description = "VM size for AKS nodes"
  type        = string
  default     = "Standard_D2s_v3"
}

variable "aks_node_count" {
  description = "Number of AKS nodes"
  type        = number
  default     = 3
}

variable "aks_min_node_count" {
  description = "Minimum nodes for autoscaling"
  type        = number
  default     = 2
}

variable "aks_max_node_count" {
  description = "Maximum nodes for autoscaling"
  type        = number
  default     = 10
}`;
    }

    if (components.relational_db) {
      vars += `

variable "sql_sku_name" {
  description = "Azure SQL SKU"
  type        = string
  default     = "GP_Gen5_2"
}

variable "sql_storage_mb" {
  description = "Storage in MB"
  type        = number
  default     = 102400
}

variable "sql_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "11"
}`;
    }
  }

  return vars;
}

function generateOutputsTF(provider, components) {
  let outputs = '';

  if (provider === 'aws') {
    if (components.vpc) {
      outputs += `output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}
`;
    }

    if (components.kubernetes) {
      outputs += `
output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.main.endpoint
  sensitive   = true
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}
`;
    }

    if (components.relational_db) {
      outputs += `
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}
`;
    }
  } else if (provider === 'gcp') {
    if (components.vpc) {
      outputs += `output "vpc_name" {
  description = "VPC network name"
  value       = google_compute_network.main.name
}

output "subnet_name" {
  description = "Subnet name"
  value       = google_compute_subnetwork.main.name
}
`;
    }

    if (components.kubernetes) {
      outputs += `
output "gke_cluster_name" {
  description = "GKE cluster name"
  value       = google_container_cluster.primary.name
}

output "gke_cluster_endpoint" {
  description = "GKE cluster endpoint"
  value       = google_container_cluster.primary.endpoint
  sensitive   = true
}
`;
    }

    if (components.relational_db) {
      outputs += `
output "cloudsql_connection_name" {
  description = "Cloud SQL connection name"
  value       = google_sql_database_instance.main.connection_name
}

output "cloudsql_ip_address" {
  description = "Cloud SQL IP address"
  value       = google_sql_database_instance.main.ip_address[0].ip_address
  sensitive   = true
}
`;
    }
  } else {
    if (components.vpc) {
      outputs += `output "vnet_id" {
  description = "Virtual Network ID"
  value       = azurerm_virtual_network.main.id
}

output "subnet_id" {
  description = "Subnet ID"
  value       = azurerm_subnet.main.id
}
`;
    }

    if (components.kubernetes) {
      outputs += `
output "aks_cluster_name" {
  description = "AKS cluster name"
  value       = azurerm_kubernetes_cluster.main.name
}

output "aks_cluster_endpoint" {
  description = "AKS cluster endpoint"
  value       = azurerm_kubernetes_cluster.main.kube_config[0].host
  sensitive   = true
}
`;
    }

    if (components.relational_db) {
      outputs += `
output "postgresql_fqdn" {
  description = "PostgreSQL FQDN"
  value       = azurerm_postgresql_flexible_server.main.fqdn
  sensitive   = true
}

output "postgresql_database_name" {
  description = "PostgreSQL database name"
  value       = azurerm_postgresql_flexible_server_database.main.name
}
`;
    }
  }

  return outputs;
}

function generateAWSResources(components, services, region, environment, architectureName) {
  const projectName = architectureName.toLowerCase().replace(/\s+/g, '-');
  let config = '';

  if (components.vpc) {
    config += `# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "\${local.project_name}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "\${local.project_name}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name                                           = "\${local.project_name}-public-\${count.index + 1}"
    "kubernetes.io/role/elb"                      = "1"
    "kubernetes.io/cluster/\${local.project_name}" = "shared"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name                                           = "\${local.project_name}-private-\${count.index + 1}"
    "kubernetes.io/role/internal-elb"             = "1"
    "kubernetes.io/cluster/\${local.project_name}" = "shared"
  })
}

data "aws_availability_zones" "available" {
  state = "available"
}

`;

    if (components.nat_gateway) {
      config += `# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "\${local.project_name}-nat-eip-\${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "\${local.project_name}-nat-\${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

`;
    }

    config += `# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "\${local.project_name}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  ${components.nat_gateway ? `route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }` : ''}

  tags = merge(local.common_tags, {
    Name = "\${local.project_name}-private-rt-\${count.index + 1}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

`;
  }

  if (components.kubernetes) {
    config += `# EKS Cluster IAM Role
resource "aws_iam_role" "eks_cluster" {
  name = "\${local.project_name}-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = local.project_name
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.eks_cluster_version

  vpc_config {
    subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
  ]
}

`;

    if (components.node_pools) {
      config += `# EKS Node Group IAM Role
resource "aws_iam_role" "eks_node_group" {
  name = "\${local.project_name}-eks-node-group-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_group.name
}

# EKS Node Group
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "\${local.project_name}-node-group"
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = var.eks_node_instance_types

  scaling_config {
    desired_size = var.eks_node_desired_size
    max_size     = var.eks_node_max_size
    min_size     = var.eks_node_min_size
  }

  update_config {
    max_unavailable = 1
  }

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]
}

`;
    }
  }

  if (components.relational_db) {
    config += `# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "\${local.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "\${local.project_name}-db-subnet-group"
  })
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name        = "\${local.project_name}-rds-sg"
  description = "Security group for RDS instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "\${local.project_name}-rds-sg"
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "\${local.project_name}-db"
  engine         = "postgres"
  engine_version = var.rds_engine_version
  instance_class = var.rds_instance_class

  allocated_storage     = var.rds_allocated_storage
  max_allocated_storage = var.rds_allocated_storage * 2
  storage_encrypted     = true

  db_name  = replace(local.project_name, "-", "_")
  username = "admin"
  password = random_password.rds_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = var.rds_backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  
  multi_az               = var.environment == "production" ? true : false
  deletion_protection    = var.environment == "production" ? true : false
  skip_final_snapshot    = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "\${local.project_name}-final-snapshot" : null

  tags = merge(local.common_tags, {
    Name = "\${local.project_name}-db"
  })
}

resource "random_password" "rds_password" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "rds_password" {
  name = "\${local.project_name}/rds/password"
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "rds_password" {
  secret_id     = aws_secretsmanager_secret.rds_password.id
  secret_string = random_password.rds_password.result
}

`;
  }

  if (components.security_groups) {
    config += `# Application Security Group
resource "aws_security_group" "app" {
  name        = "\${local.project_name}-app-sg"
  description = "Security group for application services"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "\${local.project_name}-app-sg"
  })
}

`;
  }

  return config;
}

function generateGCPResources(components, services, region, environment, architectureName) {
  const projectName = architectureName.toLowerCase().replace(/\s+/g, '-');
  let config = '';

  if (components.vpc) {
    config += `# VPC Network
resource "google_compute_network" "main" {
  name                    = "\${local.project_name}-network"
  auto_create_subnetworks = false
}

# Subnet
resource "google_compute_subnetwork" "main" {
  name          = "\${local.project_name}-subnet"
  ip_cidr_range = var.vpc_subnet_cidr
  region        = var.gcp_region
  network       = google_compute_network.main.id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.1.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.2.0.0/16"
  }
}

# Cloud Router for NAT
resource "google_compute_router" "main" {
  name    = "\${local.project_name}-router"
  region  = var.gcp_region
  network = google_compute_network.main.id
}

`;

    if (components.nat_gateway) {
      config += `# Cloud NAT
resource "google_compute_router_nat" "main" {
  name   = "\${local.project_name}-nat"
  router = google_compute_router.main.name
  region = var.gcp_region

  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

`;
    }
  }

  if (components.kubernetes) {
    config += `# GKE Cluster
resource "google_container_cluster" "primary" {
  name     = local.project_name
  location = var.gcp_region

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.main.name
  subnetwork = google_compute_subnetwork.main.name

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  master_auth {
    client_certificate_config {
      issue_client_certificate = false
    }
  }

  addons_config {
    http_load_balancing {
      disabled = false
    }
    horizontal_pod_autoscaling {
      disabled = false
    }
  }

  workload_identity_config {
    workload_pool = "\${var.gcp_project_id}.svc.id.goog"
  }

  ${components.logging ? `logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }` : ''}

  ${components.metrics ? `monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS"]
  }` : ''}
}

`;

    if (components.node_pools) {
      config += `# GKE Node Pool
resource "google_container_node_pool" "primary" {
  name       = "\${local.project_name}-node-pool"
  location   = var.gcp_region
  cluster    = google_container_cluster.primary.name
  node_count = var.gke_node_count

  autoscaling {
    min_node_count = var.gke_min_node_count
    max_node_count = var.gke_max_node_count
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  node_config {
    machine_type = var.gke_node_machine_type
    disk_size_gb = 100
    disk_type    = "pd-standard"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = local.common_labels

    workload_metadata_config {
      mode = "GKE_METADATA"
    }
  }
}

`;
    }
  }

  if (components.relational_db) {
    config += `# Cloud SQL Instance
resource "google_sql_database_instance" "main" {
  name             = "\${local.project_name}-db"
  database_version = var.cloudsql_version
  region           = var.gcp_region

  settings {
    tier              = var.cloudsql_tier
    availability_type = var.environment == "production" ? "REGIONAL" : "ZONAL"
    disk_size         = var.cloudsql_disk_size
    disk_type         = "PD_SSD"

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 7
      }
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.main.id
    }

    database_flags {
      name  = "max_connections"
      value = "200"
    }
  }

  deletion_protection = var.environment == "production"
}

# Database
resource "google_sql_database" "main" {
  name     = replace(local.project_name, "-", "_")
  instance = google_sql_database_instance.main.name
}

# Database User
resource "google_sql_user" "main" {
  name     = "admin"
  instance = google_sql_database_instance.main.name
  password = random_password.cloudsql_password.result
}

resource "random_password" "cloudsql_password" {
  length  = 32
  special = true
}

resource "google_secret_manager_secret" "cloudsql_password" {
  secret_id = "\${local.project_name}-db-password"

  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "cloudsql_password" {
  secret      = google_secret_manager_secret.cloudsql_password.id
  secret_data = random_password.cloudsql_password.result
}

`;
  }

  if (components.security_groups) {
    config += `# Firewall Rules
resource "google_compute_firewall" "allow_internal" {
  name    = "\${local.project_name}-allow-internal"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = [var.vpc_subnet_cidr, "10.1.0.0/16", "10.2.0.0/16"]
}

resource "google_compute_firewall" "allow_health_check" {
  name    = "\${local.project_name}-allow-health-check"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
  }

  source_ranges = ["35.191.0.0/16", "130.211.0.0/22"]
}

`;
  }

  return config;
}

function generateAzureResources(components, services, region, environment, architectureName) {
  const projectName = architectureName.toLowerCase().replace(/\s+/g, '-');
  let config = '';

  config += `# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "\${local.project_name}-rg"
  location = var.azure_region

  tags = local.common_tags
}

`;

  if (components.vpc) {
    config += `# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "\${local.project_name}-vnet"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  address_space       = var.vnet_address_space

  tags = local.common_tags
}

# Subnet
resource "azurerm_subnet" "main" {
  name                 = "\${local.project_name}-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [cidrsubnet(var.vnet_address_space[0], 8, 0)]
}

# AKS Subnet
resource "azurerm_subnet" "aks" {
  name                 = "\${local.project_name}-aks-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [cidrsubnet(var.vnet_address_space[0], 8, 1)]
}

`;

    if (components.security_groups) {
      config += `# Network Security Group
resource "azurerm_network_security_group" "main" {
  name                = "\${local.project_name}-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowHTTP"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = local.common_tags
}

resource "azurerm_subnet_network_security_group_association" "main" {
  subnet_id                 = azurerm_subnet.main.id
  network_security_group_id = azurerm_network_security_group.main.id
}

`;
    }
  }

  if (components.kubernetes) {
    config += `# AKS Cluster
resource "azurerm_kubernetes_cluster" "main" {
  name                = local.project_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = local.project_name
  kubernetes_version  = var.aks_kubernetes_version

  default_node_pool {
    name                = "default"
    node_count          = var.aks_node_count
    vm_size             = var.aks_node_vm_size
    vnet_subnet_id      = azurerm_subnet.aks.id
    enable_auto_scaling = true
    min_count           = var.aks_min_node_count
    max_count           = var.aks_max_node_count
    os_disk_size_gb     = 100
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin    = "azure"
    load_balancer_sku = "standard"
    network_policy    = "azure"
  }

  ${components.logging ? `oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }` : ''}

  tags = local.common_tags
}

`;

    if (components.logging) {
      config += `# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "\${local.project_name}-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = local.common_tags
}

`;
    }
  }

  if (components.relational_db) {
    config += `# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "\${local.project_name}-psql"
  location               = azurerm_resource_group.main.location
  resource_group_name    = azurerm_resource_group.main.name
  version                = var.sql_version
  administrator_login    = "psqladmin"
  administrator_password = random_password.postgresql_password.result
  
  storage_mb             = var.sql_storage_mb
  sku_name               = var.sql_sku_name
  zone                   = "1"

  backup_retention_days        = 7
  geo_redundant_backup_enabled = var.environment == "production"

  tags = local.common_tags
}

# Database
resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = replace(local.project_name, "-", "_")
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

resource "random_password" "postgresql_password" {
  length  = 32
  special = true
}

resource "azurerm_key_vault" "main" {
  name                = "\${local.project_name}-kv"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  tags = local.common_tags
}

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault_secret" "postgresql_password" {
  name         = "postgresql-password"
  value        = random_password.postgresql_password.result
  key_vault_id = azurerm_key_vault.main.id
}

`;
  }

  return config;
}

function generateREADME(provider, region, environment, architectureName) {
  const projectName = architectureName.toLowerCase().replace(/\s+/g, '-');
  
  return `# ${architectureName} - Infrastructure as Code

This repository contains Terraform configurations for deploying ${architectureName} on ${provider.toUpperCase()}.

## 📋 Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- ${provider === 'aws' ? 'AWS CLI configured with appropriate credentials' : ''}${provider === 'gcp' ? 'GCP CLI (gcloud) configured with appropriate credentials' : ''}${provider === 'azure' ? 'Azure CLI configured with appropriate credentials' : ''}
- kubectl (for Kubernetes management)

## 🚀 Quick Start

### 1. Initialize Terraform

\`\`\`bash
terraform init
\`\`\`

### 2. Review Configuration

\`\`\`bash
terraform plan
\`\`\`

### 3. Deploy Infrastructure

\`\`\`bash
terraform apply
\`\`\`

## 📁 Project Structure

- \`main.tf\` - Main Terraform configuration and provider setup
- \`variables.tf\` - Input variables
- \`outputs.tf\` - Output values
- \`${provider}-resources.tf\` - ${provider.toUpperCase()}-specific resource definitions

## ⚙️ Configuration

### Required Variables

${provider === 'aws' ? `- \`aws_region\` - AWS region (default: ${region})` : ''}${provider === 'gcp' ? `- \`gcp_project_id\` - GCP project ID (required)
- \`gcp_region\` - GCP region (default: ${region})` : ''}${provider === 'azure' ? `- \`azure_region\` - Azure region (default: ${region})` : ''}
- \`environment\` - Environment name (default: ${environment})

### Optional Variables

Customize the deployment by modifying variables in \`terraform.tfvars\`:

\`\`\`hcl
environment = "${environment}"
${provider}_region = "${region}"

# Kubernetes Configuration
${provider === 'aws' ? 'eks_node_instance_types = ["t3.medium"]' : ''}${provider === 'gcp' ? 'gke_node_machine_type = "e2-medium"' : ''}${provider === 'azure' ? 'aks_node_vm_size = "Standard_D2s_v3"' : ''}
${provider === 'aws' ? 'eks_node_desired_size = 3' : ''}${provider === 'gcp' ? 'gke_node_count = 1' : ''}${provider === 'azure' ? 'aks_node_count = 3' : ''}

# Database Configuration
${provider === 'aws' ? 'rds_instance_class = "db.t3.medium"' : ''}${provider === 'gcp' ? 'cloudsql_tier = "db-n1-standard-2"' : ''}${provider === 'azure' ? 'sql_sku_name = "GP_Gen5_2"' : ''}
\`\`\`

## 🔐 Security Best Practices

1. **State Management**: Store Terraform state in a remote backend (S3, GCS, or Azure Storage)
2. **Secrets**: Use ${provider === 'aws' ? 'AWS Secrets Manager' : ''}${provider === 'gcp' ? 'Google Secret Manager' : ''}${provider === 'azure' ? 'Azure Key Vault' : ''} for sensitive data
3. **IAM**: Follow principle of least privilege for service accounts
4. **Encryption**: Enable encryption at rest for all data stores
5. **Network**: Use private subnets and security groups to restrict access

## 📊 Resource Overview

### Networking
- VPC/Virtual Network
- Public and private subnets
- NAT Gateway for outbound traffic
- Security groups and firewall rules

### Compute
- Kubernetes cluster (${provider === 'aws' ? 'EKS' : ''}${provider === 'gcp' ? 'GKE' : ''}${provider === 'azure' ? 'AKS' : ''})
- Auto-scaling node groups
- Load balancers

### Database
- Managed ${provider === 'aws' ? 'RDS PostgreSQL' : ''}${provider === 'gcp' ? 'Cloud SQL PostgreSQL' : ''}${provider === 'azure' ? 'Azure Database for PostgreSQL' : ''}
- Automated backups
- High availability (in production)

### Monitoring
- Centralized logging
- Metrics collection
- Alerting configuration

## 🔄 Updates and Maintenance

### Apply Changes

\`\`\`bash
terraform plan
terraform apply
\`\`\`

### Destroy Infrastructure

⚠️ **Warning**: This will delete all resources!

\`\`\`bash
terraform destroy
\`\`\`

## 📝 Outputs

After deployment, Terraform will output important information:

- Kubernetes cluster endpoint
- Database connection details
- Load balancer addresses

Access outputs:

\`\`\`bash
terraform output
\`\`\`

## 🐛 Troubleshooting

### Common Issues

**State Lock**: If state is locked, identify and remove the lock
\`\`\`bash
${provider === 'aws' ? 'aws dynamodb describe-table --table-name terraform-state-lock' : ''}${provider === 'gcp' ? 'gsutil ls gs://your-state-bucket/' : ''}${provider === 'azure' ? 'az storage blob list --account-name <account> --container-name tfstate' : ''}
\`\`\`

**Quota Exceeded**: Check ${provider.toUpperCase()} quotas and request increases if needed

## 📚 Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [${provider.toUpperCase()} Provider Documentation](https://registry.terraform.io/providers/hashicorp/${provider}/latest/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test with \`terraform plan\`
4. Submit a pull request

## 📄 License

Copyright © ${new Date().getFullYear()} ${architectureName}
`;
}