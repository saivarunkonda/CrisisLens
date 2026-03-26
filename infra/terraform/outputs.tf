output "s3_bucket" {
  value = aws_s3_bucket.training_bucket.bucket
}

output "eks_cluster_name" {
  value = module.eks.cluster_id
}

output "kubeconfig" {
  value = module.eks.kubeconfig
  sensitive = true
}
