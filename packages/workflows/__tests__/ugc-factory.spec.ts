import * as fs from 'node:fs';
import * as path from 'node:path';

describe('UGC Factory Workflow v2', () => {
  let workflow: any;

  beforeAll(() => {
    const filePath = path.resolve(__dirname, '../workflows/ugc-factory.json');
    workflow = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  });

  it('should have valid version 2', () => {
    expect(workflow.version).toBe(2);
  });

  it('should have correct name', () => {
    expect(workflow.name).toBe('UGC Factory Pro');
  });

  it('should have all required node types for full pipeline', () => {
    const nodeTypes = workflow.nodes.map((n: any) => n.type);

    // Core UGC nodes
    expect(nodeTypes).toContain('prompt');
    expect(nodeTypes).toContain('imageInput');
    expect(nodeTypes).toContain('textToSpeech');
    expect(nodeTypes).toContain('motionControl');
    expect(nodeTypes).toContain('lipSync');
    expect(nodeTypes).toContain('multiFormat');

    // Distribution nodes
    expect(nodeTypes).toContain('telegramPost');
    expect(nodeTypes).toContain('discordPost');
    expect(nodeTypes).toContain('twitterPost');
    expect(nodeTypes).toContain('instagramPost');
    expect(nodeTypes).toContain('tiktokPost');
    expect(nodeTypes).toContain('youtubePost');
    expect(nodeTypes).toContain('googleDriveUpload');
    expect(nodeTypes).toContain('webhookPost');
  });

  it('should have valid edges connecting all nodes', () => {
    const nodeIds = new Set(workflow.nodes.map((n: any) => n.id));
    for (const edge of workflow.edges) {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
    }
  });

  it('should have complete UGC pipeline: script → TTS → motion → lipSync → multiFormat → distribution', () => {
    const edgeMap = new Map<string, string[]>();
    for (const edge of workflow.edges) {
      if (!edgeMap.has(edge.source)) edgeMap.set(edge.source, []);
      edgeMap.get(edge.source)!.push(edge.target);
    }

    // script → TTS
    expect(edgeMap.get('script-input')).toContain('tts-voice');

    // avatar → motion control
    expect(edgeMap.get('avatar-input')).toContain('motion-control');

    // motion → lip sync
    expect(edgeMap.get('motion-control')).toContain('lip-sync');

    // TTS → lip sync
    expect(edgeMap.get('tts-voice')).toContain('lip-sync');

    // lip sync → multi format
    expect(edgeMap.get('lip-sync')).toContain('multi-format');

    // multi format → distribution nodes
    const multiFormatTargets = edgeMap.get('multi-format') || [];
    expect(multiFormatTargets).toContain('telegram-post');
    expect(multiFormatTargets).toContain('discord-post');
    expect(multiFormatTargets).toContain('twitter-post');
    expect(multiFormatTargets).toContain('instagram-post');
    expect(multiFormatTargets).toContain('tiktok-post');
    expect(multiFormatTargets).toContain('youtube-post');
    expect(multiFormatTargets).toContain('google-drive');
  });

  it('should have TTS node configured with ElevenLabs', () => {
    const ttsNode = workflow.nodes.find((n: any) => n.type === 'textToSpeech');
    expect(ttsNode.data.provider).toBe('elevenlabs');
    expect(ttsNode.data.voice).toBe('rachel');
    expect(ttsNode.data.stability).toBe(0.6);
    expect(ttsNode.data.similarityBoost).toBe(0.8);
  });

  it('should have motion control node with trajectory settings', () => {
    const motionNode = workflow.nodes.find((n: any) => n.type === 'motionControl');
    expect(motionNode.data.mode).toBe('video_transfer');
    expect(motionNode.data.duration).toBe(5);
    expect(motionNode.data.aspectRatio).toBe('16:9');
    expect(motionNode.data.trajectory).toBeDefined();
    expect(Array.isArray(motionNode.data.trajectory)).toBe(true);
    expect(motionNode.data.motionStrength).toBe(0.3);
  });

  it('should have multi-format node with aspect ratio configurations', () => {
    const multiFormatNode = workflow.nodes.find((n: any) => n.type === 'multiFormat');
    expect(multiFormatNode.data.formats).toBeDefined();
    expect(Array.isArray(multiFormatNode.data.formats)).toBe(true);
    expect(multiFormatNode.data.formats).toHaveLength(3);

    const aspectRatios = multiFormatNode.data.formats.map((f: any) => f.aspectRatio);
    expect(aspectRatios).toContain('16:9');
    expect(aspectRatios).toContain('9:16');
    expect(aspectRatios).toContain('1:1');
  });

  it('should have proper platform-specific format connections', () => {
    const edges = workflow.edges;

    // TikTok should get 9:16 format (vertical)
    const tiktokEdge = edges.find(
      (e: any) => e.target === 'tiktok-post' && e.sourceHandle === 'format_9_16'
    );
    expect(tiktokEdge).toBeDefined();

    // Instagram should get 9:16 format (vertical)
    const instagramEdge = edges.find(
      (e: any) => e.target === 'instagram-post' && e.sourceHandle === 'format_9_16'
    );
    expect(instagramEdge).toBeDefined();

    // Twitter should get 16:9 format (horizontal)
    const twitterEdge = edges.find(
      (e: any) => e.target === 'twitter-post' && e.sourceHandle === 'format_16_9'
    );
    expect(twitterEdge).toBeDefined();

    // YouTube should get 9:16 format (Shorts)
    const youtubeEdge = edges.find(
      (e: any) => e.target === 'youtube-post' && e.sourceHandle === 'format_9_16'
    );
    expect(youtubeEdge).toBeDefined();
  });

  it('should have script input connected to social media caption fields', () => {
    const edgeMap = new Map<string, string[]>();
    for (const edge of workflow.edges) {
      if (!edgeMap.has(edge.source)) edgeMap.set(edge.source, []);
      edgeMap.get(edge.source)!.push(edge.target);
    }

    const scriptTargets = edgeMap.get('script-input') || [];
    expect(scriptTargets).toContain('telegram-post');
    expect(scriptTargets).toContain('discord-post');
    expect(scriptTargets).toContain('twitter-post');
  });

  it('should have webhook notification connected to social media outputs', () => {
    const webhookEdge = workflow.edges.find((e: any) => e.target === 'webhook-notify');
    expect(webhookEdge).toBeDefined();
    expect(webhookEdge.source).toBe('telegram-post');
    expect(webhookEdge.sourceHandle).toBe('url');
  });

  it('should have social media nodes configured with platform-specific settings', () => {
    const tiktokNode = workflow.nodes.find((n: any) => n.type === 'tiktokPost');
    expect(tiktokNode.data.hashtags).toContain('#viral');
    expect(tiktokNode.data.hashtags).toContain('#ai');

    const youtubeNode = workflow.nodes.find((n: any) => n.type === 'youtubePost');
    expect(youtubeNode.data.visibility).toBe('public');
    expect(youtubeNode.data.tags).toContain('AI');

    const instagramNode = workflow.nodes.find((n: any) => n.type === 'instagramPost');
    expect(instagramNode.data.postType).toBe('reels');
  });
});
