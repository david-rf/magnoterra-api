import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { buildYoutubeUploadBatchMarkdown } from '../src/social/youtubeUploadBatch.js';

const getSection = (markdown, startHeader, endHeader) => {
  const start = markdown.indexOf(startHeader);
  const end = endHeader ? markdown.indexOf(endHeader, start) : markdown.length;
  return markdown.slice(start + startHeader.length, end).trim();
};

describe('YouTube upload batch webhook markdown', () => {
  it('returns NO_VIDEOS when the payload is empty', () => {
    expect(buildYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [],
    })).toBe('NO_VIDEOS');
  });

  it('formats one markdown block per video with constrained social copy', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Malla puesta a tierra planta norte',
        },
        {
          video_id: 'def456',
          url: 'https://youtu.be/def456',
          job: { name: 'Medicion final edificio industrial' },
        },
      ],
    });

    const blocks = markdown.split('\n\n---\n\n');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toContain('1) URL\nhttps://youtu.be/abc123');
    expect(blocks[0]).toContain('2) Copy LinkedIn empresa');
    expect(blocks[0]).toContain('3) Caption Instagram');
    expect(blocks[1]).toContain('1) URL\nhttps://youtu.be/def456');

    for (const block of blocks) {
      const linkedInCopy = getSection(
        block,
        '2) Copy LinkedIn empresa',
        '3) Caption Instagram',
      );
      const instagramCaption = getSection(block, '3) Caption Instagram');

      expect(linkedInCopy.length).toBeLessThanOrEqual(900);
      expect(instagramCaption.length).toBeLessThanOrEqual(500);
      expect(linkedInCopy).toContain('magnoterra.cl/contacto');
      expect(linkedInCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
      expect(linkedInCopy).toContain('RIC N06 junto con la normativa aplicable');
      expect(instagramCaption).toContain('RIC N06 cuando corresponde al proyecto');
    }
  });

  it('removes restricted job claims from generated copy', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Proyecto 10 ohm con cert SEC y RIC N06',
        },
      ],
    });

    expect(markdown).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(?:ohms?|omega)\b/i);
    expect(markdown).not.toMatch(/\bcert\s*SEC\b/i);
    expect(markdown).not.toContain('con y');
    expect(markdown).toContain('RIC N06 cuando corresponde al proyecto');
  });

  it('serves only markdown from the webhook route', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'Subestacion central',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.type).toBe('text/markdown');
    expect(response.text).toContain('1) URL\nhttps://youtu.be/abc123');
    expect(response.text.trim().startsWith('{')).toBe(false);
  });

  it('serves NO_VIDEOS from the route for empty payloads', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({});

    expect(response.status).toBe(200);
    expect(response.type).toBe('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });
});
