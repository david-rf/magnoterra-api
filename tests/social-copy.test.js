import { describe, expect, it } from 'vitest';
import {
  buildYoutubeUploadBatchMarkdown,
  INSTAGRAM_CAPTION,
  LINKEDIN_COMPANY_COPY,
} from '../src/lib/socialCopy.js';

describe('YouTube upload batch social copy', () => {
  it('returns NO_VIDEOS for empty payloads', () => {
    expect(buildYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch' })).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch', videos: [] })).toBe('NO_VIDEOS');
  });

  it('keeps the platform copy within the requested limits', () => {
    expect(LINKEDIN_COMPANY_COPY.length).toBeLessThanOrEqual(900);
    expect(INSTAGRAM_CAPTION.length).toBeLessThanOrEqual(500);
  });

  it('includes the required CTA and hashtags without prohibited claims', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'yt-001',
          url: 'https://www.youtube.com/watch?v=yt-001',
          job: 'video interno',
        },
      ],
    });

    expect(markdown).toContain('1. URL: https://www.youtube.com/watch?v=yt-001');
    expect(markdown).toContain('2. Copy LinkedIn empresa:');
    expect(markdown).toContain('3. Caption Instagram:');
    expect(markdown).toContain('magnoterra.cl/contacto');
    expect(markdown).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(markdown).toContain('RIC N06 cuando corresponde al proyecto');
    expect(markdown).not.toMatch(/omega|Ω|SEC/i);
  });
});

