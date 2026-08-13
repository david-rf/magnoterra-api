const CONTACT_URL = 'https://magnoterra.cl/contacto';
const HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const DEFAULT_TOPIC = 'puesta a tierra para proyectos en Chile';
const LINKEDIN_MAX_CHARS = 900;
const INSTAGRAM_MAX_CHARS = 500;

const JOB_FIELDS = [
  'title',
  'topic',
  'name',
  'summary',
  'description',
  'prompt',
];

const normalizeWhitespace = (value) => String(value).replace(/\s+/g, ' ').trim();

const trimToLimit = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  const trimmed = value.slice(0, maxLength).trimEnd();
  const lastSpace = trimmed.lastIndexOf(' ');

  return lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed;
};

const sanitizeMarketingContext = (value) => {
  const normalized = normalizeWhitespace(value)
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:ohm(?:s|ios?)?|omega|Ω)\b/gi, 'valores definidos por el diseno')
    .replace(/\bRIC\s*N\s*0?6\b/gi, 'criterios normativos aplicables segun el proyecto')
    .replace(/\b(?:certificacion|certificado|cert\.?)\s+SEC\b/gi, '')
    .replace(/\bSEC\b/gi, '')
    .replace(/[*_`[\]<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return trimToLimit(normalized, 140);
};

const getJobContext = (job) => {
  if (typeof job === 'string' || typeof job === 'number') {
    return sanitizeMarketingContext(job);
  }

  if (!job || typeof job !== 'object') {
    return '';
  }

  for (const field of JOB_FIELDS) {
    if (job[field]) {
      return sanitizeMarketingContext(job[field]);
    }
  }

  return '';
};

const getTopic = (video) => {
  const context = getJobContext(video.job);

  if (context) {
    return context;
  }

  if (video.video_id) {
    return `video ${normalizeWhitespace(video.video_id)}`;
  }

  return DEFAULT_TOPIC;
};

const buildLinkedInCopy = (topic) => trimToLimit(
  [
    `Nuevo video de Magno Terra: ${topic}.`,
    'Compartimos criterios practicos de puesta a tierra para proyectos en Chile, con foco en seguridad, continuidad operacional y decisiones tecnicas ajustadas a cada necesidad.',
    `Si necesitas evaluar o mejorar tu sistema, conversemos en ${CONTACT_URL}`,
    HASHTAGS,
  ].join(' '),
  LINKEDIN_MAX_CHARS,
);

const buildInstagramCaption = (topic) => trimToLimit(
  [
    `Nuevo video de Magno Terra: ${topic}.`,
    'Puesta a tierra para proyectos en Chile, con foco tecnico y soluciones ajustadas a cada necesidad.',
    HASHTAGS,
  ].join(' '),
  INSTAGRAM_MAX_CHARS,
);

const formatVideo = (video) => {
  const topic = getTopic(video);

  return [
    '1) URL',
    normalizeWhitespace(video.url),
    '',
    '2) Copy LinkedIn empresa',
    buildLinkedInCopy(topic),
    '',
    '3) Caption Instagram',
    buildInstagramCaption(topic),
  ].join('\n');
};

export const formatYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos)
    ? payload.videos.filter((video) => video && normalizeWhitespace(video.url))
    : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map(formatVideo).join('\n\n');
};

export const markdownLimits = {
  linkedin: LINKEDIN_MAX_CHARS,
  instagram: INSTAGRAM_MAX_CHARS,
};
