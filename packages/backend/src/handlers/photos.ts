import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { PhotoUploadRequest, PhotoUploadResponse, PhotoDownloadRequest, PhotoDownloadResponse } from '@proofed/shared';

const s3Client = new S3Client({});
const PHOTOS_BUCKET = process.env.PHOTOS_BUCKET!;

export async function getUploadUrl(userId: string, request: PhotoUploadRequest): Promise<PhotoUploadResponse> {
  const key = `${userId}/attempts/${request.attemptId}/${Date.now()}-${request.fileName}`;

  const command = new PutObjectCommand({
    Bucket: PHOTOS_BUCKET,
    Key: key,
    ContentType: request.contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return {
    uploadUrl,
    key,
  };
}

export async function getDownloadUrl(request: PhotoDownloadRequest): Promise<PhotoDownloadResponse> {
  const command = new GetObjectCommand({
    Bucket: PHOTOS_BUCKET,
    Key: request.key,
  });

  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return {
    downloadUrl,
  };
}
