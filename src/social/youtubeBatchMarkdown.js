export const YOUTUBE_UPLOAD_BATCH_EVENT = 'youtube_upload_batch';
export const NO_VIDEOS_RESPONSE = 'NO_VIDEOS';

const CONTACT_CTA = 'magnoterra.cl/contacto';
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const DEFAULT_JOB_CONTEXT = 'un nuevo registro tecnico de terreno';

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();

const stripRestrictedClaims = (value) =>
  normalizeWhitespace(value)
    .replace(
      /\b\d+(?:[.,]\d+)?\s*(?:[\u03a9\u03c9]|ohmios?|ohms?|omega)\b/gi,
      ''
    )
    .replace(/\b(?:[\u03a9\u03c9]|ohmios?|ohms?|omega)\b/gi, '')
    .replace(/\bcert(?:ificaci(?:o|\u00f3)n|ificado)?\s+SEC\b/gi, '')
    .replace(/\bSEC\b/gi, '')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

const getCleanString = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return stripRestrictedClaims(value);
};

const getJobText = (job) => {
  if (typeof job === 'string') {
    return getCleanString(job);
  }

  if (!job || typeof job !== 'object') {
    return '';
  }

  const fields = [
    'title',
    'name',
    'project',
    'location',
    'city',
    'description',
  ];
  return fields
    .map((field) => getCleanString(job[field]))
    .filter(Boolean)
    .join(' - ');
};

const truncate = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
};

const getVideoUrl = (video) => {
  const explicitUrl = getCleanString(video.url);
  if (explicitUrl) {
    return explicitUrl;
  }

  const videoId = getCleanString(video.video_id);
  if (!videoId) {
    return '';
  }

  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
};

const buildLinkedInCopy = (jobContext) => {
  const summary = truncate(jobContext || DEFAULT_JOB_CONTEXT, 160);

  return [
    `Nuevo video de Magno Terra: ${summary}.`,
    'Mostramos criterios de puesta a tierra para proyectos en Chile, con foco en seguridad, continuidad operacional y ejecucion alineada a la normativa aplicable.',
    'Cuando el proyecto lo requiere, revisamos exigencias como RIC N06 dentro del alcance tecnico.',
    `Conversemos sobre tu proyecto: ${CONTACT_CTA}`,
    LINKEDIN_HASHTAGS,
  ].join('\n\n');
};

const buildInstagramCaption = (jobContext) => {
  const summary = truncate(jobContext || DEFAULT_JOB_CONTEXT, 110);

  return [
    `Puesta a tierra para proyectos en Chile: ${summary}.`,
    `Revisamos cada alcance tecnico segun el proyecto. Contacto: ${CONTACT_CTA}`,
  ].join('\n');
};

const buildVideoMarkdown = (video) => {
  const url = getVideoUrl(video);
  const jobContext = getJobText(video.job) || DEFAULT_JOB_CONTEXT;
  const linkedInCopy = buildLinkedInCopy(jobContext);
  const instagramCaption = buildInstagramCaption(jobContext);

  return [
    '1) URL',
    url,
    '',
    '2) Copy LinkedIn empresa',
    linkedInCopy,
    '',
    '3) Caption Instagram',
    instagramCaption,
  ].join('\n');
};

export const renderYoutubeUploadBatchMarkdown = (payload) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];
  const renderableVideos = videos
    .filter((video) => video && typeof video === 'object')
    .filter((video) => getVideoUrl(video));

  if (renderableVideos.length === 0) {
    return NO_VIDEOS_RESPONSE;
  }

  return renderableVideos.map(buildVideoMarkdown).join('\n\n---\n\n');
};
