import { Client } from 'minio';

export interface StorageConfig {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
  publicBaseUrl?: string; // e.g. http://localhost:9000/eduviet
}

export class StorageService {
  private client: Client;
  private bucket: string;
  private publicBaseUrl: string;

  constructor(private config: StorageConfig) {
    this.client = new Client({
      endPoint: config.endPoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
    this.bucket = config.bucket;
    this.publicBaseUrl =
      config.publicBaseUrl ??
      `${config.useSSL ? 'https' : 'http'}://${config.endPoint}:${config.port}/${config.bucket}`;
  }

  /**
   * Upload buffer lên MinIO.
   * @param buffer   - nội dung file
   * @param key      - đường dẫn trong bucket (vd: "chat/roomId/filename.png")
   * @param mimeType - MIME type của file
   * @returns URL công khai của file
   */
  async upload(buffer: Buffer, key: string, mimeType: string): Promise<string> {
    await this.client.putObject(this.bucket, key, buffer, buffer.length, {
      'Content-Type': mimeType,
    });
    return this.getPublicUrl(key);
  }

  /**
   * Tạo presigned URL có thời hạn (mặc định 1 giờ).
   */
  async getPresignedUrl(key: string, expirySeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, expirySeconds);
  }

  /**
   * Xóa object khỏi bucket.
   */
  async delete(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }

  /**
   * Trả về URL công khai không cần xác thực (dùng cho /public/ prefix).
   */
  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }

  /**
   * Đảm bảo bucket tồn tại, tạo nếu chưa có.
   */
  async ensureBucket(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
  }

  /**
   * Set S3 bucket policy: anonymous GET cho prefix (mặc định "public").
   * Gọi khi app khởi động để đảm bảo ảnh upload vào public/ accessible mà không cần auth.
   */
  async ensurePublicReadPolicy(prefix = 'public'): Promise<void> {
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/${prefix}/*`],
        },
      ],
    });
    await this.client.setBucketPolicy(this.bucket, policy);
  }
}
