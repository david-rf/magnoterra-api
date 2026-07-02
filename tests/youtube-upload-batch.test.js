import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { formatYoutubeUploadBatchMarkdown } from '../src/social/youtubeUploadBatch.js';

const extractSection = (markdown, startLabel, endLabel) => {
  const start = markdown.indexOf(startLabel);
  const end = markdown.indexOf(endLabel, start + startLabel.length);

  return markdown
    .slice(start + startLabel.length, end > -1 ? end : undefined)
    .trim();
};

describe('YouTube upload batch markdown formatter', () => {
  it('returns NO_VIDEOS when payload has no videos', () => {
    expect(formatYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch' })).toBe('NO_VIDEOS');
    expect(formatYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch', videos: [] })).toBe('NO_VIDEOS');
  });

  it('formats each video as markdown with constrained social copy', () => {
    const markdown = formatYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [{
        video_id: 'abc123',
        url: 'https://youtu.be/abc123',
        job: {
          title: 'mantenimiento de malla de puesta a tierra',
          location: 'Santiago',
          description: 'revision tecnica preventiva',
        },
      }],
    });

    const linkedInCopy = extractSection(markdown, '2) Copy LinkedIn empresa:', '3) Caption Instagram:');
    const instagramCaption = extractSection(markdown, '3) Caption Instagram:');

    expect(markdown).toContain('### abc123');
    expect(markdown).toContain('1) URL: https://youtu.be/abc123');
    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
    expect(linkedInCopy).toContain('magnoterra.cl/contacto');
    expect(linkedInCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(linkedInCopy).toContain('RIC N06');
    expect(linkedInCopy).toContain('proyecto');
    expect(markdown).not.toMatch(/omega|\u03a9|\u2126|cert\.?\s*SEC|certificaci[oó]n\s+SEC/i);
  });
});

describe('YouTube upload batch webhook route', () => {
  it('responds with markdown for the generic webhook event', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({
        event: 'youtube_upload_batch',
        videos: [{
          video_id: 'video-1',
          url: 'https://youtu.be/video-1',
          job: 'instalacion y medicion de sistema de puesta a tierra',
        }],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL: https://youtu.be/video-1');
    expect(response.text).toContain('2) Copy LinkedIn empresa:');
    expect(response.text).toContain('3) Caption Instagram:');
  });
});
