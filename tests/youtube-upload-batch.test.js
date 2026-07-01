import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { buildYoutubeUploadBatchMarkdown } from '../src/social/youtubeUploadBatch.js';

const readField = (markdown, label) => {
  const line = markdown.split('\n').find((item) => item.startsWith(label));

  return line.replace(label, '').trim();
};

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS when payload is empty', () => {
    expect(buildYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(
      buildYoutubeUploadBatchMarkdown({
        event: 'youtube_upload_batch',
        videos: [],
      })
    ).toBe('NO_VIDEOS');
  });

  it('returns markdown for each uploaded video', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: { title: 'Mantenimiento de puesta a tierra industrial' },
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL: https://youtu.be/abc123');
    expect(response.text).toContain('2) Copy LinkedIn empresa:');
    expect(response.text).toContain('magnoterra.cl/contacto');
    expect(response.text).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(response.text).toContain('3) Caption Instagram:');
  });

  it('keeps copy within limits and sanitizes restricted claims', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'video-1',
          url: 'https://youtu.be/video-1',
          job: 'Medicion 5 ohm con cert SEC y RIC N06 para planta industrial',
        },
      ],
    });

    const linkedInCopy = readField(markdown, '2) Copy LinkedIn empresa:');
    const instagramCaption = readField(markdown, '3) Caption Instagram:');

    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
    expect(markdown).not.toMatch(/\bohm/i);
    expect(markdown).not.toMatch(/\bSEC\b/);
    expect(markdown).not.toMatch(/\bcert\s*SEC\b/i);
    expect(markdown).toContain('RIC N06 sujeto a los requisitos del proyecto');
    expect(markdown).toContain('RIC N06 aplica cuando el proyecto lo requiere');
  });
});
