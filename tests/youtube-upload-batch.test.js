import express from 'express';
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import routes from '../src/routes/index.js';
import {
  buildInstagramCaption,
  buildLinkedInCopy,
  renderYoutubeUploadBatchMarkdown,
} from '../src/social/youtubeUploadBatch.js';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);
  return app;
};

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS when payload is empty', () => {
    expect(renderYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
    expect(renderYoutubeUploadBatchMarkdown({ videos: [] })).toBe('NO_VIDEOS');
  });

  it('responds with markdown for every video', async () => {
    const response = await request(createApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: { title: 'Instalacion de malla de puesta a tierra' },
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL\nhttps://youtu.be/abc123');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');
  });

  it('keeps LinkedIn and Instagram copy within requested limits', () => {
    const video = {
      url: 'https://youtu.be/grounding',
      job: {
        title:
          'Medicion 5 Omega con certificacion SEC para RIC N06 en proyecto industrial',
      },
    };

    const linkedinCopy = buildLinkedInCopy(video);
    const instagramCaption = buildInstagramCaption(video);

    expect(linkedinCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
    expect(linkedinCopy).toContain('magnoterra.cl/contacto');
    expect(linkedinCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(linkedinCopy).toContain(
      'RIC N06 debe validarse según las condiciones de cada proyecto'
    );
    expect(instagramCaption).toContain(
      'RIC N06 aplica según el alcance y las condiciones de cada proyecto'
    );
    expect(`${linkedinCopy}\n${instagramCaption}`).not.toMatch(
      /omega|ohm|Ω|SEC/i
    );
  });

  it('falls back to the YouTube watch URL when only video_id is available', () => {
    const markdown = renderYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [{ video_id: 'abc 123', job: 'Puesta a tierra' }],
    });

    expect(markdown).toContain('https://www.youtube.com/watch?v=abc%20123');
  });
});
