const EVENT_NAME = 'youtube_upload_batch';
const CONTACT_CTA = 'magnoterra.cl/contacto';
const HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const LINKEDIN_MAX_CHARS = 900;
const INSTAGRAM_MAX_CHARS = 500;

const fallbackTopic = 'puesta a tierra con criterio tecnico';

const textFromJob = (job) => {
  if (!job) {
    return fallbackTopic;
  }

  if (typeof job === 'string') {
    return job;
  }

  if (typeof job !== 'object') {
    return fallbackTopic;
  }

  const preferredFields = ['title', 'titulo', 'topic', 'tema', 'name', 'nombre', 'description'];
  const field = preferredFields.find((key) => typeof job[key] === 'string' && job[key].trim());

  return field ? job[field] : fallbackTopic;
};

const sanitizeTopic = (value) => {
  const normalized = String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const withoutRestrictedClaims = normalized
    .replace(
      /\b\d+(?:[.,]\d+)?\s*(?:(?:ohmios?|ohms?|omega|omegas)\b|[\u03a9\u03c9\u2126])/gi,
      'valores definidos por el proyecto',
    )
    .replace(/\bcert(?:ificacion|ificado|\.?)\s+SEC\b/gi, 'documentacion tecnica aplicable')
    .replace(/\bRIC\s*N0?6\b/gi, 'RIC N06 segun alcance del proyecto');

  return withoutRestrictedClaims.slice(0, 140).trim() || fallbackTopic;
};

const videoUrl = (video) => {
  if (typeof video?.url === 'string' && video.url.trim()) {
    return video.url.trim();
  }

  if (typeof video?.video_id === 'string' && video.video_id.trim()) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(video.video_id.trim())}`;
  }

  return '';
};

const trimToLimit = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};

const linkedInCopy = (topic) =>
  trimToLimit(
    [
      `Nuevo video de Magno Terra: ${topic}.`,
      'En proyectos de puesta a tierra, cada decision debe partir por el terreno, la ingenieria y la ejecucion en obra. En este contenido compartimos una mirada practica para evaluar soluciones con criterio tecnico, considerando que RIC N06 aplica segun las caracteristicas y alcance de cada proyecto.',
      `Necesitas revisar tu caso? Escribenos en ${CONTACT_CTA}`,
      HASHTAGS,
    ].join('\n\n'),
    LINKEDIN_MAX_CHARS,
  );

const instagramCaption = (topic) =>
  trimToLimit(
    [
      `Nuevo video Magno Terra: ${topic}.`,
      'Puesta a tierra con criterio tecnico, considerando terreno, proyecto y normativa aplicable. RIC N06 aplica segun cada caso.',
      `Contacto: ${CONTACT_CTA}`,
      HASHTAGS,
    ].join('\n\n'),
    INSTAGRAM_MAX_CHARS,
  );

const markdownForVideo = (video, index) => {
  const topic = sanitizeTopic(textFromJob(video.job));

  return [
    `### Video ${index + 1}`,
    '',
    `1. URL: ${videoUrl(video)}`,
    '2. Copy LinkedIn empresa:',
    '',
    linkedInCopy(topic),
    '',
    '3. Caption Instagram:',
    '',
    instagramCaption(topic),
  ].join('\n');
};

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos)
    ? payload.videos.filter((video) => video && (videoUrl(video) || video.job))
    : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map(markdownForVideo).join('\n\n---\n\n');
};

export const isYoutubeUploadBatchEvent = (payload = {}) => payload?.event === EVENT_NAME;
