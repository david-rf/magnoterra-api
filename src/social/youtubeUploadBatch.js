export const YOUTUBE_UPLOAD_BATCH_EVENT = 'youtube_upload_batch';
export const NO_VIDEOS_RESPONSE = 'NO_VIDEOS';

const CONTACT_URL = 'magnoterra.cl/contacto';
const HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const LINKEDIN_MAX_LENGTH = 900;
const INSTAGRAM_MAX_LENGTH = 500;

const LINKEDIN_COPY =
  'Nuevo video de MagnoTerra: una mirada practica al trabajo de puesta a tierra para proyectos en Chile. En cada obra revisamos terreno, alcance y documentacion para definir una solucion alineada al proyecto; RIC N06 se evalua segun sus condiciones especificas. Si tu empresa necesita diagnostico, instalacion o mantencion de puesta a tierra, conversemos en magnoterra.cl/contacto\n\n#PuestaATierra #Chile #MagnoTerra';

const INSTAGRAM_CAPTION =
  'Nuevo video: puesta a tierra para proyectos en Chile, con foco en seguridad, terreno y alcance real de la obra. RIC N06 se evalua segun cada proyecto. Conversemos en magnoterra.cl/contacto #PuestaATierra #Chile #MagnoTerra';

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const normalizeInlineText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/\s+/g, ' ').trim();
};

export const resolveVideoUrl = (video) => {
  const url = normalizeInlineText(video.url);

  if (url) {
    return url;
  }

  const videoId = normalizeInlineText(video.video_id);

  if (videoId) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  }

  return 'URL no disponible';
};

export const formatYoutubeUploadBatchMarkdown = (payload) => {
  if (!isRecord(payload) || payload.event !== YOUTUBE_UPLOAD_BATCH_EVENT) {
    return NO_VIDEOS_RESPONSE;
  }

  const videos = Array.isArray(payload.videos)
    ? payload.videos.filter(isRecord)
    : [];

  if (videos.length === 0) {
    return NO_VIDEOS_RESPONSE;
  }

  return videos
    .map((video, index) =>
      [
        `## Video ${index + 1}`,
        '',
        `1) URL: ${resolveVideoUrl(video)}`,
        `2) Copy LinkedIn empresa: ${LINKEDIN_COPY}`,
        `3) Caption Instagram: ${INSTAGRAM_CAPTION}`,
      ].join('\n')
    )
    .join('\n\n---\n\n');
};

export const getLinkedinCopy = () => LINKEDIN_COPY;
export const getInstagramCaption = () => INSTAGRAM_CAPTION;

export const getSocialPostConstraints = () => ({
  contactUrl: CONTACT_URL,
  hashtags: HASHTAGS,
  linkedinMaxChars: LINKEDIN_MAX_LENGTH,
  instagramMaxChars: INSTAGRAM_MAX_LENGTH,
});
