import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  buildInstagramCaption,
  buildLinkedInCopy,
  buildYoutubeUploadBatchMarkdown,
} from '../src/social/youtubeUploadBatch.js';

const validVideo = {
  video_id: 'abc123',
  url: 'https://youtu.be/abc123',
  job: 'Medicion de malla a tierra 5 ohm con certificado SEC y RIC N06',
};

describe('YouTube upload batch markdown generator', () => {
  it('returns NO_VIDEOS when the payload has no videos', () => {
    expect(buildYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch' })).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch', videos: [] })).toBe('NO_VIDEOS');
  });

  it('builds markdown for each video with safe social copy', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [validVideo],
    });

    expect(markdown).toContain('1) URL: https://youtu.be/abc123');
    expect(markdown).toContain('2) Copy LinkedIn empresa:');
    expect(markdown).toContain('3) Caption Instagram:');
    expect(markdown).toContain('magnoterra.cl/contacto');
    expect(markdown).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(markdown).not.toMatch(/\b(?:ohmios?|ohms?|omega|SEC)\b/i);
    expect(markdown).not.toMatch(/\bRIC\s*N[\u00b0\u00bao.]?\s*0?6\b/i);
  });

  it('keeps LinkedIn and Instagram copy within the requested limits', () => {
    const longVideo = {
      ...validVideo,
      job: `${validVideo.job} ${'diagnostico y mantenimiento preventivo '.repeat(20)}`,
    };

    expect(buildLinkedInCopy(longVideo).length).toBeLessThanOrEqual(900);
    expect(buildInstagramCaption(longVideo).length).toBeLessThanOrEqual(500);
  });
});

describe('YouTube upload batch webhook route', () => {
  it('responds with markdown for a youtube upload batch payload', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [validVideo],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/markdown/);
    expect(response.text).toContain('## Video 1');
    expect(response.text).toContain('https://youtu.be/abc123');
  });

  it('responds NO_VIDEOS for an empty payload', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({});

    expect(response.status).toBe(200);
    expect(response.text).toBe('NO_VIDEOS');
  });
});
