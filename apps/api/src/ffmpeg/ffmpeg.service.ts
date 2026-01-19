import { exec } from 'node:child_process';
import { mkdir, readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ExecutionsService } from '../executions/executions.service';

const execAsync = promisify(exec);

export interface FrameExtractInput {
  video: string;
  selectionMode: 'first' | 'last' | 'timestamp' | 'percentage';
  timestampSeconds?: number;
  percentagePosition?: number;
  videoDuration?: number;
}

export interface FrameExtractResult {
  imageUrl: string;
}

export interface ReplaceAudioInput {
  video: string;
  audio: string;
  preserveOriginalAudio?: boolean;
  audioMixLevel?: number;
}

export interface ReplaceAudioResult {
  videoUrl: string;
}

@Injectable()
export class FFmpegService {
  private readonly logger = new Logger(FFmpegService.name);

  constructor(
    @Inject(forwardRef(() => ExecutionsService))
    private readonly executionsService: ExecutionsService
  ) {}

  /**
   * Extract a frame from a video using FFmpeg
   */
  async extractFrame(
    executionId: string,
    nodeId: string,
    input: FrameExtractInput
  ): Promise<FrameExtractResult> {
    this.logger.log(`Extracting ${input.selectionMode} frame for node ${nodeId}`);

    const tempDir = join(tmpdir(), 'genfeed-ffmpeg');
    const outputPath = join(tempDir, `frame-${nodeId}-${Date.now()}.jpg`);

    try {
      // Ensure temp directory exists
      await mkdir(tempDir, { recursive: true });

      // Build FFmpeg command based on selection mode
      let ffmpegCmd: string;

      switch (input.selectionMode) {
        case 'first':
          // Extract first frame
          ffmpegCmd = `ffmpeg -y -i "${input.video}" -vframes 1 -q:v 2 "${outputPath}"`;
          break;

        case 'timestamp':
          // Extract frame at specific timestamp
          if (input.timestampSeconds !== undefined) {
            ffmpegCmd = `ffmpeg -y -ss ${input.timestampSeconds} -i "${input.video}" -vframes 1 -q:v 2 "${outputPath}"`;
          } else {
            // Fallback to last frame if no timestamp provided
            ffmpegCmd = `ffmpeg -y -sseof -1 -i "${input.video}" -vframes 1 -q:v 2 "${outputPath}"`;
          }
          break;

        case 'percentage':
          // Extract frame at percentage position
          if (input.percentagePosition !== undefined && input.videoDuration !== undefined) {
            const seekTime = (input.percentagePosition / 100) * input.videoDuration;
            ffmpegCmd = `ffmpeg -y -ss ${seekTime} -i "${input.video}" -vframes 1 -q:v 2 "${outputPath}"`;
          } else {
            // Fallback to last frame if percentage can't be calculated
            ffmpegCmd = `ffmpeg -y -sseof -1 -i "${input.video}" -vframes 1 -q:v 2 "${outputPath}"`;
          }
          break;
        default:
          // Extract last frame - seek to near end and get first frame from there
          ffmpegCmd = `ffmpeg -y -sseof -1 -i "${input.video}" -vframes 1 -q:v 2 "${outputPath}"`;
          break;
      }

      this.logger.debug(`Running FFmpeg: ${ffmpegCmd}`);

      // Execute FFmpeg
      const { stderr } = await execAsync(ffmpegCmd, {
        timeout: 60000, // 60 second timeout
      });

      if (stderr?.includes('Error')) {
        this.logger.warn(`FFmpeg stderr: ${stderr}`);
      }

      // Read the output file and convert to base64 data URL
      const imageBuffer = await readFile(outputPath);
      const imageBase64 = imageBuffer.toString('base64');
      const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;

      // Update execution with result
      await this.executionsService.updateNodeResult(executionId, nodeId, 'complete', {
        image: imageDataUrl,
      });

      this.logger.log(`Frame extracted successfully for node ${nodeId}`);

      // Clean up temp file
      await unlink(outputPath).catch(() => {});

      return {
        imageUrl: imageDataUrl,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to extract frame for node ${nodeId}: ${errorMessage}`);

      // Clean up temp file on error
      await unlink(outputPath).catch(() => {});

      await this.executionsService.updateNodeResult(
        executionId,
        nodeId,
        'error',
        undefined,
        errorMessage
      );

      throw error;
    }
  }

  /**
   * Replace or mix audio in a video using FFmpeg
   */
  async replaceAudio(
    executionId: string,
    nodeId: string,
    input: ReplaceAudioInput
  ): Promise<ReplaceAudioResult> {
    this.logger.log(
      `${input.preserveOriginalAudio ? 'Mixing' : 'Replacing'} audio for node ${nodeId}`
    );

    const tempDir = join(tmpdir(), 'genfeed-ffmpeg');
    const outputPath = join(tempDir, `video-${nodeId}-${Date.now()}.mp4`);

    try {
      // Ensure temp directory exists
      await mkdir(tempDir, { recursive: true });

      let ffmpegCmd: string;

      if (input.preserveOriginalAudio && input.audioMixLevel !== undefined) {
        // Mix original and new audio
        // audioMixLevel: 0 = all original, 1 = all new
        const originalVolume = 1 - input.audioMixLevel;
        const newVolume = input.audioMixLevel;

        ffmpegCmd = `ffmpeg -y -i "${input.video}" -i "${input.audio}" -filter_complex "[0:a]volume=${originalVolume}[a1];[1:a]volume=${newVolume}[a2];[a1][a2]amix=inputs=2:duration=first[aout]" -map 0:v -map "[aout]" -c:v copy -c:a aac "${outputPath}"`;
      } else {
        // Replace audio completely
        ffmpegCmd = `ffmpeg -y -i "${input.video}" -i "${input.audio}" -map 0:v -map 1:a -c:v copy -c:a aac -shortest "${outputPath}"`;
      }

      this.logger.debug(`Running FFmpeg: ${ffmpegCmd}`);

      // Execute FFmpeg
      const { stderr } = await execAsync(ffmpegCmd, {
        timeout: 300000, // 5 minute timeout for video processing
      });

      if (stderr?.includes('Error')) {
        this.logger.warn(`FFmpeg stderr: ${stderr}`);
      }

      // Read the output file and convert to base64 data URL
      const videoBuffer = await readFile(outputPath);
      const videoBase64 = videoBuffer.toString('base64');
      const videoDataUrl = `data:video/mp4;base64,${videoBase64}`;

      // Update execution with result
      await this.executionsService.updateNodeResult(executionId, nodeId, 'complete', {
        video: videoDataUrl,
      });

      this.logger.log(`Audio replaced successfully for node ${nodeId}`);

      // Clean up temp file
      await unlink(outputPath).catch(() => {});

      return {
        videoUrl: videoDataUrl,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to replace audio for node ${nodeId}: ${errorMessage}`);

      // Clean up temp file on error
      await unlink(outputPath).catch(() => {});

      await this.executionsService.updateNodeResult(
        executionId,
        nodeId,
        'error',
        undefined,
        errorMessage
      );

      throw error;
    }
  }
}
