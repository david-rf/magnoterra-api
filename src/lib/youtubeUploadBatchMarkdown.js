const CONTACT_URL = 'magnoterra.cl/contacto';
const EVENT_NAME = 'youtube_upload_batch';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const NO_VIDEOS_RESPONSE = 'NO_VIDEOS';

const LINKEDIN_COPY = [
  'Nuevo registro tecnico de Magno Terra en terreno: evaluacion,',
  'diagnostico y ejecucion de soluciones de puesta a tierra para proyectos',
  'electricos en Chile. Cada instalacion se revisa segun su alcance,',
  'condiciones del suelo, continuidad operacional y normativa aplicable;',
  'RIC N06 queda condicionado a las caracteristicas especificas del proyecto.',
  `Si necesitas apoyo para tu proyecto, conversemos en ${CONTACT_URL}`,
  '',
  REQUIRED_HASHTAGS,
].join(' ');

const INSTAGRAM_CAPTION = [
  'Nuevo video Magno Terra: puesta a tierra para proyectos electricos en',
  'Chile, con foco en diagnostico, seguridad y continuidad operacional.',
  'RIC N06 queda condicionado a cada proyecto.',
  `Contacto: ${CONTACT_URL}`,
  '',
  REQUIRED_HASHTAGS,
].join(' ');

const sanitizeInline = (value) =>
  String(value ?? '')
    .replace(/[\r\n<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const youtubeUrlFromId = (videoId) =>
  `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;

export const getVideoUrl = (video) => {
  const explicitUrl = sanitizeInline(video?.url);

  if (explicitUrl) {
    return explicitUrl;
  }

  const videoId = sanitizeInline(video?.video_id);

  return videoId ? youtubeUrlFromId(videoId) : '';
};

export const getYoutubeUploadBatchVideos = (payload = {}) => {
  if (payload?.event && payload.event !== EVENT_NAME) {
    return [];
  }

  if (!Array.isArray(payload?.videos)) {
    return [];
  }

  return payload.videos.map(getVideoUrl).filter(Boolean);
};

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videoUrls = getYoutubeUploadBatchVideos(payload);

  if (videoUrls.length === 0) {
    return NO_VIDEOS_RESPONSE;
  }

  return videoUrls
    .map((url) =>
      [
        '1) URL',
        `<${url}>`,
        '',
        '2) Copy LinkedIn empresa',
        LINKEDIN_COPY,
        '',
        '3) Caption Instagram',
        INSTAGRAM_CAPTION,
      ].join('\n')
    )
    .join('\n\n---\n\n');
};

export const limits = {
  linkedInMaxLength: 900,
  instagramMaxLength: 500,
};

export const templates = {
  linkedInCopy: LINKEDIN_COPY,
  instagramCaption: INSTAGRAM_CAPTION,
};

export { CONTACT_URL, EVENT_NAME, NO_VIDEOS_RESPONSE, REQUIRED_HASHTAGS };
