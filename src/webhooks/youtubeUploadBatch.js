import { buildYoutubeUploadBatchMarkdown } from '../social/youtubeUploadBatch.js';

export const youtubeUploadBatchWebhook = (req, res) => {
  const markdown = buildYoutubeUploadBatchMarkdown(req.body);

  res.status(200).type('text/markdown').send(markdown);
};
