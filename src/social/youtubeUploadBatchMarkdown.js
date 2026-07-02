const CONTACT_URL = 'magnoterra.cl/contacto';
const HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const DEFAULT_CONTEXT = 'un nuevo contenido tecnico de Magno Terra';

const forbiddenPatterns = [
  /[<>\u2264\u2265=~]?\s*\d+(?:[.,]\d+)?\s*(?:ohm(?:ios?)?|\u03a9|\u2126)\b/gi,
  /\b(?:cert(?:ificado|ificacion|ificaci\u00f3n)?\.?\s*)?SEC\b/gi,
  /\bRIC\s*N[\u00b0\u00ba]?\s*0?6\b/gi,
];

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();

const truncate = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};

const plainText = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  let text = String(value)
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[`*_#[\]()>{}|~]/g, ' ');

  for (const pattern of forbiddenPatterns) {
    text = text.replace(pattern, '');
  }

  return normalizeWhitespace(text.replace(/\s+([,.;:])/g, '$1'));
};

const getJobText = (job) => {
  if (!job) {
    return '';
  }

  if (typeof job !== 'object') {
    return plainText(job);
  }

  const fields = [
    'title',
    'name',
    'topic',
    'service',
    'project',
    'location',
    'description',
    'summary',
  ];

  const parts = fields
    .map((field) => plainText(job[field]))
    .filter(Boolean);

  return parts.join(' - ');
};

const getJobContext = (job) => {
  const text = getJobText(job);

  if (!text) {
    return DEFAULT_CONTEXT;
  }

  return truncate(text, 140);
};

const getVideoUrl = (video) => {
  if (typeof video?.url === 'string' && video.url.trim()) {
    return video.url.trim();
  }

  if (video?.video_id) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(video.video_id)}`;
  }

  return '';
};

const buildLinkedInCopy = (context) => {
  const copy = [
    `En este video compartimos ${context} desde una mirada tecnica de Magno Terra.`,
    'Para proyectos de puesta a tierra en Chile, cada decision debe revisarse segun terreno, continuidad, materiales, alcance y criterios de seguridad. La aplicacion de RIC N06 queda condicionada a las caracteristicas y exigencias del proyecto.',
    `Si tu empresa esta evaluando una solucion o necesita revisar su instalacion, conversemos: ${CONTACT_URL}`,
    HASHTAGS,
  ].join('\n\n');

  return truncate(copy, 900);
};

const buildInstagramCaption = (context) => {
  const caption = [
    `Nuevo video: ${context}. Puesta a tierra para proyectos en Chile, revisada caso a caso. RIC N06 aplica segun el alcance del proyecto.`,
    `Contacto: ${CONTACT_URL}`,
    HASHTAGS,
  ].join('\n\n');

  return truncate(caption, 500);
};

const formatVideo = (video) => {
  const url = getVideoUrl(video);
  const context = getJobContext(video?.job);

  return [
    `1. URL: ${url}`,
    `2. Copy LinkedIn empresa: ${buildLinkedInCopy(context)}`,
    `3. Caption Instagram: ${buildInstagramCaption(context)}`,
  ].join('\n\n');
};

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];
  const validVideos = videos.filter((video) => video && typeof video === 'object');

  if (validVideos.length === 0) {
    return 'NO_VIDEOS';
  }

  return validVideos.map(formatVideo).join('\n\n---\n\n');
};

