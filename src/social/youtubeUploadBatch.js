const CONTACT_URL = 'https://magnoterra.cl/contacto';
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const MAX_LINKEDIN_LENGTH = 900;
const MAX_INSTAGRAM_LENGTH = 500;

const RIC_N06_PATTERN = /\bRIC\s*N(?:o|\u00b0|ro|\u00ba)?\s*0?6\b/giu;
const SEC_CERT_PATTERN =
  /\b(?:cert(?:ificado|ificacion)?(?:es|s)?|acreditacion(?:es)?)\s+(?:SEC|S\.E\.C\.)\b|\bSEC\s+(?:cert(?:ificado|ificacion)?(?:es|s)?|acreditacion(?:es)?)\b/giu;
const SEC_PATTERN = /\bS\.?E\.?C\.?(?=\W|$)/giu;
const CERT_WORD_PATTERN =
  /\bcert(?:ificado|ificacion)?(?:es|s)?\b|\bacreditacion(?:es)?\b/giu;
const OMEGA_FIGURE_PATTERN =
  /\b\d+(?:[.,]\d+)?\s*(?:ohm(?:io)?s?|omega?s?|\u03a9|\u2126)\b/giu;
const EXTRA_SPACE_PATTERN = /\s{2,}/g;

const truncate = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
};

const sanitizeText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(OMEGA_FIGURE_PATTERN, '')
    .replace(SEC_CERT_PATTERN, '')
    .replace(SEC_PATTERN, '')
    .replace(CERT_WORD_PATTERN, '')
    .replace(RIC_N06_PATTERN, 'RIC N06 cuando aplica al proyecto')
    .replace(EXTRA_SPACE_PATTERN, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
};

const getVideoUrl = (video) => {
  if (typeof video?.url === 'string' && video.url.trim()) {
    return video.url.trim();
  }

  if (typeof video?.video_id === 'string' && video.video_id.trim()) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(video.video_id.trim())}`;
  }

  return '';
};

const getVideoTopic = (video) => {
  const sanitizedJob = sanitizeText(video?.job);

  if (sanitizedJob) {
    return sanitizedJob;
  }

  return 'un nuevo contenido tecnico sobre puesta a tierra y soluciones para proyectos electricos en Chile';
};

const buildLinkedInCopy = (video) => {
  const topic = getVideoTopic(video);
  const prefix = 'Compartimos un nuevo video de Magno Terra: ';
  const suffix = `. En proyectos electricos, una correcta puesta a tierra requiere diagnostico, diseno responsable y ejecucion de acuerdo con las condiciones reales de cada instalacion. Si estas evaluando mejoras, mantenimiento o una nueva obra, conversemos sobre la solucion adecuada para tu proyecto: ${CONTACT_URL} ${LINKEDIN_HASHTAGS}`;
  const copy = `${prefix}${truncate(topic, MAX_LINKEDIN_LENGTH - prefix.length - suffix.length)}${suffix}`;

  return truncate(copy, MAX_LINKEDIN_LENGTH);
};

const buildInstagramCaption = (video) => {
  const topic = getVideoTopic(video);
  const prefix = 'Nuevo video: ';
  const suffix = `. Puesta a tierra para proyectos electricos en Chile, con foco tecnico y soluciones seguras. Hablemos en ${CONTACT_URL}`;
  const caption = `${prefix}${truncate(topic, MAX_INSTAGRAM_LENGTH - prefix.length - suffix.length)}${suffix}`;

  return truncate(caption, MAX_INSTAGRAM_LENGTH);
};

const renderVideoMarkdown = (video) => {
  const url = getVideoUrl(video);

  return [
    `1) URL: ${url}`,
    `2) Copy LinkedIn empresa: ${buildLinkedInCopy(video)}`,
    `3) Caption Instagram: ${buildInstagramCaption(video)}`,
  ].join('\n');
};

export const renderYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];

  if (payload?.event !== 'youtube_upload_batch' || videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map(renderVideoMarkdown).join('\n\n');
};

export const limits = {
  linkedin: MAX_LINKEDIN_LENGTH,
  instagram: MAX_INSTAGRAM_LENGTH,
};
