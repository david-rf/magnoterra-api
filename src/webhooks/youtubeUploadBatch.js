import { buildYoutubeUploadBatchMarkdown } from '../social/youtubeUploadBatchMarkdown.js';

const MARKDOWN_TYPE = 'text/markdown; charset=utf-8';

export const youtubeUploadBatchWebhook = (req, res) => {
  const event = req.body?.event;

  if (event && event !== 'youtube_upload_batch') {
    return res.status(400).type(MARKDOWN_TYPE).send('INVALID_EVENT');
  }

  const markdown = buildYoutubeUploadBatchMarkdown(req.body);
  return res.status(200).type(MARKDOWN_TYPE).send(markdown);
};

