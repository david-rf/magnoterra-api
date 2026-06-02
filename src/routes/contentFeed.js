import express from 'express';
import { asyncHandler } from '../middlewares/error.js';
import {
  getAutomationStatus,
  getPublishedFeed,
} from '../content-feed/service.js';

const router = express.Router();

router.get(
  '/status',
  asyncHandler(async (req, res) => {
    const status = await getAutomationStatus();
    res.json(status);
  }),
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const feed = await getPublishedFeed();
    res.json(feed);
  }),
);

export default router;
