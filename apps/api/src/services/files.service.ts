import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Supported file types
 */
export type FileType = 'image' | 'video' | 'audio';

/**
 * Multer file interface (simplified)
 */
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * Result of a file upload operation
 */
export interface FileUploadResult {
  filename: string;
  url: string;
  path: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly assetsPath: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Assets stored relative to project root
    this.assetsPath = join(process.cwd(), 'assets');
    this.baseUrl = this.configService.get<string>('API_BASE_URL', 'http://localhost:3001');

    // Ensure base directories exist
    this.ensureDirectoryExists(join(this.assetsPath, 'input'));
    this.ensureDirectoryExists(join(this.assetsPath, 'output'));
  }

  /**
   * Save a workflow input file (image, video, audio)
   * Files are stored in /assets/input/{workflowId}/
   */
  async saveWorkflowInput(
    workflowId: string,
    file: MulterFile,
    fileType: FileType
  ): Promise<FileUploadResult> {
    // Create workflow-specific directory
    const workflowDir = join(this.assetsPath, 'input', workflowId);
    this.ensureDirectoryExists(workflowDir);

    // Generate unique filename using hash of content + timestamp
    const hash = createHash('md5').update(file.buffer).digest('hex').substring(0, 8);
    const timestamp = Date.now();
    const ext = this.getExtension(file.originalname, file.mimetype);
    const filename = `${fileType}-${timestamp}-${hash}${ext}`;

    // Write file to disk
    const filePath = join(workflowDir, filename);
    writeFileSync(filePath, file.buffer);

    // Generate URL for accessing the file
    const url = `${this.baseUrl}/api/files/input/${workflowId}/${filename}`;

    this.logger.log(`Saved ${fileType} file: ${filename} for workflow ${workflowId}`);

    return {
      filename,
      url,
      path: filePath,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * Save execution output file
   * Files are stored in /assets/output/{executionId}/
   */
  async saveExecutionOutput(
    executionId: string,
    filename: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<FileUploadResult> {
    // Create execution-specific directory
    const executionDir = join(this.assetsPath, 'output', executionId);
    this.ensureDirectoryExists(executionDir);

    // Write file to disk
    const filePath = join(executionDir, filename);
    writeFileSync(filePath, buffer);

    // Generate URL for accessing the file
    const url = `${this.baseUrl}/api/files/output/${executionId}/${filename}`;

    this.logger.log(`Saved output file: ${filename} for execution ${executionId}`);

    return {
      filename,
      url,
      path: filePath,
      size: buffer.length,
      mimeType,
    };
  }

  /**
   * Get the file path for a workflow input file
   */
  getInputFilePath(workflowId: string, filename: string): string {
    return join(this.assetsPath, 'input', workflowId, filename);
  }

  /**
   * Get the file path for an execution output file
   */
  getOutputFilePath(executionId: string, filename: string): string {
    return join(this.assetsPath, 'output', executionId, filename);
  }

  /**
   * Check if a file exists
   */
  fileExists(filePath: string): boolean {
    return existsSync(filePath);
  }

  /**
   * Ensure a directory exists, creating it if necessary
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      this.logger.log(`Created directory: ${dirPath}`);
    }
  }

  /**
   * Get file extension from filename or mime type
   */
  private getExtension(filename: string, mimeType: string): string {
    // Try to get from filename
    const extFromName = filename.substring(filename.lastIndexOf('.'));
    if (extFromName && extFromName !== filename) {
      return extFromName;
    }

    // Fallback to mime type mapping
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg',
    };

    return mimeToExt[mimeType] ?? '';
  }
}
