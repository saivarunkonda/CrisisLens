#!/bin/bash

# CrisisLens AWS Setup Script
# This script sets up all necessary AWS resources for CrisisLens

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
S3_BUCKET=${S3_BUCKET:-"crisislens-training-data"}
GITHUB_REPO=${GITHUB_REPO:-"saivarunkonda/CrisisLens"}

echo -e "${GREEN}🚀 Setting up CrisisLens AWS Infrastructure${NC}"
echo "=========================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
echo -e "${YELLOW}🔍 Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure'${NC}"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS Account: ${AWS_ACCOUNT_ID}${NC}"

# Create S3 bucket
echo -e "${YELLOW}📦 Creating S3 bucket: ${S3_BUCKET}${NC}"
if aws s3api head-bucket --bucket "${S3_BUCKET}" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Bucket already exists${NC}"
else
    if [ "$AWS_REGION" = "us-east-1" ]; then
        aws s3api create-bucket --bucket "${S3_BUCKET}" --region "${AWS_REGION}"
    else
        aws s3api create-bucket --bucket "${S3_BUCKET}" --region "${AWS_REGION}" \
            --create-bucket-configuration LocationConstraint="${AWS_REGION}"
    fi
    echo -e "${GREEN}✅ Bucket created${NC}"
fi

# Enable versioning
echo -e "${YELLOW}📝 Enabling versioning...${NC}"
aws s3api put-bucket-versioning \
    --bucket "${S3_BUCKET}" \
    --versioning-configuration Status=Enabled

# Enable encryption
echo -e "${YELLOW}🔐 Enabling encryption...${NC}"
aws s3api put-bucket-encryption \
    --bucket "${S3_BUCKET}" \
    --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }'

# Block public access
echo -e "${YELLOW}🚫 Blocking public access...${NC}"
aws s3api put-public-access-block \
    --bucket "${S3_BUCKET}" \
    --block-public-acls \
    --block-public-policy \
    --ignore-public-acls \
    --restrict-public-buckets

# Create IAM role for GitHub Actions
echo -e "${YELLOW}👤 Creating IAM role for GitHub Actions...${NC}"
ROLE_NAME="crisislens-github-actions-role"

# Create trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${GITHUB_REPO}:*"
        }
      }
    }
  ]
}
EOF

# Create or update the role
if aws iam get-role --role-name "${ROLE_NAME}" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Role already exists, updating trust policy...${NC}"
    aws iam update-assume-role-policy \
        --role-name "${ROLE_NAME}" \
        --policy-document file://trust-policy.json
else
    aws iam create-role \
        --role-name "${ROLE_NAME}" \
        --assume-role-policy-document file://trust-policy.json \
        --description "CrisisLens GitHub Actions role"
    echo -e "${GREEN}✅ Role created${NC}"
fi

# Create S3 policy
cat > s3-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${S3_BUCKET}",
        "arn:aws:s3:::${S3_BUCKET}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Create policy
POLICY_NAME="crisislens-s3-policy"
if aws iam get-policy --policy-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${POLICY_NAME}" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Policy already exists, updating...${NC}"
    aws iam create-policy-version \
        --policy-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${POLICY_NAME}" \
        --policy-document file://s3-policy.json
else
    aws iam create-policy \
        --policy-name "${POLICY_NAME}" \
        --policy-document file://s3-policy.json \
        --description "CrisisLens S3 access policy"
    echo -e "${GREEN}✅ Policy created${NC}"
fi

# Attach policy to role
echo -e "${YELLOW}🔗 Attaching policy to role...${NC}"
aws iam attach-role-policy \
    --role-name "${ROLE_NAME}" \
    --policy-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${POLICY_NAME}"

# Wait for role to be ready
echo -e "${YELLOW}⏳ Waiting for role to be ready...${NC}"
sleep 10

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name "${ROLE_NAME}" --query Role.Arn --output text)

# Create initial manifest
echo -e "${YELLOW}📋 Creating initial manifest...${NC}"
cat > initial-manifest.json << EOF
{
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "initial",
  "environment": "production",
  "aws_account_id": "${AWS_ACCOUNT_ID}",
  "s3_bucket": "${S3_BUCKET}",
  "github_repository": "${GITHUB_REPO}"
}
EOF

aws s3 cp initial-manifest.json "s3://${S3_BUCKET}/manifests/initial.json"

# Cleanup
rm -f trust-policy.json s3-policy.json initial-manifest.json

echo -e "${GREEN}✨ AWS Setup Complete!${NC}"
echo "=========================================="
echo -e "${GREEN}📦 S3 Bucket:${NC} ${S3_BUCKET}"
echo -e "${GREEN}👤 IAM Role:${NC} ${ROLE_ARN}"
echo -e "${GREEN}🏢 AWS Account:${NC} ${AWS_ACCOUNT_ID}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Add this to your GitHub Secrets:"
echo "   AWS_ROLE_ARN: ${ROLE_ARN}"
echo "   AWS_REGION: ${AWS_REGION}"
echo "   S3_BUCKET: ${S3_BUCKET}"
echo ""
echo "2. Configure GitHub OIDC provider:"
echo "   Go to: https://github.com/${GITHUB_REPO}/settings/actions"
echo "   Add OIDC provider with: ${AWS_ACCOUNT_ID}"
echo ""
echo "3. Push your code to trigger the deployment pipeline!"
