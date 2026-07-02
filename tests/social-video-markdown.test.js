import { describe, expect, it } from 'vitest';
import {
  buildYoutubeUploadBatchMarkdown,
  CONTACT_CTA,
  INSTAGRAM_MAX_LENGTH,
  LINKEDIN_MAX_LENGTH,
  REQUIRED_HASHTAGS,
} from '../src/lib/socialVideoMarkdown.js';

const getSection = (markdown, sectionTitle, nextSectionTitle) => {
  const start = markdown.indexOf(sectionTitle);
  const end = nextSectionTitle ? markdown.indexOf(nextSectionTitle) : markdown.length;

  return markdown.slice(start + sectionTitle.length, end).trim();
};

describe('youtube upload batch markdown', () => {
  it('returns NO_VIDEOS when payload has no videos', () => {
    expect(buildYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch', videos: [] }))
      .toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
  });

  it('formats every video as markdown with URL, LinkedIn copy, and Instagram caption', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'yt-001',
          url: 'https://youtu.be/example-1',
          job: 'Proyecto industrial 2 Ω con cert SEC y 3 omega',
        },
        {
          video_id: 'yt-002',
          url: 'https://youtu.be/example-2',
          job: { project: 'Edificio comercial' },
        },
      ],
    });

    expect(markdown).not.toContain('### Video');
    expect(markdown).toContain('1) URL\nhttps://youtu.be/example-1');
    expect(markdown).toContain('1) URL\nhttps://youtu.be/example-2');
    expect(markdown.match(/1\) URL/g)).toHaveLength(2);
    expect(markdown).toContain('2) Copy LinkedIn empresa');
    expect(markdown).toContain('3) Caption Instagram');
    expect(markdown).toContain(CONTACT_CTA);
    expect(markdown).toContain(REQUIRED_HASHTAGS);
    expect(markdown).toContain('RIC N06');
    expect(markdown).not.toMatch(/Ω|omega|ohm/i);
    expect(markdown).not.toMatch(/\bSEC\b/i);
  });

  it('keeps social copy within requested character limits', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'yt-001',
          url: 'https://youtu.be/example-1',
          job: 'Proyecto de infraestructura electrica para instalacion critica con descripcion extensa',
        },
      ],
    });

    const linkedInCopy = getSection(
      markdown,
      '2) Copy LinkedIn empresa',
      '3) Caption Instagram',
    );
    const instagramCaption = getSection(markdown, '3) Caption Instagram');

    expect(linkedInCopy.length).toBeLessThanOrEqual(LINKEDIN_MAX_LENGTH);
    expect(instagramCaption.length).toBeLessThanOrEqual(INSTAGRAM_MAX_LENGTH);
    expect(linkedInCopy).toContain(CONTACT_CTA);
    expect(linkedInCopy).toContain(REQUIRED_HASHTAGS);
  });
});
