export const YOUTUBE_UPLOAD_BATCH_EVENT = 'youtube_upload_batch';

const CONTACT_URL = 'https://magnoterra.cl/contacto';
const HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const DEFAULT_JOB_CONTEXT = 'un proyecto de puesta a tierra en terreno';
const LINKEDIN_LIMIT = 900;
const INSTAGRAM_LIMIT = 500;
const JOB_CONTEXT_LIMIT = 140;

const cleanText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:Ω|ohms?|omega)\b/gi, '')
    .replace(/\b(?:Ω|ohms?|omega)\b/gi, '')
    .replace(/\bcert(?:\.|ificacion|ificación)?\s*SEC\b/gi, '')
    .replace(/\bSEC\b/g, '')
    .replace(/\bRIC\s*N0?6\b/gi, '')
    .replace(/[<>{}]/g, '')
    .replaceAll('[', '')
    .replaceAll(']', '')
    .replace(/\s+/g, ' ')
    .trim();
};

const truncateText = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};

const extractJobContext = (job) => {
  if (typeof job === 'string') {
    return cleanText(job);
  }

  if (!job || typeof job !== 'object') {
    return '';
  }

  return cleanText([
    job.title,
    job.name,
    job.type,
    job.description,
    job.location,
  ].filter(Boolean).join(' - '));
};

const getVideoUrl = (video) => {
  const url = cleanText(video?.url);

  if (url) {
    return url;
  }

  const videoId = cleanText(video?.video_id);

  if (videoId) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  }

  return 'URL no disponible';
};

const getJobContext = (video) => {
  const context = extractJobContext(video?.job);
  return truncateText(context || DEFAULT_JOB_CONTEXT, JOB_CONTEXT_LIMIT);
};

const buildLinkedInCopy = (video) => {
  const jobContext = getJobContext(video);
  const copy = [
    `Nuevo video de Magno Terra: ${jobContext}.`,
    'Mostramos como abordamos la puesta a tierra con diagnostico, planificacion y ejecucion responsable para instalaciones en Chile.',
    'Cada proyecto se evalua segun sus condiciones tecnicas y normativas; cuando corresponde, revisamos criterios como RIC N06 segun el alcance del proyecto.',
    `Conversemos sobre tu sistema de puesta a tierra: ${CONTACT_URL}`,
    '',
    HASHTAGS,
  ].join('\n');

  return truncateText(copy, LINKEDIN_LIMIT);
};

const buildInstagramCaption = (video) => {
  const jobContext = getJobContext(video);
  const caption = [
    `Nuevo video: ${jobContext}.`,
    `Puesta a tierra con enfoque tecnico, diagnostico y ejecucion responsable para cada proyecto. Mira el video y conversemos: ${CONTACT_URL}`,
    '',
    HASHTAGS,
  ].join('\n');

  return truncateText(caption, INSTAGRAM_LIMIT);
};

const formatVideoMarkdown = (video, index) => [
  `### Video ${index + 1}`,
  '',
  '1) URL',
  getVideoUrl(video),
  '',
  '2) Copy LinkedIn empresa',
  buildLinkedInCopy(video),
  '',
  '3) Caption Instagram',
  buildInstagramCaption(video),
].join('\n');

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map(formatVideoMarkdown).join('\n\n---\n\n');
};
