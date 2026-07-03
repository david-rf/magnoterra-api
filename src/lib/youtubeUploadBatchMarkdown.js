const CONTACT_CTA = 'magnoterra.cl/contacto';
const REQUIRED_LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const NO_VIDEOS_RESPONSE = 'NO_VIDEOS';
const YOUTUBE_WATCH_URL = 'https://www.youtube.com/watch?v=';
const LINKEDIN_LIMIT = 900;
const INSTAGRAM_LIMIT = 500;
const JOB_CONTEXT_LIMIT = 160;

const JOB_TEXT_FIELDS = [
  'title',
  'name',
  'project',
  'project_name',
  'service',
  'type',
  'location',
  'region',
  'description',
  'summary',
];

const normalizeWhitespace = (value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();

const truncateAtWord = (value, maxLength) => {
  const normalized = normalizeWhitespace(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const sliced = normalized.slice(0, maxLength - 3).trimEnd();
  const lastSpace = sliced.lastIndexOf(' ');
  const truncated = lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced;

  return `${truncated.replace(/[.,;:!?-]+$/, '')}...`;
};

export const sanitizeRestrictedClaims = (value) =>
  normalizeWhitespace(value)
    .replace(
      /\b\d+(?:[.,]\d+)?\s*(?:ohm(?:io)?s?|omega?s?|[\u03a9\u03c9])\b/gi,
      ''
    )
    .replace(/\b(?:ohm(?:io)?s?|omega?s?|[\u03a9\u03c9])\b/gi, '')
    .replace(
      /\bcert(?:ificacion|ificaci\u00f3n|ificado|\.?)?\s*(?:de\s*)?SEC\b/gi,
      ''
    )
    .replace(/\bSEC\b/gi, '')
    .replace(/\bRIC\s*N\s*0?6\b/gi, 'RIC N06 segun corresponda al proyecto')
    .replace(/\bRICN0?6\b/gi, 'RIC N06 segun corresponda al proyecto')
    .replace(/\s{2,}/g, ' ')
    .trim();

const extractJobContext = (job) => {
  if (typeof job === 'string' || typeof job === 'number') {
    return sanitizeRestrictedClaims(job);
  }

  if (!job || typeof job !== 'object' || Array.isArray(job)) {
    return '';
  }

  const contextParts = JOB_TEXT_FIELDS.map((field) => job[field])
    .filter((value) => typeof value === 'string' || typeof value === 'number')
    .map(sanitizeRestrictedClaims)
    .filter(Boolean);

  return [...new Set(contextParts)].join(' - ');
};

const resolveVideoUrl = (video) => {
  const url = normalizeWhitespace(video?.url);

  if (url) {
    return url;
  }

  const videoId = normalizeWhitespace(video?.video_id);

  if (videoId) {
    return `${YOUTUBE_WATCH_URL}${encodeURIComponent(videoId)}`;
  }

  return 'URL no disponible';
};

export const buildLinkedInCopy = (video) => {
  const jobContext = truncateAtWord(
    extractJobContext(video?.job),
    JOB_CONTEXT_LIMIT
  );
  const context = jobContext ? ` para ${jobContext}` : '';
  const copy = [
    `Compartimos un nuevo video de Magno Terra${context}: trabajo en terreno, diagnostico tecnico y soluciones de puesta a tierra para empresas que necesitan continuidad operacional y seguridad electrica.`,
    'Cada proyecto se revisa segun sus condiciones reales y requerimientos tecnicos; RIC N06 se considera segun corresponda al proyecto.',
    `Si tu empresa necesita evaluar o mejorar su sistema de puesta a tierra, conversemos en ${CONTACT_CTA}`,
    REQUIRED_LINKEDIN_HASHTAGS,
  ].join(' ');

  return truncateAtWord(copy, LINKEDIN_LIMIT);
};

export const buildInstagramCaption = (video) => {
  const jobContext = truncateAtWord(
    extractJobContext(video?.job),
    JOB_CONTEXT_LIMIT
  );
  const context = jobContext ? ` en ${jobContext}` : '';
  const caption = [
    `Nuevo registro en terreno de Magno Terra${context}.`,
    'Puesta a tierra evaluada segun las condiciones del proyecto y sus requerimientos tecnicos.',
    `Consultas en ${CONTACT_CTA}`,
  ].join(' ');

  return truncateAtWord(caption, INSTAGRAM_LIMIT);
};

const renderVideoMarkdown = (video) =>
  [
    '1) URL',
    resolveVideoUrl(video),
    '',
    '2) Copy LinkedIn empresa',
    buildLinkedInCopy(video),
    '',
    '3) Caption Instagram',
    buildInstagramCaption(video),
  ].join('\n');

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos)
    ? payload.videos.filter((video) => video && typeof video === 'object')
    : [];

  if (videos.length === 0) {
    return NO_VIDEOS_RESPONSE;
  }

  return videos.map(renderVideoMarkdown).join('\n\n---\n\n');
};

export const youtubeUploadBatchConstants = {
  contactCta: CONTACT_CTA,
  requiredLinkedInHashtags: REQUIRED_LINKEDIN_HASHTAGS,
  noVideosResponse: NO_VIDEOS_RESPONSE,
};

export const youtubeUploadBatchLimits = {
  linkedIn: LINKEDIN_LIMIT,
  instagram: INSTAGRAM_LIMIT,
};
