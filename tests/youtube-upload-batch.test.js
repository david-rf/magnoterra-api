import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  renderYoutubeUploadBatchMarkdown,
  YOUTUBE_UPLOAD_BATCH_LIMITS,
} from '../src/social/youtubeUploadBatch.js';

const getSection = (markdown, label, nextLabel) => {
  const start = markdown.indexOf(label);
  const end = nextLabel ? markdown.indexOf(nextLabel, start) : markdown.length;

  return markdown.slice(start + label.length, end).trim();
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

  it('returns markdown copy for each uploaded video', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'yt-001',
            url: 'https://youtu.be/example',
            job: 'Instalacion de puesta a tierra para nave industrial',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.text).toContain('1) URL\nhttps://youtu.be/example');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('magnoterra.cl/contacto');
    expect(response.text).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(response.text).toContain('RIC N06');
    expect(response.text).toContain('3) Caption Instagram');
  });

  it('keeps social copy within character limits and removes forbidden claims', () => {
    const markdown = renderYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'yt-002',
          url: 'https://youtu.be/limits',
          job: `Puesta a tierra con medicion 4 Ω y certificado SEC ${'para planta minera '.repeat(80)}`,
        },
      ],
    });
    const linkedinCopy = getSection(
      markdown,
      '2) Copy LinkedIn empresa',
      '3) Caption Instagram'
    );
    const instagramCaption = getSection(markdown, '3) Caption Instagram');

    expect(linkedinCopy.length).toBeLessThanOrEqual(
      YOUTUBE_UPLOAD_BATCH_LIMITS.linkedin
    );
    expect(instagramCaption.length).toBeLessThanOrEqual(
      YOUTUBE_UPLOAD_BATCH_LIMITS.instagram
    );
    expect(markdown).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(?:ohm(?:io)?s?|omega|Ω)\b/i);
    expect(markdown).not.toMatch(/\b(?:cert(?:ificado|ificaci.n)?\s*)?SEC\b/i);
  });
});
