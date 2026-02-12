import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as createPresignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client } from "./client";

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

function getBucket(): string {
  if (!BUCKET_NAME) {
    throw new Error("Missing R2 env: R2_BUCKET_NAME is required");
  }
  return BUCKET_NAME;
}

/**
 * Uploads an audio buffer to the R2 bucket.
 */
export async function uploadAudio(buffer: Buffer, key: string): Promise<void> {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: buffer,
    })
  );
}

/**
 * Returns a pre-signed GET URL for an object in the R2 bucket.
 * @param expiresIn Expiry in seconds; default 3600 (1 hour).
 */
export async function getSignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });
  return createPresignedUrl(client, command, { expiresIn });
}

/**
 * Deletes an object from the R2 bucket.
 */
export async function deleteAudio(key: string): Promise<void> {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    })
  );
}
