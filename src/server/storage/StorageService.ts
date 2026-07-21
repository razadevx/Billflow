export interface StorageProvider {
  uploadFile(bucket: string, path: string, file: Buffer, contentType?: string): Promise<string>;
  deleteFile(bucket: string, path: string): Promise<void>;
  getFileUrl(bucket: string, path: string): Promise<string>;
}

export class LocalStorageProvider implements StorageProvider {
  async uploadFile(bucket: string, path: string, file: Buffer, contentType?: string): Promise<string> {
    // In production, this would use Supabase Storage or AWS S3
    // For local dev, we could save to the /public directory or just mock it
    return `/uploads/${bucket}/${path}`;
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    // Mock delete
  }

  async getFileUrl(bucket: string, path: string): Promise<string> {
    return `/uploads/${bucket}/${path}`;
  }
}

export const storage = new LocalStorageProvider();
