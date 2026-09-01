import { describe, expect, it } from 'vitest';
import { createYoutubeUploadBatchMarkdown } from '../src/services/youtubeSocialMarkdown.js';

const getLineValue = (markdown, label) => {
  const line = markdown.split('\n').find((item) => item.includes(label));
  return line.replace(/^\d+\. [^:]+: /, '');
};

describe('YouTube social markdown generator', () => {
  it('returns NO_VIDEOS when the payload is empty or has no videos', () => {
    expect(createYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(createYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
    expect(createYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [],
    })).toBe('NO_VIDEOS');
  });

  it('formats a markdown response for each uploaded video', () => {
    const markdown = createYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Mantencion planta norte',
        },
      ],
    });

    expect(markdown).toContain('1. URL: https://youtu.be/abc123');
    expect(markdown).toContain('2. Copy LinkedIn empresa:');
    expect(markdown).toContain('3. Caption Instagram:');
    expect(markdown).toContain('magnoterra.cl/contacto');
    expect(markdown).toContain('#PuestaATierra #Chile #MagnoTerra');
  });

  it('keeps channel copy inside requested limits and avoids restricted claims', () => {
    const markdown = createYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'restricted-input',
          url: 'https://youtu.be/restricted-input',
          job: 'No repetir cifras Omega ni cert SEC',
        },
      ],
    });

    const linkedInCopy = getLineValue(markdown, 'Copy LinkedIn empresa');
    const instagramCaption = getLineValue(markdown, 'Caption Instagram');

    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
    expect(markdown).not.toMatch(/omega|ohm|Ω|SEC/i);
    expect(markdown).toContain('cuando aplica, consideramos criterios de RIC N06');
  });

  it('separates multiple videos and skips entries without a URL', () => {
    const markdown = createYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        { video_id: 'missing-url', job: 'Sin URL' },
        { video_id: 'one', url: 'https://youtu.be/one', job: 'Uno' },
        { video_id: 'two', url: 'https://youtu.be/two', job: 'Dos' },
      ],
    });

    expect(markdown).toContain('https://youtu.be/one');
    expect(markdown).toContain('https://youtu.be/two');
    expect(markdown).not.toContain('missing-url');
    expect(markdown.split('\n\n---\n\n')).toHaveLength(2);
  });

  it('rejects unsupported webhook events', () => {
    expect(() => createYoutubeUploadBatchMarkdown({
      event: 'other_event',
      videos: [{ url: 'https://youtu.be/abc123' }],
    })).toThrow('Unsupported event');
  });
});
