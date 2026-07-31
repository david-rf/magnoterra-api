const CTA_URL = 'magnoterra.cl/contacto';
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const LINKEDIN_MAX_CHARS = 900;
const INSTAGRAM_MAX_CHARS = 500;

const JOB_TEXT_FIELDS = [
  'title',
  'name',
  'topic',
  'project',
  'description',
  'slug',
];

const normalizeText = (value) =>
  String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const stripRestrictedClaims = (value) =>
  normalizeText(value)
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:omega|ohmios?|ohms?|Ω)\b/gi, '')
    .replace(/\b(?:omega|ohmios?|ohms?)\b/gi, '')
    .replace(/Ω/gi, '')
    .replace(/\bcert(?:ificacion|ificación)?\s+SEC\b/gi, '')
    .replace(/\bSEC\b/g, '')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

const trimToMax = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};

const firstJobText = (job) => {
  if (typeof job === 'string') {
    return job;
  }

  if (!job || typeof job !== 'object') {
    return '';
  }

  for (const field of JOB_TEXT_FIELDS) {
    if (typeof job[field] === 'string' && job[field].trim()) {
      return job[field];
    }
  }

  return '';
};

const getTopicClause = (job) => {
  const topic = trimToMax(stripRestrictedClaims(firstJobText(job)), 110);
  return topic ? ` sobre ${topic}` : '';
};

const getVideoUrl = (video) => {
  const url = normalizeText(video?.url);

  if (url) {
    return url;
  }

  const videoId = normalizeText(video?.video_id);
  return videoId
    ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
    : '';
};

export const buildLinkedInCopy = (video) => {
  const topicClause = getTopicClause(video?.job);
  const copy = [
    `En Magno Terra compartimos este registro${topicClause} para acercar criterios de diseño, instalación y mantenimiento de sistemas de puesta a tierra.`,
    'Cada solución requiere revisar terreno, cargas, normativa aplicable y alcance; la referencia a RIC N06 debe validarse según las condiciones de cada proyecto.',
    `Conversemos sobre tu instalación en ${CTA_URL}`,
    LINKEDIN_HASHTAGS,
  ].join('\n\n');

  return trimToMax(copy, LINKEDIN_MAX_CHARS);
};

export const buildInstagramCaption = (video) => {
  const topicClause = getTopicClause(video?.job);
  const caption = [
    `Nuevo video de Magno Terra${topicClause}. Una mirada práctica a puesta a tierra para proyectos en Chile.`,
    'RIC N06 aplica según el alcance y las condiciones de cada proyecto.',
    `Contacto: ${CTA_URL}`,
  ].join('\n\n');

  return trimToMax(caption, INSTAGRAM_MAX_CHARS);
};

export const renderYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];
  const renderableVideos = videos.filter((video) => getVideoUrl(video));

  if (renderableVideos.length === 0) {
    return 'NO_VIDEOS';
  }

  return renderableVideos
    .map((video) =>
      [
        '1) URL',
        getVideoUrl(video),
        '',
        '2) Copy LinkedIn empresa',
        buildLinkedInCopy(video),
        '',
        '3) Caption Instagram',
        buildInstagramCaption(video),
      ].join('\n')
    )
    .join('\n\n---\n\n');
};
