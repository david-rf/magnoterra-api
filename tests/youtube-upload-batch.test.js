import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { formatYoutubeUploadBatchMarkdown } from '../src/social/youtubeUploadBatch.js';

const getSection = (markdown, heading) => {
  const pattern = new RegExp(`${heading}\\n([\\s\\S]*?)(?:\\n\\n\\d\\)|$)`);
  const match = markdown.match(pattern);

  return match ? match[1].trim() : '';
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
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'malla industrial para planta en Chile',
          },
          {
            video_id: 'def456',
            url: 'https://youtu.be/def456',
            job: 'revision de proyecto comercial',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.text).toContain('## Video 1');
    expect(response.text).toContain('## Video 2');
    expect(response.text).toContain('1) URL\nhttps://youtu.be/abc123');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');
    expect(response.text).toContain('magnoterra.cl/contacto');
    expect(response.text).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(response.text).toContain('RIC N06 debe evaluarse segun el alcance');
  });

  it('keeps LinkedIn and Instagram sections within their character limits', () => {
    const markdown = formatYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'proyecto '.repeat(100),
        },
      ],
    });

    const linkedInCopy = getSection(markdown, '2\\) Copy LinkedIn empresa');
    const instagramCaption = getSection(markdown, '3\\) Caption Instagram');

    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
  });

  it('removes restricted terms from payload-provided job context', () => {
    const markdown = formatYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          job: 'malla 5 Ohm con cert SEC y referencia Omega',
        },
      ],
    });

    expect(markdown).not.toMatch(/\bSEC\b/i);
    expect(markdown).not.toMatch(/Omega|Ω/i);
    expect(markdown).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(?:ohmios?|ohms?|omega|Ω)\b/i);
  });
});
