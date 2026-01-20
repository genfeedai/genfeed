import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExecutionsService } from '@/services/executions.service';

export interface TTSInput {
  text: string;
  voice: string;
  provider: 'elevenlabs' | 'openai';
  stability?: number;
  similarityBoost?: number;
  speed?: number;
}

export interface TTSResult {
  audioUrl: string;
  duration?: number;
}

// ElevenLabs voice IDs mapping
const ELEVENLABS_VOICE_IDS: Record<string, string> = {
  rachel: '21m00Tcm4TlvDq8ikWAM',
  drew: '29vD33N1CtxCmqQRPOHJ',
  clyde: '2EiwWnXFnvU5JabPnv8n',
  paul: '5Q0t7uMcjvnagumLfvZi',
  domi: 'AZnzlk1XvdvUeBnXmlld',
  dave: 'CYw3kZ02Hs0563khs1Fj',
  fin: 'D38z5RcWu1voky8WS1ja',
  sarah: 'EXAVITQu4vr4xnSDxMaL',
  antoni: 'ErXwobaYiN019PkySvjV',
  thomas: 'GBv7mTt0atIp3Br8iCZE',
  charlie: 'IKne3meq5aSn9XLyUdCD',
  george: 'JBFqnCBsd6RMkjVDRZzb',
  emily: 'LcfcDJNUP1GQjkzn1xUU',
  elli: 'MF3mGyEYCl7XYWbV9V6O',
  callum: 'N2lVS1w4EtoT3dr4eOWO',
  patrick: 'ODq5zmih8GrVes37Dizd',
  harry: 'SOYHLrjzK2X1ezoPC6cr',
  liam: 'TX3LPaxmHKxFdv7VOQHJ',
  dorothy: 'ThT5KcBeYPX3keUQqHPh',
  josh: 'TxGEqnHWrfWFTfGW9XjX',
  arnold: 'VR6AewLTigWG4xSOukaG',
  charlotte: 'XB0fDUnXU5powFXDhCwa',
  matilda: 'XrExE9yKIg1WjnnlVkGX',
  matthew: 'Yko7PKs6JEPSqpOtyK2s',
  james: 'ZQe5CZNOzWyzPSCn5a3c',
  joseph: 'Zlb1dXrM653N07WRdFW3',
  jeremy: 'bVMeCyTHy58xNoL34h3p',
  michael: 'flq6f7yk4E4fJM5XTYuZ',
  ethan: 'g5CIjZEefAph4nQFvHAz',
  gigi: 'jBpfuIE2acCO8z3wKNLl',
  freya: 'jsCqWAovK2LkecY7zXl4',
  grace: 'oWAxZDx7w5VEj9dCyTzz',
  daniel: 'onwK4e9ZLuTAKqWW03F9',
  lily: 'pFZP5JQG7iQjIQuC4Bku',
  serena: 'pMsXgVXv3BLzUgSXRplE',
  adam: 'pNInz6obpgDQGcFmaJgB',
  nicole: 'piTKgcLEGmPE4e6mEKli',
  jessie: 't0jbNlBVZ17f02VDIeMI',
  ryan: 'wViXBPUzp2ZZixB1xQuM',
  sam: 'yoZ06aMxZJJ28mfd3POQ',
  glinda: 'z9fAnlkpzviPz146aGWa',
  giovanni: 'zcAOhNBS3c14rBihAFp1',
  mimi: 'zrHiDhphv9ZnVXBqCLjz',
};

@Injectable()
export class TTSService {
  private readonly logger = new Logger(TTSService.name);
  private readonly elevenLabsApiKey: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => ExecutionsService))
    private readonly executionsService: ExecutionsService
  ) {
    this.elevenLabsApiKey = this.configService.get<string>('ELEVENLABS_API_KEY');
  }

  /**
   * Generate speech from text using ElevenLabs
   */
  async generateSpeech(executionId: string, nodeId: string, input: TTSInput): Promise<TTSResult> {
    if (!this.elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceId = ELEVENLABS_VOICE_IDS[input.voice] ?? ELEVENLABS_VOICE_IDS.rachel;

    this.logger.log(`Generating speech for node ${nodeId} with voice ${input.voice}`);

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: input.text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: input.stability ?? 0.5,
            similarity_boost: input.similarityBoost ?? 0.75,
            style: 0,
            use_speaker_boost: true,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      // Get the audio as a buffer
      const audioBuffer = await response.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;

      // Update execution with result
      await this.executionsService.updateNodeResult(executionId, nodeId, 'complete', {
        audio: audioDataUrl,
      });

      this.logger.log(`Speech generated successfully for node ${nodeId}`);

      return {
        audioUrl: audioDataUrl,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to generate speech for node ${nodeId}: ${errorMessage}`);

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
