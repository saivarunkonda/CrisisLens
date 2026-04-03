/**
 * AWS SDK Configuration for CrisisLens
 * Simplified setup for S3 operations only
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { fromEnv } from '@aws-sdk/credential-providers';

// AWS Configuration
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY 
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : fromEnv(), // Use IAM role if no keys provided
};

// S3 Client
export const s3Client = new S3Client(awsConfig);

// S3 Operations
export async function uploadToS3(
  bucket: string, 
  key: string, 
  body: Buffer | string | Uint8Array,
  contentType?: string
) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType || 'application/octet-stream',
  });

  try {
    const result = await s3Client.send(command);
    console.log(`✅ Uploaded to S3: s3://${bucket}/${key}`);
    return {
      success: true,
      etag: result.ETag,
      url: `s3://${bucket}/${key}`
    };
  } catch (error) {
    console.error('❌ S3 upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function getS3Object(bucket: string, key: string) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  try {
    const result = await s3Client.send(command);
    return {
      success: true,
      body: result.Body,
      contentType: result.ContentType,
      contentLength: result.ContentLength,
    };
  } catch (error) {
    console.error('❌ S3 get object failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Check AWS configuration
export function checkAwsConfig() {
  const required = [
    'AWS_REGION',
    'S3_BUCKET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('⚠️ Missing AWS environment variables:', missing);
    return false;
  }
  
  console.log('✅ AWS configuration complete');
  return true;
}
