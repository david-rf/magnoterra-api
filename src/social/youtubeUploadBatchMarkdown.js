const CONTACT_URL = 'https://magnoterra.cl/contacto';
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const INSTAGRAM_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const DEFAULT_JOB = 'sistemas de puesta a tierra';
const YOUTUBE_WATCH_URL = 'https://www.youtube.com/watch?v=';

const sanitizeInlineText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/\s+/g, ' ').trim();
};

const removeRestrictedClaims = (value) =>
  value
    .replace(
      /\b\d+(?:[.,]\d+)?\s*(?:ohm(?:ios?)?|omega|[\u03a9\u03c9])\b/gi,
      ''
    )
    .replace(/\b(?:cert(?:ificacion|ificado)?\s*)?SEC\b/gi, '')
    .replace(/\bRIC\s*N\s*0?6\b/gi, 'RIC N06 segun condiciones del proyecto')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();

const truncateText = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

const getJobText = (job) => {
  const jobText = removeRestrictedClaims(sanitizeInlineText(job));
  return truncateText(jobText || DEFAULT_JOB, 120);
};

const getVideoUrl = (video = {}) => {
  const { url, video_id: videoId } = video || {};
  const videoUrl = sanitizeInlineText(url);

  if (videoUrl) {
    return videoUrl;
  }

  const normalizedVideoId = sanitizeInlineText(videoId);
  return normalizedVideoId ? `${YOUTUBE_WATCH_URL}${normalizedVideoId}` : '';
};

const buildLinkedInCopy = (job) => {
  const jobText = getJobText(job);

  return [
    `En Magno Terra compartimos un nuevo registro de ${jobText}.`,
    'La puesta a tierra debe revisarse segun las condiciones reales de cada proyecto, con criterio tecnico y trazabilidad para tomar decisiones seguras en terreno.',
    `Si tu empresa necesita diagnostico, mantencion o mejora de sistemas de puesta a tierra, conversemos: ${CONTACT_URL}`,
    '',
    LINKEDIN_HASHTAGS,
  ].join('\n');
};

const buildInstagramCaption = (job) => {
  const jobText = getJobText(job);

  return [
    `Nuevo video de ${jobText}.`,
    'En Magno Terra ayudamos a evaluar y mejorar sistemas de puesta a tierra segun las condiciones de cada proyecto.',
    'Contacto: magnoterra.cl/contacto',
    INSTAGRAM_HASHTAGS,
  ].join('\n');
};

const renderVideoMarkdown = (video) => {
  const safeVideo = video && typeof video === 'object' ? video : {};
  const url = getVideoUrl(safeVideo);

  if (!url) {
    return '';
  }

  return [
    '1) URL',
    url,
    '',
    '2) Copy LinkedIn empresa',
    buildLinkedInCopy(safeVideo.job),
    '',
    '3) Caption Instagram',
    buildInstagramCaption(safeVideo.job),
  ].join('\n');
};

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return 'NO_VIDEOS';
  }

  const videos = Array.isArray(payload.videos) ? payload.videos : [];
  const renderedVideos = videos.map(renderVideoMarkdown).filter(Boolean);

  return renderedVideos.length > 0
    ? renderedVideos.join('\n\n---\n\n')
    : 'NO_VIDEOS';
};

export const youtubeUploadBatchConstants = {
  CONTACT_URL,
  LINKEDIN_HASHTAGS,
  INSTAGRAM_HASHTAGS,
};
