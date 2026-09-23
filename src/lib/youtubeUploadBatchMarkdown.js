const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const CONTACT_CTA = 'magnoterra.cl/contacto';

const normalizeText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/\s+/g, ' ');
};

const sanitizeJobText = (value) => normalizeText(value)
  .replace(/\bcert(?:ificacion|ificaci\u00f3n)?\s+SEC\b/gi, '')
  .replace(/\b\d+(?:[.,]\d+)?\s*(?:ohms?|omega)\b/gi, '')
  .replace(/\bSEC\b/gi, '')
  .replace(/[\u03a9\u03c9]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const truncate = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text;
  }

  const ellipsis = '...';
  return `${text.slice(0, maxLength - ellipsis.length).trimEnd()}${ellipsis}`;
};

const formatJobContext = (job) => {
  const normalizedJob = sanitizeJobText(job);
  return normalizedJob ? ` sobre ${normalizedJob}` : '';
};

export const hasBatchVideos = (payload) => (
  payload
  && payload.event === 'youtube_upload_batch'
  && Array.isArray(payload.videos)
  && payload.videos.length > 0
);

export const buildLinkedInCopy = (video) => {
  const jobContext = formatJobContext(video.job);
  const copy = [
    `Nuevo video de Magno Terra${jobContext}: soluciones de puesta a tierra pensadas para proyectos en Chile.`,
    'Compartimos criterios de terreno, coordinación tecnica y ejecucion responsable, considerando RIC N06 cuando corresponde segun el alcance del proyecto.',
    `Conversemos en ${CONTACT_CTA}.`,
    REQUIRED_HASHTAGS,
  ].join('\n\n');

  return truncate(copy, 900);
};

export const buildInstagramCaption = (video) => {
  const jobContext = formatJobContext(video.job);
  const caption = [
    `Nuevo video Magno Terra${jobContext}.`,
    'Puesta a tierra para proyectos en Chile, con mirada tecnica y criterios aplicables al alcance de cada obra.',
    REQUIRED_HASHTAGS,
  ].join('\n');

  return truncate(caption, 500);
};

export const buildYoutubeUploadBatchMarkdown = (payload) => {
  if (!hasBatchVideos(payload)) {
    return 'NO_VIDEOS';
  }

  return payload.videos.map((video, index) => [
    `### Video ${index + 1}`,
    '',
    `1) URL: ${normalizeText(video.url)}`,
    '',
    '2) Copy LinkedIn empresa:',
    '',
    buildLinkedInCopy(video),
    '',
    '3) Caption Instagram:',
    '',
    buildInstagramCaption(video),
  ].join('\n')).join('\n\n');
};
