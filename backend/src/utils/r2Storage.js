const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const env = require("../config/env");

let client = null;

const hasR2Config = () =>
  Boolean(
    env.R2_BUCKET_NAME &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_ENDPOINT &&
      env.R2_PUBLIC_URL
  );

const getR2Client = () => {
  if (!hasR2Config()) {
    return null;
  }

  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return client;
};

const encodeObjectKey = (key) =>
  String(key)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const getPublicObjectUrl = (key) =>
  `${env.R2_PUBLIC_URL}/${encodeObjectKey(key)}`;

const uploadR2Object = async ({
  key,
  body,
  contentType,
  metadata = {},
  cacheControl = "public, max-age=31536000, immutable",
}) => {
  const r2Client = getR2Client();

  if (!r2Client) {
    return null;
  }

  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
      Metadata: Object.fromEntries(
        Object.entries(metadata)
          .filter(([, value]) => value !== undefined && value !== null && value !== "")
          .map(([metadataKey, value]) => [metadataKey, String(value)])
      ),
    })
  );

  return {
    bucket: env.R2_BUCKET_NAME,
    key,
    url: getPublicObjectUrl(key),
  };
};

module.exports = {
  getPublicObjectUrl,
  hasR2Config,
  uploadR2Object,
};
