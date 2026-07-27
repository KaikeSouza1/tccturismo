import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";
import { env } from "./env";
import { ApiError } from "../utils/ApiError";

let client: S3Client | null = null;

function isConfigured(): boolean {
  return Boolean(env.r2.accountId && env.r2.accessKeyId && env.r2.secretAccessKey);
}

function getClient(): S3Client {
  if (!isConfigured()) {
    throw ApiError.badRequest(
      "Armazenamento de imagens (Cloudflare R2) nao configurado no servidor"
    );
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.r2.accessKeyId,
        secretAccessKey: env.r2.secretAccessKey,
      },
    });
  }
  return client;
}

export async function uploadObject(key: string, body: Buffer, contentType: string): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: env.r2.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function getObjectStream(
  key: string
): Promise<{ body: Readable; contentType: string | undefined }> {
  const result = await getClient().send(
    new GetObjectCommand({ Bucket: env.r2.bucket, Key: key })
  );
  return { body: result.Body as Readable, contentType: result.ContentType };
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: key }));
}
