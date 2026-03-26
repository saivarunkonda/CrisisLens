provider "aws" {
  region = var.aws_region
}

resource "aws_s3_bucket" "training_bucket" {
  bucket = var.s3_bucket
  acl    = "private"

  versioning {
    enabled = true
  }

  tags = {
    Name = "crisislens-training-bucket"
  }
}

module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  cluster_name    = var.cluster_name
  cluster_version = var.k8s_version
  subnets         = var.vpc_subnets
  vpc_id          = var.vpc_id

  node_groups = {
    standard = {
      desired_capacity = 2
      max_capacity     = 3
      min_capacity     = 1
      instance_type    = var.node_instance_type
    }
    gpu = {
      desired_capacity = 0
      max_capacity     = 2
      min_capacity     = 0
      instance_type    = var.gpu_instance_type
    }
  }

  tags = {
    Project = "crisislens"
  }
}
