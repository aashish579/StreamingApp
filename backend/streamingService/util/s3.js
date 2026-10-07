const { S3Client } = require('@aws-sdk/client-s3');

const buildAwsCredentials = () => {
  const accessKeyId =
    process.env.AWS_ACCESS_KEY_ID || process.env.AWS_KEY_ID;

  const secretAccessKey =
    process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;

  const sessionToken =
    process.env.AWS_SESSION_TOKEN;

  if (accessKeyId && secretAccessKey) {
    return {
      accessKeyId,
      secretAccessKey,
      ...(sessionToken ? { sessionToken } : {}),
    };
  }

  return undefined;
};

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: buildAwsCredentials(),
});

const buildPublicUrl = (key) => {
  if (!key) return null;

  if (/^https?:\/\//i.test(key)) {
    return key;
  }

  const cdnBase = process.env.AWS_CDN_URL?.replace(/\/$/, '');
  if (cdnBase) {
    return `${cdnBase}/${key}`;
  }

  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;

  if (!bucket || !region) {
    return key;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

const buildStreamUrl = (key) => {
  if (!key) return null;
  return `/api/streaming/${key}`;
};

module.exports = {
  s3Client,
  buildPublicUrl,
  buildStreamUrl,
};
