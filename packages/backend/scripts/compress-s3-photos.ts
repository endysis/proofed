/**
 * One-time script to compress existing photos in S3
 *
 * Usage:
 *   npx ts-node packages/backend/scripts/compress-s3-photos.ts --dry-run  # Preview only
 *   npx ts-node packages/backend/scripts/compress-s3-photos.ts            # Actual compression
 *
 * Prerequisites:
 *   - AWS credentials configured
 *   - sharp package installed (npm install sharp)
 */

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');

// Configuration
const MAX_DIMENSION = 1440; // Max width or height in pixels
const QUALITY = 70; // JPEG quality (1-100)
const SKIP_THRESHOLD_BYTES = 500 * 1024; // Skip files under 500KB

const PHOTOS_BUCKET = process.env.PHOTOS_BUCKET || 'proofed-photos-135753342791-eu-west-2';

const s3Client = new S3Client({});

interface CompressionResult {
  key: string;
  originalSize: number;
  compressedSize: number;
  skipped: boolean;
  skipReason?: string;
  error?: string;
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function isImageKey(key: string): boolean {
  const ext = key.toLowerCase().split('.').pop();
  return ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(ext || '');
}

async function compressImage(buffer: Buffer): Promise<Buffer> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  let pipeline = image;

  // Resize if larger than MAX_DIMENSION
  if (
    (metadata.width && metadata.width > MAX_DIMENSION) ||
    (metadata.height && metadata.height > MAX_DIMENSION)
  ) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert to JPEG with specified quality
  return pipeline
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toBuffer();
}

async function processPhoto(key: string, dryRun: boolean): Promise<CompressionResult> {
  const result: CompressionResult = {
    key,
    originalSize: 0,
    compressedSize: 0,
    skipped: false,
  };

  try {
    // Download the image
    const getResponse = await s3Client.send(
      new GetObjectCommand({
        Bucket: PHOTOS_BUCKET,
        Key: key,
      })
    );

    result.originalSize = getResponse.ContentLength || 0;

    // Skip if already small enough
    if (result.originalSize < SKIP_THRESHOLD_BYTES) {
      result.skipped = true;
      result.skipReason = 'Already under threshold';
      result.compressedSize = result.originalSize;
      return result;
    }

    // Convert stream to buffer
    const body = getResponse.Body as Readable;
    const originalBuffer = await streamToBuffer(body);

    // Compress the image
    const compressedBuffer = await compressImage(originalBuffer);
    result.compressedSize = compressedBuffer.length;

    // Skip if compression didn't help much (less than 10% reduction)
    if (compressedBuffer.length > originalBuffer.length * 0.9) {
      result.skipped = true;
      result.skipReason = 'Compression not effective';
      result.compressedSize = result.originalSize;
      return result;
    }

    // Upload compressed version (unless dry run)
    if (!dryRun) {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: PHOTOS_BUCKET,
          Key: key,
          Body: compressedBuffer,
          ContentType: 'image/jpeg',
        })
      );
    }

    return result;
  } catch (error) {
    result.skipped = true;
    result.error = error instanceof Error ? error.message : String(error);
    return result;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('='.repeat(60));
  console.log('S3 Photo Compression Script');
  console.log('='.repeat(60));
  console.log(`Bucket: ${PHOTOS_BUCKET}`);
  console.log(`Max dimension: ${MAX_DIMENSION}px`);
  console.log(`JPEG quality: ${QUALITY}%`);
  console.log(`Skip threshold: ${formatBytes(SKIP_THRESHOLD_BYTES)}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log('='.repeat(60));

  // List all objects in the bucket
  let continuationToken: string | undefined;
  const allKeys: string[] = [];

  console.log('\nScanning bucket for images...');

  do {
    const listResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: PHOTOS_BUCKET,
        ContinuationToken: continuationToken,
      })
    );

    const objects = listResponse.Contents || [];
    for (const obj of objects) {
      if (obj.Key && isImageKey(obj.Key)) {
        allKeys.push(obj.Key);
      }
    }

    continuationToken = listResponse.NextContinuationToken;
  } while (continuationToken);

  console.log(`Found ${allKeys.length} images to process\n`);

  if (allKeys.length === 0) {
    console.log('No images found. Exiting.');
    return;
  }

  // Process each image
  const results: CompressionResult[] = [];
  let processed = 0;

  for (const key of allKeys) {
    processed++;
    const progress = `[${processed}/${allKeys.length}]`;

    const result = await processPhoto(key, dryRun);
    results.push(result);

    if (result.error) {
      console.log(`${progress} ERROR: ${key} - ${result.error}`);
    } else if (result.skipped) {
      console.log(
        `${progress} SKIP: ${key} (${formatBytes(result.originalSize)}) - ${result.skipReason}`
      );
    } else {
      const savings = result.originalSize - result.compressedSize;
      const percent = ((savings / result.originalSize) * 100).toFixed(1);
      console.log(
        `${progress} ${dryRun ? 'WOULD COMPRESS' : 'COMPRESSED'}: ${key} ` +
          `(${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)}, ` +
          `saved ${formatBytes(savings)} / ${percent}%)`
      );
    }
  }

  // Summary
  const compressed = results.filter((r) => !r.skipped && !r.error);
  const skipped = results.filter((r) => r.skipped && !r.error);
  const errors = results.filter((r) => r.error);

  const totalOriginal = compressed.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressed = compressed.reduce((sum, r) => sum + r.compressedSize, 0);
  const totalSavings = totalOriginal - totalCompressed;

  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total images found: ${results.length}`);
  console.log(`Compressed: ${compressed.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Errors: ${errors.length}`);

  if (compressed.length > 0) {
    console.log(`\nSpace ${dryRun ? 'that would be ' : ''}saved:`);
    console.log(`  Before: ${formatBytes(totalOriginal)}`);
    console.log(`  After:  ${formatBytes(totalCompressed)}`);
    console.log(`  Saved:  ${formatBytes(totalSavings)} (${((totalSavings / totalOriginal) * 100).toFixed(1)}%)`);
  }

  if (dryRun && compressed.length > 0) {
    console.log('\nThis was a dry run. Run without --dry-run to apply changes.');
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
