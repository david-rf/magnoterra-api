import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  buildYoutubeUploadBatchMarkdown,
  limits,
  templates,
} from '../src/lib/youtubeUploadBatchMarkdown.js';

const samplePayload = {
  event: 'youtube_upload_batch',
  videos: [
    {
      video_id: 'abc123',
      url: 'https://youtu.be/abc123',
      job: 'puesta a tierra',
    },
  ],
};

describe('YouTube upload batch webhook markdown', () => {
  it('returns NO_VIDEOS for an empty payload', async () => {
    const response = await request(app).post('/api/webhooks').send({});

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('returns one markdown block for each video', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          samplePayload.videos[0],
          { video_id: 'fallback-id', job: 'inspeccion' },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL\n<https://youtu.be/abc123>');
    expect(response.text).toContain(
      '1) URL\n<https://www.youtube.com/watch?v=fallback-id>'
    );
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');
  });

  it('keeps copy within requested limits and required wording', () => {
    const markdown = buildYoutubeUploadBatchMarkdown(samplePayload);

    expect(templates.linkedInCopy.length).toBeLessThanOrEqual(
      limits.linkedInMaxLength
    );
    expect(templates.instagramCaption.length).toBeLessThanOrEqual(
      limits.instagramMaxLength
    );
    expect(markdown).toContain('magnoterra.cl/contacto');
    expect(markdown).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(markdown).toContain('RIC N06 queda condicionado');
    expect(markdown).not.toMatch(/omega|ohm|Ω|\bSEC\b|cert/i);
  });

  it('returns NO_VIDEOS for another webhook event', () => {
    expect(
      buildYoutubeUploadBatchMarkdown({
        event: 'other_event',
        videos: [{ url: 'https://youtu.be/abc123' }],
      })
    ).toBe('NO_VIDEOS');
  });
});
