import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const AWS_BUCKET = process.env.AWS_BUCKET || "introspect-diagnostic-images-dev";

// Initialize S3 client
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error("AWS credentials not configured");
    }

    s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3Client;
}

export async function uploadImageToS3(
  buffer: Buffer,
  originalName: string,
  userId: string
): Promise<string> {
  const client = getS3Client();
  const fileExtension = originalName.split('.').pop() || 'jpg';
  const fileName = `diagnostics/${userId}/${nanoid()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: AWS_BUCKET,
    Key: fileName,
    Body: buffer,
    ContentType: `image/${fileExtension}`,
    ServerSideEncryption: "AES256",
  });

  await client.send(command);

  // Return the S3 URL
  return `https://${AWS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${fileName}`;
}

export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const client = getS3Client();
  
  const command = new GetObjectCommand({
    Bucket: AWS_BUCKET,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn });
}

export function isS3Configured(): boolean {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}
