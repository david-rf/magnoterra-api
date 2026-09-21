import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  buildInstagramCaption,
  buildLinkedInCopy,
  buildYoutubeUploadBatchMarkdown,
  limits,
} from '../src/lib/youtubeSocialCopy.js';

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS when payload has no videos', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({ event: 'youtube_upload_batch', videos: [] });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('returns markdown copy for each uploaded video', async () => {
    const video = {
      video_id: 'yt_123',
      url: 'https://youtu.be/example',
      job: {
        title: 'Proyecto industrial 0,5 Ω certificado SEC',
        location: 'Santiago',
      },
    };

    const response = await request(app)
      .post('/api/webhooks')
      .send({ event: 'youtube_upload_batch', videos: [video] });

    expect(response.status).toBe(200);
    expect(response.text).toContain('1) URL: https://youtu.be/example');
    expect(response.text).toContain('2) Copy LinkedIn empresa:');
    expect(response.text).toContain('3) Caption Instagram:');
    expect(response.text).toContain('magnoterra.cl/contacto');
    expect(response.text).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(response.text).toContain('RIC N06 condicionado al proyecto');
    expect(response.text).not.toMatch(
      /Ω|SEC|\b\d+(?:[.,]\d+)?\s*(?:ohm|omega)/i
    );
  });

  it('keeps platform copy within requested limits', () => {
    const video = {
      url: 'https://youtu.be/limit-test',
      job: 'Proyecto '.repeat(100),
    };

    expect(buildLinkedInCopy(video).length).toBeLessThanOrEqual(
      limits.linkedIn
    );
    expect(buildInstagramCaption(video).length).toBeLessThanOrEqual(
      limits.instagram
    );
  });

  it('returns only NO_VIDEOS for an empty payload', () => {
    expect(buildYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
  });
});
