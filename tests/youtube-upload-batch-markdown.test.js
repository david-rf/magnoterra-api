import { describe, expect, it } from 'vitest';
import {
  buildYoutubeUploadBatchMarkdown,
  socialCopyRules,
} from '../src/lib/youtubeUploadBatchMarkdown.js';

const getSection = (markdown, title) => {
  const [, section = ''] = markdown.split(`${title}:\n\n`);
  return section.split(/\n\n(?:\d\)|---|## Video)/)[0];
};

describe('YouTube upload batch markdown', () => {
  it('returns NO_VIDEOS for empty payloads', () => {
    expect(buildYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch', videos: [] })).toBe('NO_VIDEOS');
  });

  it('formats one markdown block per video with CTA and required hashtags', () => {
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
          job: 'mejoramiento de continuidad operacional',
        },
      ],
    });

    expect(markdown).toContain('## Video 1');
    expect(markdown).toContain('## Video 2');
    expect(markdown).toContain('1) URL: https://youtu.be/abc123');
    expect(markdown).toContain('1) URL: https://youtu.be/def456');
    expect(markdown).toContain(socialCopyRules.CONTACT_CTA);
    expect(markdown).toContain(socialCopyRules.REQUIRED_HASHTAGS);
  });

  it('keeps social copy within requested limits and removes restricted claims', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'cert SEC con medicion 4 ohms para RIC N06',
        },
      ],
    });
    const linkedInCopy = getSection(markdown, '2) Copy LinkedIn empresa');
    const instagramCaption = getSection(markdown, '3) Caption Instagram');

    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
    expect(linkedInCopy).toContain('RIC N06 se considera cuando corresponde al proyecto');
    expect(markdown).not.toMatch(/\bSEC\b/i);
    expect(markdown).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(?:Ω|ohms?|ohmios?|omega)\b/i);
  });
});
