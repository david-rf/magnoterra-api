const LINKEDIN_MAX_LENGTH = 900;
const INSTAGRAM_MAX_LENGTH = 500;

export const YOUTUBE_UPLOAD_BATCH_EVENT = 'youtube_upload_batch';
export const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
export const CONTACT_CTA = 'https://magnoterra.cl/contacto';

const LINKEDIN_COMPANY_COPY = `En Magno Terra compartimos una nueva mirada practica sobre puesta a tierra para proyectos en Chile. Cada instalacion debe evaluarse segun terreno, cargas, normativa aplicable y alcance de la obra; RIC N06 se considera siempre condicionado al proyecto. Si tu equipo necesita revisar, mejorar o planificar su sistema de puesta a tierra, conversemos: ${CONTACT_CTA}

${REQUIRED_HASHTAGS}`;

const INSTAGRAM_CAPTION = `Nueva publicacion de Magno Terra: puesta a tierra pensada para proyectos reales en Chile. Cada solucion se define segun el terreno y los requisitos de la obra; RIC N06 aplica condicionado al proyecto. Hablemos en magnoterra.cl/contacto ${REQUIRED_HASHTAGS}`;

const assertCopyLimits = () => {
  if (LINKEDIN_COMPANY_COPY.length > LINKEDIN_MAX_LENGTH) {
    throw new Error('LinkedIn company copy exceeds 900 characters');
  }

  if (INSTAGRAM_CAPTION.length > INSTAGRAM_MAX_LENGTH) {
    throw new Error('Instagram caption exceeds 500 characters');
  }
};

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

export const getVideoUrl = (video) => {
  if (!isPlainObject(video)) {
    return '';
  }

  const explicitUrl = normalizeText(video.url);

  if (explicitUrl) {
    return explicitUrl;
  }

  const videoId = normalizeText(video.video_id);

  if (!videoId) {
    return '';
  }

  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
};

export const buildLinkedInCompanyCopy = () => {
  assertCopyLimits();
  return LINKEDIN_COMPANY_COPY;
};

export const buildInstagramCaption = () => {
  assertCopyLimits();
  return INSTAGRAM_CAPTION;
};

const buildVideoMarkdown = (video) => {
  const url = getVideoUrl(video);

  if (!url) {
    return '';
  }

  return [
    `1. URL: ${url}`,
    `2. Copy LinkedIn empresa (<=${LINKEDIN_MAX_LENGTH} chars):`,
    buildLinkedInCompanyCopy(),
    `3. Caption Instagram (<=${INSTAGRAM_MAX_LENGTH} chars):`,
    buildInstagramCaption(),
  ].join('\n');
};

export const buildYoutubeUploadBatchMarkdown = (payload) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];
  const videoSections = videos.map(buildVideoMarkdown).filter(Boolean);

  if (videoSections.length === 0) {
    return 'NO_VIDEOS';
  }

  return videoSections.join('\n\n---\n\n');
};
