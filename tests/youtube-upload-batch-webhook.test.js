import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { buildYoutubeUploadBatchMarkdown } from '../src/lib/youtubeUploadBatchMarkdown.js';

const payload = {
  event: 'youtube_upload_batch',
  videos: [
    {
      video_id: 'abc123',
      url: 'https://youtu.be/abc123',
      job: 'mantencion puesta a tierra',
    },
  ],
};

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS when the payload has no videos', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({ event: 'youtube_upload_batch', videos: [] });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('returns markdown for each uploaded video', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          payload.videos[0],
          { video_id: 'fallback-id', job: 'inspeccion tecnica' },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.text).toContain('### Video 1');
    expect(response.text).toContain('1) URL: <https://youtu.be/abc123>');
    expect(response.text).toContain('### Video 2');
    expect(response.text).toContain(
      '1) URL: <https://www.youtube.com/watch?v=fallback-id>'
    );
    expect(response.text).toContain('magnoterra.cl/contacto');
    expect(response.text).toContain('#PuestaATierra #Chile #MagnoTerra');
  });

  it('keeps generated copy within requested limits and avoids forbidden claims', () => {
    const markdown = buildYoutubeUploadBatchMarkdown(payload);
    const linkedInCopy = markdown.match(
      /2\) Copy LinkedIn empresa \(<=900 chars\):\n\n([\s\S]*?)\n\n3\)/
    )?.[1];
    const instagramCaption = markdown.match(
      /3\) Caption Instagram \(<=500 chars\):\n\n([\s\S]*)$/
    )?.[1];

    expect(linkedInCopy).toBeDefined();
    expect(instagramCaption).toBeDefined();
    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
    expect(markdown).not.toMatch(/(Omega|ohm|Ω|\bSEC\b|cert)/i);
    expect(markdown).toContain(
      'RIC N06 aplica segun las condiciones especificas del proyecto'
    );
  });
});
