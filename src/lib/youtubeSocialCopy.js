const CONTACT_CTA = 'magnoterra.cl/contacto';
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const LINKEDIN_MAX_LENGTH = 900;
const INSTAGRAM_MAX_LENGTH = 500;

const FALLBACK_TOPIC = 'puesta a tierra para proyectos en Chile';

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

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};

export const sanitizeMarketingText = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  return collapseWhitespace(value)
    .replace(
      /\b\d+(?:[.,]\d+)?\s*(?:\u03a9|ohm(?:s|ios)?|omega)\b/gi,
      'medicion tecnica'
    )
    .replace(
      /\b(?:certificaci(?:o|\u00f3)n|certificado|cert\.?)\s*(?:de\s*)?SEC\b/gi,
      'cumplimiento normativo'
    )
    .replace(/\bSEC\b/gi, 'normativa aplicable')
    .replace(/\b(?:\u03a9|ohm(?:s|ios)?|omega)\b/gi, 'resistencia')
    .trim();
};

const extractObjectJobText = (job) => {
  const values = JOB_TEXT_KEYS.map((key) => job[key]).filter(
    (value) => typeof value === 'string' || typeof value === 'number'
  );

  return values.join(' - ');
};

export const extractVideoTopic = (video) => {
  const job = video?.job;
  let rawTopic = '';

  if (typeof job === 'string' || typeof job === 'number') {
    rawTopic = job;
  } else if (job && typeof job === 'object' && !Array.isArray(job)) {
    rawTopic = extractObjectJobText(job);
  }

  const sanitizedTopic = sanitizeMarketingText(rawTopic);

  return truncate(sanitizedTopic || FALLBACK_TOPIC, 170);
};

const resolveVideoUrl = (video) => {
  if (typeof video?.url === 'string' && video.url.trim()) {
    return video.url.trim();
  }

  if (typeof video?.video_id === 'string' && video.video_id.trim()) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(video.video_id.trim())}`;
  }

  return '';
};

export const buildLinkedInCopy = (video) => {
  const topic = extractVideoTopic(video);
  const ending = `Conversemos en ${CONTACT_CTA}. ${LINKEDIN_HASHTAGS}`;
  const body = [
    `En Magno Terra compartimos un nuevo video sobre ${topic}.`,
    'La puesta a tierra se disena desde el contexto del proyecto: terreno, continuidad operacional y normativa aplicable.',
    'RIC N06 se evalua segun corresponda al proyecto.',
  ].join(' ');
  const availableBodyLength = LINKEDIN_MAX_LENGTH - ending.length - 1;

  return `${truncate(body, availableBodyLength)} ${ending}`;
};

export const buildInstagramCaption = (video) => {
  const topic = extractVideoTopic(video);
  const caption = [
    `Nuevo video: ${topic}.`,
    'Puesta a tierra pensada para cada proyecto, con foco tecnico, terreno y RIC N06 solo cuando corresponda.',
    LINKEDIN_HASHTAGS,
  ].join(' ');

  return truncate(caption, INSTAGRAM_MAX_LENGTH);
};

export const buildYoutubeUploadBatchMarkdown = (payload) => {
  const videos = Array.isArray(payload?.videos)
    ? payload.videos.filter((video) => resolveVideoUrl(video))
    : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos
    .map((video) => {
      const url = resolveVideoUrl(video);
      const linkedInCopy = buildLinkedInCopy(video);
      const instagramCaption = buildInstagramCaption(video);

      return [
        '1) URL',
        url,
        '',
        '2) Copy LinkedIn empresa',
        linkedInCopy,
        '',
        '3) Caption Instagram',
        instagramCaption,
      ].join('\n');
    })
    .join('\n\n---\n\n');
};

export {
  CONTACT_CTA,
  LINKEDIN_HASHTAGS,
  LINKEDIN_MAX_LENGTH,
  INSTAGRAM_MAX_LENGTH,
};
