import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as createPresignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client } from "./client";

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

function getBucket(): string {
  if (!BUCKET_NAME) {
    throw new Error("Missing R2 env: R2_BUCKET_NAME is required");
  }
  return BUCKET_NAME;
}

/**
 * Returns the public URL for an object when R2_PUBLIC_URL is configured.
 * Use for objects with public-read access. For private objects, use getSignedUrl instead.
 */
export function getPublicUrl(key: string): string {
  const base = R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error(
      "R2_PUBLIC_URL is required for getPublicUrl. Configure it in .env.local (e.g. https://cdn.speecharena.org)."
    );
  }
  return `${base}/${key.replace(/^\//, "")}`;
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
 * Returns true if the object exists in R2, false otherwise.
 */
export async function objectExists(key: string): Promise<boolean> {
  const client = getR2Client();
  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: getBucket(),
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
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
