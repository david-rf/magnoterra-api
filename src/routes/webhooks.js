import express from 'express';
import { buildYoutubeUploadBatchMarkdown } from '../lib/youtubeSocialCopy.js';

const router = express.Router();

router.post('/', (req, res) => {
  const markdown = buildYoutubeUploadBatchMarkdown(req.body);

  res.type('text/markdown').send(markdown);
});

export default router;
