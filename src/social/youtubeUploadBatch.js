const LINKEDIN_MAX_LENGTH = 900;
const INSTAGRAM_MAX_LENGTH = 500;
const CTA_URL = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const DEFAULT_TOPIC = 'soluciones de puesta a tierra para proyectos en Chile';
const RIC_N06_NOTE =
  'La aplicacion de RIC N06 se evalua segun las condiciones del proyecto.';

const JOB_FIELDS = [
  'title',
  'name',
  'project',
  'service',
  'category',
  'location',
  'summary',
  'description',
];

const toCleanText = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return '';
  }

  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(
      /\d+(?:[.,]\d+)?\s*(?:ohm(?:ios?)?|omega|Ω)/gi,
      'valores de resistencia'
    )
    .replace(
      /(?:ohm(?:ios?)?|omega|Ω)\s*\d+(?:[.,]\d+)?/gi,
      'valores de resistencia'
    )
    .replace(/\b(?:cert(?:ificacion|ificado)?\s*)?SEC\b/gi, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+(?:con|y|e)\s*$/i, '')
    .trim();
};

const toPlainString = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return '';
  }

  return String(value)
    .replace(/[\r\n\t]+/g, ' ')
    .trim();
};

const truncateAtWord = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text;
  }

  const clipped = text.slice(0, maxLength - 1).trimEnd();
  const lastSpace = clipped.lastIndexOf(' ');

  if (lastSpace < Math.floor(maxLength * 0.65)) {
    return `${clipped}.`;
  }

  return `${clipped.slice(0, lastSpace).trimEnd()}.`;
};

const stripTrailingPeriod = (text) => text.replace(/\.+$/g, '');

const getJobParts = (job) => {
  if (!job) {
    return [];
  }

  if (typeof job === 'string' || typeof job === 'number') {
    return [toCleanText(job)];
  }

  if (Array.isArray(job)) {
    return job.map(toCleanText).filter(Boolean);
  }

  if (typeof job !== 'object') {
    return [];
  }

  return JOB_FIELDS.map((field) => toCleanText(job[field])).filter(Boolean);
};

const getTopic = (video) => {
  const parts = getJobParts(video?.job);
  const topic = parts.slice(0, 2).join(' - ');

  return topic || DEFAULT_TOPIC;
};

const getVideoUrl = (video) => {
  const url = toPlainString(video?.url);

  if (url) {
    return url;
  }

  const videoId = toPlainString(video?.video_id);

  return videoId
    ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
    : '';
};

export const createYoutubeUploadCopy = (video = {}) => {
  const topic = getTopic(video);
  const linkedinTopic = stripTrailingPeriod(truncateAtWord(topic, 220));
  const shortTopic = stripTrailingPeriod(truncateAtWord(topic, 120));

  const linkedinBody = [
    `Compartimos un nuevo video de Magno Terra sobre ${linkedinTopic}.`,
    'En cada obra revisamos el terreno, el alcance y los requisitos tecnicos para definir una solucion de puesta a tierra responsable.',
    RIC_N06_NOTE,
    `Conversemos en ${CTA_URL}`,
    REQUIRED_HASHTAGS,
  ].join(' ');

  const instagramBody = [
    `Nuevo video de Magno Terra: ${shortTopic}.`,
    'Puesta a tierra pensada desde el terreno y las necesidades reales de cada proyecto.',
  ].join(' ');

  return {
    url: getVideoUrl(video),
    linkedin: truncateAtWord(linkedinBody, LINKEDIN_MAX_LENGTH),
    instagram: truncateAtWord(instagramBody, INSTAGRAM_MAX_LENGTH),
  };
};

export const formatYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos
    .map((video) => {
      const copy = createYoutubeUploadCopy(video);

      return [
        `1. URL: ${copy.url}`,
        `2. Copy LinkedIn empresa: ${copy.linkedin}`,
        `3. Caption Instagram: ${copy.instagram}`,
      ].join('\n');
    })
    .join('\n\n');
};

export const limits = {
  linkedin: LINKEDIN_MAX_LENGTH,
  instagram: INSTAGRAM_MAX_LENGTH,
};
