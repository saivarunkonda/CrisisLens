variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "s3_bucket" {
  type = string
}

variable "cluster_name" {
  type    = string
  default = "crisislens-eks"
}

variable "k8s_version" {
  type    = string
  default = "1.27"
}

variable "vpc_id" {
  type = string
}

variable "vpc_subnets" {
  type = list(string)
}

variable "node_instance_type" {
  type    = string
  default = "t3.medium"
}

variable "gpu_instance_type" {
  type    = string
  default = "p3.2xlarge"
}
