import { describe, expect, it } from 'vitest';
import {
  CONTACT_URL,
  HASHTAGS,
  INSTAGRAM_LIMIT,
  LINKEDIN_LIMIT,
  NO_VIDEOS,
  renderYouTubeUploadBatchMarkdown,
} from '../src/social/youtubeUploadBatch.js';

const getSection = (markdown, startLabel, endLabel) => {
  const start = markdown.indexOf(startLabel);
  const end = markdown.indexOf(endLabel, start);

  return markdown.slice(start + startLabel.length, end).trim();
};

describe('YouTube upload batch social copy', () => {
  it('returns NO_VIDEOS for empty payloads', () => {
    expect(renderYouTubeUploadBatchMarkdown()).toBe(NO_VIDEOS);
    expect(renderYouTubeUploadBatchMarkdown({ event: 'youtube_upload_batch', videos: [] })).toBe(NO_VIDEOS);
  });

  it('renders markdown copy for each uploaded video', () => {
    const markdown = renderYouTubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'mantencion industrial',
        },
      ],
    });

    expect(markdown).toContain('## Video 1');
    expect(markdown).toContain('1) URL: https://youtu.be/abc123');
    expect(markdown).toContain('2) Copy LinkedIn empresa:');
    expect(markdown).toContain('3) Caption Instagram:');
    expect(markdown).toContain(CONTACT_URL);
    expect(markdown).toContain(HASHTAGS);
    expect(markdown).toContain('RIC N06 se evalua segun las condiciones de cada proyecto');
  });

  it('keeps LinkedIn and Instagram sections within their limits', () => {
    const markdown = renderYouTubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'long-job',
          url: 'https://youtu.be/long-job',
          job: 'a'.repeat(500),
        },
      ],
    });

    const linkedInCopy = getSection(markdown, '2) Copy LinkedIn empresa:', '3) Caption Instagram:');
    const instagramCaption = markdown.split('3) Caption Instagram:')[1].trim();

    expect(linkedInCopy.length).toBeLessThanOrEqual(LINKEDIN_LIMIT);
    expect(instagramCaption.length).toBeLessThanOrEqual(INSTAGRAM_LIMIT);
  });

  it('removes forbidden claims from provided job context', () => {
    const markdown = renderYouTubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'safe-copy',
          url: 'https://youtu.be/safe-copy',
          job: 'cert SEC y medicion 5 ohm con simbolo Ω Omega',
        },
      ],
    });

    expect(markdown).not.toMatch(/\bSEC\b/i);
    expect(markdown).not.toMatch(/[ΩΩ]/);
    expect(markdown).not.toMatch(/\bohm(?:ios?|s)?\b/i);
    expect(markdown).not.toMatch(/\bomega\b/i);
  });
});
