import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  buildInstagramCaption,
  buildLinkedInCopy,
  buildYoutubeUploadBatchMarkdown,
} from '../src/social/youtubeUploadBatchMarkdown.js';

const forbiddenPatterns = [
  /\b\d+(?:[.,]\d+)?\s*(?:ohmios?|ohms?|omega|\u03a9)\b/i,
  /\b(?:certificaci[o\u00f3]n|certificado|cert)\s+SEC\b/i,
];

describe('YouTube upload batch social copy', () => {
  it('returns NO_VIDEOS when payload is empty or has no videos', () => {
    expect(buildYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(
      buildYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch' })
    ).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({ videos: [] })).toBe('NO_VIDEOS');
  });

  it('builds markdown for every video with URLs and social copy', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'mantenimiento de malla en planta industrial',
        },
        {
          video_id: 'def456',
          url: 'https://youtu.be/def456',
          job: {
            service: 'medicion y revision',
            location: 'Region Metropolitana',
          },
        },
      ],
    });

    expect(markdown).toContain('https://youtu.be/abc123');
    expect(markdown).toContain('https://youtu.be/def456');
    expect(markdown).toContain('Copy LinkedIn empresa');
    expect(markdown).toContain('Caption Instagram');
    expect(markdown).toContain('magnoterra.cl/contacto');
    expect(markdown).toContain('#PuestaATierra #Chile #MagnoTerra');
  });

  it('keeps copy within channel limits and avoids restricted claims', () => {
    const video = {
      url: 'https://youtu.be/restricted',
      job: 'revision con 2 ohms y certificacion SEC para RIC N06',
    };

    const linkedInCopy = buildLinkedInCopy(video);
    const instagramCaption = buildInstagramCaption(video);

    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
    expect(linkedInCopy).toContain('RIC N06');
    expect(linkedInCopy).toContain(
      'segun las caracteristicas y exigencias de cada proyecto'
    );
    expect(instagramCaption).not.toContain('RIC N06');

    for (const pattern of forbiddenPatterns) {
      expect(linkedInCopy).not.toMatch(pattern);
      expect(instagramCaption).not.toMatch(pattern);
    }
  });

  it('responds with markdown from the webhook endpoint', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'instalacion de puesta a tierra',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('https://youtu.be/abc123');
    expect(response.text).toContain('Copy LinkedIn empresa');
    expect(response.text).toContain('Caption Instagram');
  });

  it('responds NO_VIDEOS for empty webhook payloads', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({ event: 'youtube_upload_batch', videos: [] });

    expect(response.status).toBe(200);
    expect(response.text).toBe('NO_VIDEOS');
  });
});
