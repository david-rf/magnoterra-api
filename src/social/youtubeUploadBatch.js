const EVENT_NAME = 'youtube_upload_batch';
const NO_VIDEOS = 'NO_VIDEOS';
const CONTACT_CTA = 'magnoterra.cl/contacto';
const HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';

const RESTRICTED_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:ohms?|omega|Ω)\b/gi,
  /\bcert(?:\.|ificacion|ificación|ificado|ificado de)?\s*SEC\b/gi,
  /\bRIC\s*N(?:°|º|o\.?)?\s*0?6\b/gi,
];

const normalizeText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const truncateAtWord = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.slice(0, maxLength).replace(/\s+\S*$/, '').trim();
  return truncated || text.slice(0, maxLength).trim();
};

const removeRestrictedClaims = (text) => (
  RESTRICTED_PATTERNS.reduce(
    (current, pattern) => current.replace(pattern, ''),
    text,
  )
    .replace(/\bcon\s+y\b/gi, '')
    .replace(/\b(?:con|y)\s*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
);

const getJobLabel = (job, maxLength) => {
  const jobValue = typeof job === 'object' && job !== null
    ? job.name || job.title || job.project || job.id
    : job;
  const cleanJob = removeRestrictedClaims(normalizeText(jobValue));

  if (!cleanJob) {
    return 'este proyecto';
  }

  return truncateAtWord(cleanJob, maxLength);
};

const getVideoUrl = (video) => {
  const url = normalizeText(video?.url);

  if (url) {
    return url;
  }

  const videoId = normalizeText(video?.video_id);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';
};

const buildLinkedInCopy = (video) => {
  const project = getJobLabel(video.job, 120);

  return [
    `En Magno Terra seguimos impulsando soluciones de puesta a tierra para ${project}.`,
    'Este registro muestra coordinación en terreno, revisión técnica y ejecución alineada a las condiciones reales de la instalación.',
    'Cuando corresponde al alcance del proyecto, consideramos RIC N06 junto con la normativa aplicable para orientar decisiones seguras y trazables.',
    `Conversemos sobre tu proyecto en ${CONTACT_CTA}`,
    HASHTAGS,
  ].join('\n\n');
};

const buildInstagramCaption = (video) => {
  const project = getJobLabel(video.job, 80);

  return [
    `Puesta a tierra para ${project}: coordinación, criterio técnico y ejecución en terreno.`,
    `Consideramos RIC N06 cuando corresponde al proyecto. Conversemos en ${CONTACT_CTA}`,
    HASHTAGS,
  ].join('\n\n');
};

const formatVideoMarkdown = (video) => [
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
  if (
    !payload
    || payload.event !== EVENT_NAME
    || !Array.isArray(payload.videos)
    || payload.videos.length === 0
  ) {
    return NO_VIDEOS;
  }

  const videos = payload.videos.filter((video) => getVideoUrl(video));

  if (videos.length === 0) {
    return NO_VIDEOS;
  }

  return videos.map(formatVideoMarkdown).join('\n\n---\n\n');
};

export { NO_VIDEOS };
