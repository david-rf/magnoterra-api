import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  createInstagramCaption,
  createLinkedInCompanyCopy,
  formatYoutubeUploadBatchResponse,
} from '../src/social/youtubeUploadBatch.js';

describe('YouTube upload batch social copy', () => {
  it('returns NO_VIDEOS when the payload is empty', () => {
    expect(formatYoutubeUploadBatchResponse({})).toBe('NO_VIDEOS');
    expect(formatYoutubeUploadBatchResponse({ videos: [] })).toBe('NO_VIDEOS');
  });

  it('formats each video as markdown with URL, LinkedIn copy, and Instagram caption', () => {
    const markdown = formatYoutubeUploadBatchResponse({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Instalacion de puesta a tierra industrial',
        },
      ],
    });

    expect(markdown).toContain('## Video abc123');
    expect(markdown).toContain('1) URL\nhttps://youtu.be/abc123');
    expect(markdown).toContain('2) Copy LinkedIn empresa');
    expect(markdown).toContain('magnoterra.cl/contacto');
    expect(markdown).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(markdown).toContain('3) Caption Instagram');
  });

  it('keeps social copy within requested character limits', () => {
    const video = {
      video_id: 'abc123',
      url: 'https://youtu.be/abc123',
      job: 'Proyecto de puesta a tierra para infraestructura critica con descripcion extendida',
    };

    expect(createLinkedInCompanyCopy(video).length).toBeLessThanOrEqual(900);
    expect(createInstagramCaption(video).length).toBeLessThanOrEqual(500);
  });

  it('does not echo restricted Omega or SEC certification claims from the job text', () => {
    const video = {
      video_id: 'abc123',
      url: 'https://youtu.be/abc123',
      job: 'Certificado SEC con medicion 5 Omega y RIC N06 garantizado',
    };

    const linkedInCopy = createLinkedInCompanyCopy(video);
    const instagramCaption = createInstagramCaption(video);

    expect(linkedInCopy).not.toMatch(/\bSEC\b/i);
    expect(linkedInCopy).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(?:ohm(?:s)?|omega)\b/i);
    expect(linkedInCopy).toContain('RIC N06 se evalua segun las condiciones de cada proyecto');
    expect(instagramCaption).not.toMatch(/\bSEC\b/i);
    expect(instagramCaption).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(?:ohm(?:s)?|omega)\b/i);
  });

  it('serves the generated markdown from the API webhook endpoint', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'Instalacion de puesta a tierra industrial',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL\nhttps://youtu.be/abc123');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');
  });
});

