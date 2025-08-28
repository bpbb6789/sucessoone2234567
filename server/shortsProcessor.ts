import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { uploadFileToIPFS } from './ipfs';
import sharp from 'sharp';

export interface VideoInfo {
  title: string;
  description?: string;
  duration: number;
  platform: string;
  thumbnail?: string;
  videoFile?: Buffer;
  thumbnailFile?: Buffer;
}

export interface ProcessResult {
  success: boolean;
  videoInfo?: VideoInfo;
  videoCid?: string;
  thumbnailCid?: string;
  error?: string;
}

export class ShortsProcessor {
  private tempDir: string;

  constructor() {
    this.tempDir = '/tmp/shorts-processing';
    this.ensureTempDir();
  }

  private async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create temp directory:', error);
    }
  }

  /**
   * Detect platform from URL
   */
  private detectPlatform(url: string): string {
    const hostname = new URL(url).hostname.toLowerCase();
    
    if (hostname.includes('tiktok.com')) return 'TikTok';
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'YouTube';
    if (hostname.includes('instagram.com')) return 'Instagram';
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'Twitter';
    if (hostname.includes('facebook.com') || hostname.includes('fb.com')) return 'Facebook';
    
    return 'Unknown';
  }

  /**
   * Check if URL is likely a shorts/reel format
   */
  private isShortsUrl(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return (
      lowerUrl.includes('/shorts/') ||
      lowerUrl.includes('/reel/') ||
      lowerUrl.includes('tiktok.com') ||
      lowerUrl.includes('/reels/') ||
      lowerUrl.includes('stories/')
    );
  }

  /**
   * Get video information using yt-dlp
   */
  private async getVideoInfo(url: string): Promise<VideoInfo | null> {
    return new Promise((resolve) => {
      const ytDlp = spawn('yt-dlp', [
        '--dump-json',
        '--no-download',
        url
      ]);

      let output = '';
      let error = '';

      ytDlp.stdout.on('data', (data) => {
        output += data.toString();
      });

      ytDlp.stderr.on('data', (data) => {
        error += data.toString();
      });

      ytDlp.on('close', (code) => {
        if (code !== 0) {
          console.error('yt-dlp info error:', error);
          resolve(null);
          return;
        }

        try {
          const info = JSON.parse(output);
          const platform = this.detectPlatform(url);
          
          resolve({
            title: info.title || 'Untitled',
            description: info.description || '',
            duration: info.duration || 0,
            platform,
            thumbnail: info.thumbnail
          });
        } catch (parseError) {
          console.error('Failed to parse yt-dlp output:', parseError);
          resolve(null);
        }
      });
    });
  }

  /**
   * Download video using yt-dlp
   */
  private async downloadVideo(url: string, outputPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      const ytDlp = spawn('yt-dlp', [
        '--format', 'best[height<=720][ext=mp4]/best[ext=mp4]/best',
        '--output', outputPath,
        '--max-filesize', '50M', // 50MB limit for shorts
        url
      ]);

      let error = '';

      ytDlp.stderr.on('data', (data) => {
        error += data.toString();
      });

      ytDlp.on('close', (code) => {
        if (code !== 0) {
          console.error('yt-dlp download error:', error);
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  }

  /**
   * Generate thumbnail using ffmpeg
   */
  private async generateThumbnail(videoPath: string, thumbnailPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-ss', '00:00:01', // Extract frame at 1 second
        '-vframes', '1',
        '-vf', 'scale=320:240', // Resize for web
        '-y', // Overwrite output file
        thumbnailPath
      ]);

      let error = '';

      ffmpeg.stderr.on('data', (data) => {
        error += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          console.error('ffmpeg thumbnail error:', error);
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  }

  /**
   * Process short-form video URL
   */
  async processShorts(url: string): Promise<ProcessResult> {
    try {
      console.log(`Processing shorts URL: ${url}`);
      
      // Validate URL format
      if (!this.isShortsUrl(url)) {
        return {
          success: false,
          error: 'URL does not appear to be short-form content. Please use TikTok, YouTube Shorts, Instagram Reels, etc.'
        };
      }

      // Get video information first
      const videoInfo = await this.getVideoInfo(url);
      if (!videoInfo) {
        return {
          success: false,
          error: 'Failed to fetch video information. Please check the URL.'
        };
      }

      // Check duration for shorts content (15-90 seconds)
      if (videoInfo.duration > 90) {
        return {
          success: false,
          error: `Video is ${Math.round(videoInfo.duration)}s long. Shorts content should be under 90 seconds.`
        };
      }

      if (videoInfo.duration < 3) {
        return {
          success: false,
          error: 'Video is too short. Minimum duration is 3 seconds.'
        };
      }

      // Create unique filenames
      const timestamp = Date.now();
      const videoFilename = `video_${timestamp}.mp4`;
      const thumbnailFilename = `thumb_${timestamp}.jpg`;
      const videoPath = path.join(this.tempDir, videoFilename);
      const thumbnailPath = path.join(this.tempDir, thumbnailFilename);

      // Download video
      console.log('Downloading video...');
      const downloadSuccess = await this.downloadVideo(url, videoPath);
      if (!downloadSuccess) {
        return {
          success: false,
          error: 'Failed to download video. The content may be private or unavailable.'
        };
      }

      // Check if file exists and has content
      try {
        const stats = await fs.stat(videoPath);
        if (stats.size === 0) {
          return {
            success: false,
            error: 'Downloaded video file is empty.'
          };
        }
      } catch {
        return {
          success: false,
          error: 'Downloaded video file not found.'
        };
      }

      // Generate thumbnail
      console.log('Generating thumbnail...');
      const thumbnailSuccess = await this.generateThumbnail(videoPath, thumbnailPath);
      
      // Read files into memory
      const videoBuffer = await fs.readFile(videoPath);
      let thumbnailBuffer: Buffer | undefined;
      
      if (thumbnailSuccess) {
        try {
          // Optimize thumbnail with sharp
          thumbnailBuffer = await sharp(thumbnailPath)
            .resize(320, 240, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toBuffer();
        } catch (error) {
          console.warn('Thumbnail optimization failed:', error);
          // Fallback to original file
          try {
            thumbnailBuffer = await fs.readFile(thumbnailPath);
          } catch {
            // Thumbnail generation failed, continue without it
          }
        }
      }

      // Upload to IPFS
      console.log('Uploading to IPFS...');
      const videoFile = new File([videoBuffer], videoFilename, { type: 'video/mp4' });
      const videoCid = await uploadFileToIPFS(videoFile);

      let thumbnailCid: string | undefined;
      if (thumbnailBuffer) {
        const thumbnailFile = new File([thumbnailBuffer], thumbnailFilename, { type: 'image/jpeg' });
        thumbnailCid = await uploadFileToIPFS(thumbnailFile);
      }

      // Cleanup temp files
      try {
        await fs.unlink(videoPath);
        if (thumbnailSuccess) {
          await fs.unlink(thumbnailPath);
        }
      } catch (error) {
        console.warn('Failed to cleanup temp files:', error);
      }

      return {
        success: true,
        videoInfo: {
          ...videoInfo,
          videoFile: videoBuffer,
          thumbnailFile: thumbnailBuffer
        },
        videoCid,
        thumbnailCid
      };

    } catch (error) {
      console.error('Shorts processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown processing error'
      };
    }
  }
}

// Export singleton instance
export const shortsProcessor = new ShortsProcessor();