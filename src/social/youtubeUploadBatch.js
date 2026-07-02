const EVENT_NAME = 'youtube_upload_batch';
const CONTACT_CTA = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const LINKEDIN_MAX_CHARS = 900;
const INSTAGRAM_MAX_CHARS = 500;
const FALLBACK_TOPIC = 'puesta a tierra con criterio tecnico';

const JOB_TEXT_FIELDS = [
  'title',
  'titulo',
  'topic',
  'tema',
  'name',
  'nombre',
  'description',
  'descripcion',
  'summary',
  'resumen',
];

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const textFromJob = (job) => {
  if (typeof job === 'string' && job.trim()) {
    return job;
  }

  if (!isPlainObject(job)) {
    return FALLBACK_TOPIC;
  }

  const matchingField = JOB_TEXT_FIELDS.find(
    (field) => typeof job[field] === 'string' && job[field].trim()
  );

  return matchingField ? job[matchingField] : FALLBACK_TOPIC;
};

const removeRestrictedClaims = (value) =>
  value
    .replace(
      /\b\d+(?:[.,]\d+)?\s*(?:(?:ohmios?|ohms?|omega|omegas)\b|[\u03a9\u03c9\u2126])/gi,
      'valores definidos por el proyecto'
    )
    .replace(/\bcert(?:ificacion|ificado|\.?)\s+SEC\b/gi, '')
    .replace(/\bRIC\s*N0?6\b/gi, 'RIC N06 condicionado al proyecto');

const sanitizeTopic = (value) => {
  const normalized = String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const sanitized = removeRestrictedClaims(normalized)
    .replace(/\s+/g, ' ')
    .trim();

  return sanitized.slice(0, 140).trim() || FALLBACK_TOPIC;
};

const videoUrl = (video) => {
  if (typeof video?.url === 'string' && video.url.trim()) {
    return video.url.trim();
  }

  if (typeof video?.video_id === 'string' && video.video_id.trim()) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(
      video.video_id.trim()
    )}`;
  }

  return '';
};

const trimToLimit = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};

const buildLinkedInCopy = (topic) =>
  trimToLimit(
    [
      `Nuevo video de Magno Terra: ${topic}.`,
      'En puesta a tierra, una buena decision combina lectura del terreno, ingenieria y ejecucion responsable. En este contenido compartimos una mirada practica para revisar soluciones con criterio tecnico, considerando que RIC N06 esta condicionado a las caracteristicas y alcance de cada proyecto.',
      `Conversemos sobre tu caso en ${CONTACT_CTA}`,
      REQUIRED_HASHTAGS,
    ].join('\n\n'),
    LINKEDIN_MAX_CHARS
  );

const buildInstagramCaption = (topic) =>
  trimToLimit(
    [
      `Nuevo video Magno Terra: ${topic}.`,
      'Puesta a tierra con criterio tecnico para revisar terreno, proyecto y normativa aplicable. RIC N06 condicionado al alcance del proyecto.',
      `Contacto: ${CONTACT_CTA}`,
      REQUIRED_HASHTAGS,
    ].join('\n\n'),
    INSTAGRAM_MAX_CHARS
  );

const markdownForVideo = (video) => {
  const topic = sanitizeTopic(textFromJob(video.job));

  return [
    '1) URL',
    videoUrl(video),
    '',
    '2) Copy LinkedIn empresa',
    buildLinkedInCopy(topic),
    '',
    '3) Caption Instagram',
    buildInstagramCaption(topic),
  ].join('\n');
};

export const isYoutubeUploadBatchEvent = (payload = {}) =>
  payload?.event === EVENT_NAME;

export const isEmptyYoutubePayload = (payload) =>
  !isPlainObject(payload) || Object.keys(payload).length === 0;

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos)
    ? payload.videos.filter((video) => isPlainObject(video) && videoUrl(video))
    : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map(markdownForVideo).join('\n\n---\n\n');
};
