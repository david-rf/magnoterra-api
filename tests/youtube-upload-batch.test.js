import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  buildInstagramCaption,
  buildLinkedInCopy,
  renderYoutubeUploadBatchMarkdown,
} from '../src/social/youtubeUploadBatch.js';

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS for an empty payload', async () => {
    const response = await request(app).post('/api/webhooks').send({});

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('renders markdown-only copy for each video', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'yt-001',
            url: 'https://youtu.be/example',
            job: 'Mantencion de malla a tierra para planta industrial',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL\nhttps://youtu.be/example');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');
    expect(response.text).toContain('magnoterra.cl/contacto');
    expect(response.text).toContain('#PuestaATierra #Chile #MagnoTerra');
  });

  it('keeps social copy within platform limits', () => {
    const video = {
      job: 'Diagnostico y mejoramiento de puesta a tierra en instalacion comercial con requerimientos de continuidad operacional',
    };

    expect(buildLinkedInCopy(video).length).toBeLessThanOrEqual(900);
    expect(buildInstagramCaption(video).length).toBeLessThanOrEqual(500);
  });

  it('removes forbidden claims from job text', () => {
    const markdown = renderYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          url: 'https://youtu.be/restricted-claims',
          job: 'Instalacion certificacion SEC con medicion 0.5 \u03a9 y 1 ohm',
        },
      ],
    });

    expect(markdown).not.toMatch(/SEC|certificaci(?:o|\u00f3)n|certificado/i);
    expect(markdown).not.toMatch(/\u03a9|\u03c9|ohm|omega/i);
    expect(markdown).toContain('RIC N06 segun alcance');
    expect(markdown).toContain('RIC N06 se revisa segun el proyecto');
  });
});
