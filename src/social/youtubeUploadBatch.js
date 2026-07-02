const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const CONTACT_CTA = 'magnoterra.cl/contacto';
const MAX_LINKEDIN_CHARS = 900;
const MAX_INSTAGRAM_CHARS = 500;

const FORBIDDEN_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:ohm|ohms|omega|[\u03a9\u03c9])(?!\w)/gi,
  /\b(?:ohm|ohms|omega)\b|[\u03a9\u03c9]/gi,
  /\b(?:cert(?:ificado|ificacion)?\s*)?SEC\b/gi,
];

const normalizeWhitespace = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const stripForbiddenClaims = (value) => {
  let result = normalizeWhitespace(value);

  for (const pattern of FORBIDDEN_PATTERNS) {
    result = result.replace(pattern, '').replace(/\s+/g, ' ').trim();
  }

  return result.replace(/\s+([,.])/g, '$1');
};

const truncateText = (value, maxLength) => {
  const text = normalizeWhitespace(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

const getJobText = (job) => {
  if (!job) {
    return 'nuevo contenido tecnico sobre puesta a tierra';
  }

  if (typeof job === 'string') {
    return stripForbiddenClaims(job);
  }

  if (Array.isArray(job)) {
    return stripForbiddenClaims(job.join(' '));
  }

  if (typeof job === 'object') {
    const preferredFields = [
      'title',
      'name',
      'project',
      'project_name',
      'service',
      'description',
      'summary',
      'location',
      'comuna',
      'region',
    ];

    const parts = preferredFields
      .map((field) => job[field])
      .filter((fieldValue) => typeof fieldValue === 'string' && fieldValue.trim().length > 0);

    return stripForbiddenClaims(parts.join(' '));
  }

  return '';
};

const getVideoUrl = (video) => {
  const url = normalizeWhitespace(video?.url);

  if (url) {
    return url;
  }

  const videoId = normalizeWhitespace(video?.video_id);

  if (videoId) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  }

  return 'URL no disponible';
};

const buildLinkedInCopy = (job) => {
  const context = truncateText(getJobText(job), 180) || 'nuevo contenido tecnico sobre puesta a tierra';
  const copy = [
    `Nuevo video Magno Terra: ${context}.`,
    'Acompanamos a empresas y proyectos en Chile con soluciones de puesta a tierra planificadas desde terreno, documentacion tecnica y coordinacion con las condiciones reales de cada obra.',
    'La revision normativa, incluyendo RIC N06 cuando corresponda, siempre debe evaluarse segun el proyecto.',
    `Conversemos sobre tu requerimiento: ${CONTACT_CTA}`,
    '',
    LINKEDIN_HASHTAGS,
  ].join('\n');

  return truncateText(stripForbiddenClaims(copy), MAX_LINKEDIN_CHARS);
};

const buildInstagramCaption = (job) => {
  const context = truncateText(getJobText(job), 120) || 'nuevo contenido tecnico sobre puesta a tierra';
  const caption = [
    `Nuevo video: ${context}.`,
    `Puesta a tierra para proyectos en Chile, revisada segun las condiciones de cada obra. Contacto: ${CONTACT_CTA}`,
  ].join(' ');

  return truncateText(stripForbiddenClaims(caption), MAX_INSTAGRAM_CHARS);
};

export const formatYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos
    .map((video) => [
      `1) URL: ${getVideoUrl(video)}`,
      `2) Copy LinkedIn empresa:\n${buildLinkedInCopy(video?.job)}`,
      `3) Caption Instagram:\n${buildInstagramCaption(video?.job)}`,
    ].join('\n\n'))
    .join('\n\n---\n\n');
};

export const YOUTUBE_UPLOAD_BATCH_EVENT = 'youtube_upload_batch';
