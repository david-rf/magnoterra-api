import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import routes from '../src/routes/index.js';
import {
  buildInstagramCaption,
  buildLinkedInCopy,
  buildYoutubeUploadBatchMarkdown,
} from '../src/lib/youtubeUploadBatchMarkdown.js';

describe('YouTube upload batch markdown', () => {
  it('returns NO_VIDEOS for empty payloads', () => {
    expect(buildYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [],
    })).toBe('NO_VIDEOS');
  });

  it('builds markdown for every video in the batch', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'malla de puesta a tierra industrial',
        },
        {
          video_id: 'def456',
          url: 'https://youtu.be/def456',
          job: 'mediciones preventivas',
        },
      ],
    });

    expect(markdown).toContain('### Video 1');
    expect(markdown).toContain('1) URL: https://youtu.be/abc123');
    expect(markdown).toContain('### Video 2');
    expect(markdown).toContain('1) URL: https://youtu.be/def456');
    expect(markdown).toContain('2) Copy LinkedIn empresa:');
    expect(markdown).toContain('3) Caption Instagram:');
    expect(markdown).toContain('magnoterra.cl/contacto');
    expect(markdown).toContain('#PuestaATierra #Chile #MagnoTerra');
  });

  it('keeps copy within platform limits and avoids prohibited claims', () => {
    const video = {
      url: 'https://youtu.be/abc123',
      job: 'certificacion SEC con 1.2 omega y 3 ohms para faena',
    };

    const linkedInCopy = buildLinkedInCopy(video);
    const instagramCaption = buildInstagramCaption(video);
    const combined = `${linkedInCopy}\n${instagramCaption}`;

    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
    expect(combined).not.toMatch(/\bSEC\b/i);
    expect(combined).not.toMatch(/\bomega\b/i);
    expect(combined).not.toMatch(/\bohms?\b/i);
    expect(combined).not.toMatch(/[\u03a9\u03c9]/);
    expect(combined).toContain('RIC N06 cuando corresponde segun el alcance del proyecto');
  });

  it('serves the webhook response as markdown', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', routes);

    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [{
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'tablero principal',
        }],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL: https://youtu.be/abc123');
  });
});
