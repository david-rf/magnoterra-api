import { describe, expect, it } from 'vitest';
import {
  buildInstagramCaption,
  buildLinkedInCopy,
  buildYoutubeUploadBatchMarkdown,
} from '../src/social/youtubeUploadBatch.js';

describe('youtube upload batch markdown', () => {
  it('returns NO_VIDEOS when the payload is empty', () => {
    expect(buildYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch', videos: [] })).toBe('NO_VIDEOS');
  });

  it('formats one markdown block for each video', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'malla de puesta a tierra industrial',
        },
        {
          video_id: 'def456',
          url: 'https://youtu.be/def456',
          job: 'mantencion preventiva',
        },
      ],
    });

    expect(markdown).toContain('1) URL\nhttps://youtu.be/abc123');
    expect(markdown).toContain('2) Copy LinkedIn empresa');
    expect(markdown).toContain('3) Caption Instagram');
    expect(markdown).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(markdown).toContain('---');
    expect(markdown).not.toContain('video_id');
  });

  it('keeps LinkedIn copy and Instagram captions within the requested limits', () => {
    const longJob = 'puesta a tierra '.repeat(80);

    expect(buildLinkedInCopy(longJob).length).toBeLessThanOrEqual(900);
    expect(buildInstagramCaption(longJob).length).toBeLessThanOrEqual(500);
  });

  it('does not include omega figures or SEC certification claims from job text', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'certificacion SEC con 5 ohm en terreno',
        },
      ],
    });

    expect(markdown).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(?:ohms?|omega?s?|Ω)\b/i);
    expect(markdown).not.toMatch(/\bcertificaci[oó]n\s+SEC\b/i);
    expect(markdown).toContain('RIC N06 siempre debe evaluarse según el proyecto');
  });
});
