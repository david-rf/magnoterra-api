import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  INSTAGRAM_LIMIT,
  LINKEDIN_LIMIT,
  buildYoutubeUploadBatchMarkdown,
} from '../src/social/youtubeUploadBatch.js';

const extractSection = (markdown, startLabel, endLabel) => {
  const start = markdown.indexOf(startLabel);
  const end = endLabel ? markdown.indexOf(endLabel) : markdown.length;

  return markdown.slice(start + startLabel.length, end).trim();
};

describe('youtube upload batch markdown', () => {
  it('returns NO_VIDEOS when payload has no videos', () => {
    expect(buildYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch' })).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({ videos: [] })).toBe('NO_VIDEOS');
  });

  it('builds markdown with required LinkedIn and Instagram sections', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: {
            title: 'Malla puesta a tierra 2 Ω con certificacion SEC',
            region: 'Valparaiso',
            description: 'Medicion 1.5 ohm en terreno',
          },
        },
      ],
    });
    const linkedInCopy = extractSection(
      markdown,
      '2. Copy LinkedIn empresa',
      '3. Caption Instagram',
    );
    const instagramCaption = extractSection(markdown, '3. Caption Instagram');

    expect(markdown).toContain('1. URL\nhttps://youtu.be/abc123');
    expect(linkedInCopy.length).toBeLessThanOrEqual(LINKEDIN_LIMIT);
    expect(instagramCaption.length).toBeLessThanOrEqual(INSTAGRAM_LIMIT);
    expect(linkedInCopy).toContain('magnoterra.cl/contacto');
    expect(linkedInCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(linkedInCopy).toContain('RIC N06 se revisa segun las condiciones de cada proyecto');
    expect(instagramCaption).toContain('RIC N06 aplica segun las condiciones de cada proyecto');
    expect(markdown).not.toMatch(/[ΩΩ]|\bohm\b|\bomega\b|\bSEC\b/i);
  });

  it('uses video_id as fallback URL and separates multiple videos', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      videos: [
        { video_id: 'first-video', job: 'Puesta a tierra industrial' },
        { url: 'https://youtu.be/second-video', job: 'Inspeccion en terreno' },
      ],
    });

    expect(markdown).toContain('https://www.youtube.com/watch?v=first-video');
    expect(markdown).toContain('https://youtu.be/second-video');
    expect(markdown).toContain('\n\n---\n\n');
  });
});

describe('youtube upload batch webhook endpoint', () => {
  it('responds markdown for the specific endpoint', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            url: 'https://youtu.be/company-video',
            job: 'Instalacion de puesta a tierra para proyecto comercial',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/markdown/);
    expect(response.text).toContain('1. URL\nhttps://youtu.be/company-video');
    expect(response.text).toContain('2. Copy LinkedIn empresa');
    expect(response.text).toContain('3. Caption Instagram');
  });

  it('responds NO_VIDEOS for an empty generic webhook payload', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({ event: 'youtube_upload_batch', videos: [] });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/markdown/);
    expect(response.text).toBe('NO_VIDEOS');
  });
});
