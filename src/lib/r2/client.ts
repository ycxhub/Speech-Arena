import { S3Client } from "@aws-sdk/client-s3";

let _client: S3Client | null = null;

/**
 * Returns an S3-compatible client for Cloudflare R2.
 * Endpoint: https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com
 * Requires env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 */
export function getR2Client(): S3Client {
  if (!_client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "Missing R2 env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required"
      );
    }
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return _client;
}
