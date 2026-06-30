import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  INSTAGRAM_CAPTION,
  LINKEDIN_COPY,
} from '../src/social/youtubeUploadBatch.js';

describe('YouTube upload batch webhook', () => {
  it('returns markdown copy for each uploaded video', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'Instalacion de puesta a tierra',
          },
          {
            video_id: 'def456',
            url: 'https://youtu.be/def456',
            job: 'Revision tecnica',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe(
      [
        `1) URL: https://youtu.be/abc123`,
        `2) Copy LinkedIn empresa: ${LINKEDIN_COPY}`,
        `3) Caption Instagram: ${INSTAGRAM_CAPTION}`,
        '',
        `1) URL: https://youtu.be/def456`,
        `2) Copy LinkedIn empresa: ${LINKEDIN_COPY}`,
        `3) Caption Instagram: ${INSTAGRAM_CAPTION}`,
      ].join('\n')
    );
  });

  it('returns NO_VIDEOS when the payload is empty or contains no usable videos', async () => {
    const emptyPayloadResponse = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({});

    const noVideosResponse = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({ event: 'youtube_upload_batch', videos: [] });

    expect(emptyPayloadResponse.status).toBe(200);
    expect(emptyPayloadResponse.text).toBe('NO_VIDEOS');
    expect(noVideosResponse.status).toBe(200);
    expect(noVideosResponse.text).toBe('NO_VIDEOS');
  });

  it('keeps copy within platform limits and required messaging rules', () => {
    const forbiddenPatterns = [/omega/i, /ohm/i, /\u03a9/u, /cert\s*SEC/i];

    expect(LINKEDIN_COPY.length).toBeLessThanOrEqual(900);
    expect(INSTAGRAM_CAPTION.length).toBeLessThanOrEqual(500);
    expect(LINKEDIN_COPY).toContain('magnoterra.cl/contacto');
    expect(LINKEDIN_COPY).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(LINKEDIN_COPY).toContain('RIC N06 cuando corresponde al proyecto');
    expect(INSTAGRAM_CAPTION).toContain(
      'RIC N06 cuando corresponde al proyecto'
    );

    for (const pattern of forbiddenPatterns) {
      expect(LINKEDIN_COPY).not.toMatch(pattern);
      expect(INSTAGRAM_CAPTION).not.toMatch(pattern);
    }
  });
});
