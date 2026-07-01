const EVENT_NAME = 'youtube_upload_batch';
const CONTACT_CTA = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const LINKEDIN_MAX_LENGTH = 900;
const INSTAGRAM_MAX_LENGTH = 500;
const FALLBACK_TOPIC = 'sistemas de puesta a tierra para proyectos en Chile';
const YOUTUBE_WATCH_URL = 'https://www.youtube.com/watch?v=';

const JOB_TEXT_KEYS = [
  'title',
  'name',
  'topic',
  'summary',
  'description',
  'service',
  'project',
  'area',
  'region',
];

const collapseWhitespace = (value) => String(value).replace(/\s+/g, ' ').trim();

const truncate = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

const extractJobText = (job) => {
  if (typeof job === 'string' || typeof job === 'number') {
    return String(job);
  }

  if (job && typeof job === 'object' && !Array.isArray(job)) {
    return JOB_TEXT_KEYS.map((key) => job[key])
      .filter((value) => typeof value === 'string' || typeof value === 'number')
      .join(' - ');
  }

  return '';
};

export const sanitizeMarketingText = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  return collapseWhitespace(value)
    .replace(
      /\b\d+(?:[.,]\d+)?\s*(?:ohm(?:s|ios?)?|omega|[\u03a9\u03c9])\b/gi,
      'medicion tecnica'
    )
    .replace(
      /\b(?:cert(?:ificacion|ificado)?|cert\.?)\s*(?:de\s*)?SEC\b/gi,
      'cumplimiento normativo'
    )
    .replace(/\bSEC\b/gi, 'normativa aplicable')
    .replace(/\bRIC\s*N\s*0?6\b/gi, 'RIC N06 segun corresponda al proyecto')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
};

export const getVideoTopic = (video) => {
  const topic = sanitizeMarketingText(extractJobText(video?.job));

  return truncate(topic || FALLBACK_TOPIC, 150);
};

export const resolveVideoUrl = (video) => {
  if (typeof video?.url === 'string' && video.url.trim()) {
    return video.url.trim();
  }

  if (typeof video?.video_id === 'string' && video.video_id.trim()) {
    return `${YOUTUBE_WATCH_URL}${encodeURIComponent(video.video_id.trim())}`;
  }

  return '';
};

export const buildLinkedInCopy = (video) => {
  const topic = getVideoTopic(video);
  const copy = [
    `Nuevo video de Magno Terra: ${topic}.`,
    'La puesta a tierra debe evaluarse segun terreno, continuidad operacional, alcance del proyecto y normativa aplicable.',
    'RIC N06 se revisa solo segun corresponda al proyecto.',
    `Si necesitas apoyo en diagnostico, mantencion o mejora de sistemas de puesta a tierra, conversemos: ${CONTACT_CTA}`,
    '',
    REQUIRED_HASHTAGS,
  ].join('\n');

  return truncate(copy, LINKEDIN_MAX_LENGTH);
};

export const buildInstagramCaption = (video) => {
  const topic = getVideoTopic(video);
  const caption = [
    `Nuevo video: ${topic}.`,
    'Puesta a tierra para proyectos en Chile, con foco tecnico y RIC N06 solo cuando corresponda.',
    REQUIRED_HASHTAGS,
  ].join(' ');

  return truncate(caption, INSTAGRAM_MAX_LENGTH);
};

const renderVideoMarkdown = (video) => {
  const url = resolveVideoUrl(video);

  if (!url) {
    return '';
  }

  return [
    '1) URL',
    url,
    '',
    '2) Copy LinkedIn empresa',
    buildLinkedInCopy(video),
    '',
    '3) Caption Instagram',
    buildInstagramCaption(video),
  ].join('\n');
};

export const isYoutubeUploadBatchEvent = (payload) =>
  !payload?.event || payload.event === EVENT_NAME;

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];
  const renderedVideos = videos.map(renderVideoMarkdown).filter(Boolean);

  return renderedVideos.length > 0
    ? renderedVideos.join('\n\n---\n\n')
    : 'NO_VIDEOS';
};

export const youtubeUploadBatchLimits = {
  linkedIn: LINKEDIN_MAX_LENGTH,
  instagram: INSTAGRAM_MAX_LENGTH,
};

export const youtubeUploadBatchConstants = {
  eventName: EVENT_NAME,
  contactCta: CONTACT_CTA,
  requiredHashtags: REQUIRED_HASHTAGS,
};
