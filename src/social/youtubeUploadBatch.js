const EVENT_NAME = 'youtube_upload_batch';
const CONTACT_CTA = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const LINKEDIN_LIMIT = 900;
const INSTAGRAM_LIMIT = 500;

const JOB_FIELDS = [
  'title',
  'name',
  'project',
  'service',
  'location',
  'city',
  'region',
  'description',
];

const toCleanText = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:ohm(?:s)?|omega|[ΩΩ])\b/gi, '')
    .replace(/[ΩΩ]/g, '')
    .replace(/\bohm(?:s)?\b/gi, '')
    .replace(/\bomega\b/gi, '')
    .replace(/\bcert(?:ificacion|ification|ificado|\.?)?\s*SEC\b/gi, '')
    .replace(/\bSEC\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const summarizeJob = (job) => {
  if (!job) {
    return '';
  }

  if (typeof job !== 'object' || Array.isArray(job)) {
    return toCleanText(job);
  }

  return JOB_FIELDS
    .map((field) => toCleanText(job[field]))
    .filter(Boolean)
    .join(' - ');
};

const truncateAtWord = (text, limit) => {
  if (text.length <= limit) {
    return text;
  }

  if (limit <= 3) {
    return text.slice(0, limit);
  }

  const truncated = text.slice(0, limit - 3).trimEnd();
  const withoutPartialWord = truncated.replace(/\s+\S*$/, '').trimEnd();

  return `${withoutPartialWord || truncated}...`;
};

const withRequiredTail = (body, tail, limit) => {
  const cleanBody = toCleanText(body);
  const separator = cleanBody ? '\n\n' : '';
  const availableBodyLength = limit - separator.length - tail.length;

  if (availableBodyLength <= 0) {
    return truncateAtWord(tail, limit);
  }

  return `${truncateAtWord(cleanBody, availableBodyLength)}${separator}${tail}`;
};

const buildContextSentence = (job) => {
  const summary = summarizeJob(job);

  if (!summary) {
    return 'Nuevo video de Magno Terra sobre soluciones de puesta a tierra para proyectos en Chile.';
  }

  return `Nuevo video de Magno Terra: ${summary}.`;
};

export const buildLinkedInCompanyCopy = (job) => {
  const body = [
    buildContextSentence(job),
    'Compartimos criterios practicos para planificar, ejecutar y revisar sistemas de puesta a tierra con foco en trazabilidad tecnica y decisiones ajustadas al terreno.',
    'La aplicabilidad de RIC N06 se revisa segun las condiciones de cada proyecto.',
  ].join(' ');
  const tail = `Conversemos en ${CONTACT_CTA}\n\n${REQUIRED_HASHTAGS}`;

  return withRequiredTail(body, tail, LINKEDIN_LIMIT);
};

export const buildInstagramCaption = (job) => {
  const body = [
    buildContextSentence(job),
    'Puesta a tierra con mirada tecnica y ejecucion en terreno.',
    'RIC N06 aplica segun las condiciones de cada proyecto.',
  ].join(' ');

  return truncateAtWord(toCleanText(body), INSTAGRAM_LIMIT);
};

const resolveVideoUrl = (video) => {
  if (!video || typeof video !== 'object') {
    return '';
  }

  const url = toCleanText(video.url);

  if (url) {
    return url;
  }

  const videoId = toCleanText(video.video_id);

  return videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : '';
};

const formatVideoMarkdown = (video) => {
  const url = resolveVideoUrl(video);

  if (!url) {
    return '';
  }

  return [
    '1. URL',
    url,
    '',
    '2. Copy LinkedIn empresa',
    buildLinkedInCompanyCopy(video.job),
    '',
    '3. Caption Instagram',
    buildInstagramCaption(video.job),
  ].join('\n');
};

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload.videos) ? payload.videos : [];
  const blocks = videos
    .map((video) => formatVideoMarkdown(video))
    .filter(Boolean);

  return blocks.length ? blocks.join('\n\n---\n\n') : 'NO_VIDEOS';
};

export { EVENT_NAME, LINKEDIN_LIMIT, INSTAGRAM_LIMIT };
