import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  buildYoutubeUploadBatchMarkdown,
  CONTACT_URL,
  HASHTAGS,
  NO_VIDEOS_RESPONSE,
} from '../src/lib/youtubeUploadBatchMarkdown.js';

const samplePayload = {
  event: 'youtube_upload_batch',
  videos: [
    {
      video_id: 'abc123',
      url: 'https://youtu.be/abc123',
      job: 'medicion 1 Omega con certificado SEC',
    },
  ],
};

const extractField = (markdown, fieldName) =>
  markdown.match(
    new RegExp(`${fieldName}:\\n([\\s\\S]*?)(?:\\n\\n\\d\\)|$)`)
  )?.[1];

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS as markdown when the payload is empty', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({});

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe(NO_VIDEOS_RESPONSE);
  });

  it('returns NO_VIDEOS when the batch has no usable videos', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({ event: 'youtube_upload_batch', videos: [] });

    expect(response.status).toBe(200);
    expect(response.text).toBe(NO_VIDEOS_RESPONSE);
  });

  it('returns one markdown block for each uploaded video', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          samplePayload.videos[0],
          { video_id: 'fallback id', job: 'inspeccion tecnica' },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL: <https://youtu.be/abc123>');
    expect(response.text).toContain(
      '1) URL: <https://www.youtube.com/watch?v=fallback%20id>'
    );
    expect(response.text).toContain(CONTACT_URL);
    expect(response.text).toContain(HASHTAGS);
    expect(response.text.split('\n\n---\n\n')).toHaveLength(2);
  });

  it('keeps copy within limits and avoids forbidden claims', () => {
    const markdown = buildYoutubeUploadBatchMarkdown(samplePayload);
    const linkedInCopy = extractField(markdown, '2\\) Copy LinkedIn empresa');
    const instagramCaption = extractField(markdown, '3\\) Caption Instagram');

    expect(linkedInCopy).toBeDefined();
    expect(instagramCaption).toBeDefined();
    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
    expect(markdown).not.toMatch(/(Omega|ohm|Ω|\bSEC\b|certificado|cert\b)/i);
    expect(markdown).toContain(
      'RIC N06 aplica de forma condicionada a las caracteristicas especificas del proyecto'
    );
  });
});
