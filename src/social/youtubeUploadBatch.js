const CONTACT_URL = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const MAX_LINKEDIN_CHARS = 900;
const MAX_INSTAGRAM_CHARS = 500;

const JOB_FIELDS = [
  'title',
  'name',
  'description',
  'project',
  'proyecto',
  'client',
  'cliente',
  'type',
  'tipo',
];

const hasContent = (value) => typeof value === 'string' && value.trim().length > 0;

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();

const stripRestrictedClaims = (value) => normalizeWhitespace(value)
  .replace(/\b\d+(?:[.,]\d+)?\s*(?:ohm(?:s)?|omega)\b/gi, 'criterio tecnico')
  .replace(/\b(?:cert(?:ificado|ificacion)?\s*(?:de\s*)?)?SEC\b/gi, 'normativa aplicable')
  .replace(/\bRIC\s*N[°ºo]?\s*0?6\b/gi, 'RIC N06 sujeto al proyecto');

const truncateText = (value, maxChars) => {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, maxChars - 3).trimEnd()}...`;
};

const extractJobText = (job) => {
  if (hasContent(job)) {
    return job;
  }

  if (!job || typeof job !== 'object' || Array.isArray(job)) {
    return '';
  }

  for (const field of JOB_FIELDS) {
    if (hasContent(job[field])) {
      return job[field];
    }
  }

  return '';
};

const buildTopic = (video) => {
  const jobText = stripRestrictedClaims(extractJobText(video?.job));

  if (!jobText) {
    return '';
  }

  return ` sobre ${truncateText(jobText, 120)}`;
};

const getVideoUrl = (video) => {
  if (hasContent(video?.url)) {
    return normalizeWhitespace(video.url);
  }

  if (hasContent(video?.video_id)) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(normalizeWhitespace(video.video_id))}`;
  }

  return 'URL no disponible';
};

const getVideoLabel = (video, index) => {
  if (hasContent(video?.video_id)) {
    return normalizeWhitespace(video.video_id);
  }

  return String(index + 1);
};

export const createLinkedInCompanyCopy = (video) => {
  const topic = buildTopic(video);
  const copy = [
    `Compartimos un nuevo video de Magno Terra${topic}.`,
    'En proyectos de puesta a tierra, una ejecucion responsable combina diagnostico, diseno, materiales adecuados y verificacion en terreno.',
    'RIC N06 se evalua segun las condiciones de cada proyecto, por eso revisamos el contexto antes de recomendar una solucion.',
    `Si necesitas apoyo para tu obra o instalacion en Chile, conversemos en ${CONTACT_URL}.`,
    REQUIRED_HASHTAGS,
  ].join(' ');

  return truncateText(copy, MAX_LINKEDIN_CHARS);
};

export const createInstagramCaption = (video) => {
  const topic = buildTopic(video);
  const caption = [
    `Nuevo video Magno Terra${topic}.`,
    'La puesta a tierra requiere mirada tecnica, ejecucion cuidada y revision segun cada proyecto.',
    `Te acompanamos desde el diagnostico hasta una solucion alineada al contexto de la obra. ${CONTACT_URL}`,
  ].join(' ');

  return truncateText(caption, MAX_INSTAGRAM_CHARS);
};

export const formatYoutubeUploadBatchResponse = (payload) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map((video, index) => [
    `## Video ${getVideoLabel(video, index)}`,
    '',
    '1) URL',
    getVideoUrl(video),
    '',
    '2) Copy LinkedIn empresa',
    createLinkedInCompanyCopy(video),
    '',
    '3) Caption Instagram',
    createInstagramCaption(video),
  ].join('\n')).join('\n\n---\n\n');
};

