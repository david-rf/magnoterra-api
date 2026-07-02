export const YOUTUBE_UPLOAD_BATCH_EVENT = 'youtube_upload_batch';
export const NO_VIDEOS_RESPONSE = 'NO_VIDEOS';

const CONTACT_URL = 'magnoterra.cl/contacto';
const HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const DEFAULT_CONTEXT = 'un proyecto de puesta a tierra';

const compactWhitespace = (value) => value.replace(/\s+/g, ' ').trim();

const sanitizeCopyInput = (value) => {
  if (!value) {
    return '';
  }

  return compactWhitespace(String(value))
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:ohm(?:ios?)?|omegas?)\b/gi, '')
    .replace(/\b\d+(?:[.,]\d+)?\s*\u03a9/gi, '')
    .replace(/\b(?:ohm(?:ios?)?|omegas?)\b|\u03a9/gi, '')
    .replace(/\b(?:cert(?:ificacion|ificado)?\.?\s*)?SEC\b/gi, '')
    .replace(/\bSEC\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const truncate = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

const getJobContext = (job) => {
  if (typeof job === 'string') {
    return sanitizeCopyInput(job);
  }

  if (!job || typeof job !== 'object') {
    return '';
  }

  const fields = [
    job.title,
    job.name,
    job.service,
    job.project,
    job.location,
    job.description,
  ].filter(Boolean);

  return sanitizeCopyInput(fields.join(' - '));
};

const getVideoUrl = (video) => {
  const url = video?.url ? compactWhitespace(String(video.url)) : '';

  if (url) {
    return url;
  }

  const videoId = video?.video_id ? compactWhitespace(String(video.video_id)) : '';
  return videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : 'URL no disponible';
};

const buildLinkedInCopy = (job) => {
  const context = truncate(getJobContext(job), 120) || DEFAULT_CONTEXT;
  const copy = [
    `Nuevo video de Magno Terra: compartimos una mirada practica sobre ${context} y el cuidado de sistemas de puesta a tierra para proyectos en Chile.`,
    'En cada terreno revisamos el alcance tecnico, las condiciones reales de instalacion y la aplicacion de RIC N06 segun lo que corresponda al proyecto.',
    `Si tu empresa necesita evaluar, mantener o ejecutar una solucion de puesta a tierra, conversemos en ${CONTACT_URL}`,
    '',
    HASHTAGS,
  ].join('\n');

  return truncate(copy, 900);
};

const buildInstagramCaption = (job) => {
  const context = truncate(getJobContext(job), 90) || DEFAULT_CONTEXT;
  const caption = [
    `Nuevo video: ${context}.`,
    `Puesta a tierra con foco en terreno, seguridad operacional y criterios tecnicos aplicables a cada proyecto. Contacto: ${CONTACT_URL}`,
    '',
    HASHTAGS,
  ].join('\n');

  return truncate(caption, 500);
};

export const hasVideos = (payload = {}) => Array.isArray(payload.videos) && payload.videos.length > 0;

export const isSupportedYoutubeUploadBatch = (payload = {}) => (
  !payload.event || payload.event === YOUTUBE_UPLOAD_BATCH_EVENT
);

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  if (!hasVideos(payload)) {
    return NO_VIDEOS_RESPONSE;
  }

  return payload.videos.map((video, index) => [
    `## Video ${index + 1}`,
    '',
    '1) URL',
    getVideoUrl(video),
    '',
    '2) Copy LinkedIn empresa',
    buildLinkedInCopy(video?.job),
    '',
    '3) Caption Instagram',
    buildInstagramCaption(video?.job),
  ].join('\n')).join('\n\n---\n\n');
};
