import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { PhotoUploadRequest, PhotoUploadResponse } from '@proofed/shared';

const s3Client = new S3Client({});
const PHOTOS_BUCKET = process.env.PHOTOS_BUCKET!;
const DEFAULT_USER_ID = 'default-user';

export async function getUploadUrl(request: PhotoUploadRequest): Promise<PhotoUploadResponse> {
  const key = `${DEFAULT_USER_ID}/attempts/${request.attemptId}/${Date.now()}-${request.fileName}`;

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
