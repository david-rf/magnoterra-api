const CONTACT_CTA = 'magnoterra.cl/contacto';
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const NO_VIDEOS_RESPONSE = 'NO_VIDEOS';
const YOUTUBE_WATCH_URL = 'https://www.youtube.com/watch?v=';

const JOB_FIELDS = [
  'job',
  'name',
  'title',
  'project',
  'project_name',
  'description',
  'location',
  'region',
  'service',
  'type',
];

const removeForbiddenClaims = (value) => value
  .replace(/\d+(?:[,.]\d+)?\s*(?:Ω|ohm(?:s|ios)?|omega)s?/gi, '')
  .replace(/\b(?:Ω|ohm(?:s|ios)?|omega)s?\b/gi, '')
  .replace(/\bcert(?:ificaci[oó]n|ificado)?\s+SEC\b/gi, '')
  .replace(/\bSEC\b/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const truncateAtWord = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  const truncated = value.slice(0, maxLength).trimEnd();
  const lastSpace = truncated.lastIndexOf(' ');

  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trimEnd();
};

const normalizeJobContext = (job) => {
  if (!job) {
    return '';
  }

  if (typeof job === 'string') {
    return truncateAtWord(removeForbiddenClaims(job), 120);
  }

  if (typeof job !== 'object') {
    return '';
  }

  const contextParts = JOB_FIELDS
    .map((field) => job[field])
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .map(removeForbiddenClaims)
    .filter(Boolean);

  return truncateAtWord([...new Set(contextParts)].join(' - '), 120);
};

const resolveVideoUrl = (video) => {
  if (typeof video.url === 'string' && video.url.trim().length > 0) {
    return video.url.trim();
  }

  if (typeof video.video_id === 'string' && video.video_id.trim().length > 0) {
    return `${YOUTUBE_WATCH_URL}${encodeURIComponent(video.video_id.trim())}`;
  }

  return 'URL no disponible';
};

const buildLinkedInCopy = (jobContext) => {
  const context = jobContext
    ? ` para ${jobContext}`
    : '';

  return [
    `Compartimos un nuevo registro en terreno de Magno Terra${context}: diagnóstico, diseño e instalación de soluciones de puesta a tierra para operaciones que necesitan continuidad y seguridad eléctrica.`,
    'Cada proyecto se evalúa según su contexto técnico; cuando aplica, el criterio RIC N06 se aborda de acuerdo con los requerimientos del proyecto.',
    `Si tu empresa necesita revisar o mejorar su sistema de puesta a tierra, conversemos en ${CONTACT_CTA}`,
    LINKEDIN_HASHTAGS,
  ].join(' ');
};

const buildInstagramCaption = (jobContext) => {
  const context = jobContext
    ? ` en ${jobContext}`
    : '';

  return [
    `Nuevo registro en terreno de Magno Terra${context}.`,
    'Evaluamos cada proyecto de puesta a tierra según sus condiciones reales y requerimientos técnicos; cuando corresponde, RIC N06 se considera de acuerdo con el proyecto.',
    `Conversemos en ${CONTACT_CTA}`,
  ].join(' ');
};

const renderVideoMarkdown = (video) => {
  const jobContext = normalizeJobContext(video.job);
  const linkedInCopy = buildLinkedInCopy(jobContext);
  const instagramCaption = buildInstagramCaption(jobContext);

  return [
    '1) URL',
    resolveVideoUrl(video),
    '',
    '2) Copy LinkedIn empresa',
    linkedInCopy,
    '',
    '3) Caption Instagram',
    instagramCaption,
  ].join('\n');
};

export const renderYouTubeUploadBatchMarkdown = (payload) => {
  const videos = Array.isArray(payload?.videos)
    ? payload.videos.filter((video) => video && typeof video === 'object')
    : [];

  if (videos.length === 0) {
    return NO_VIDEOS_RESPONSE;
  }

  return videos.map(renderVideoMarkdown).join('\n\n---\n\n');
};

export const markdownConstants = {
  CONTACT_CTA,
  LINKEDIN_HASHTAGS,
  NO_VIDEOS_RESPONSE,
};
