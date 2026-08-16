const EVENT_NAME = 'youtube_upload_batch';
const NO_VIDEOS_RESPONSE = 'NO_VIDEOS';
const CONTACT_URL = 'magnoterra.cl/contacto';
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const LINKEDIN_LIMIT = 900;
const INSTAGRAM_LIMIT = 500;

const LINKEDIN_COPY = [
  'En MagnoTerra acompanamos proyectos de puesta a tierra en Chile con foco en ejecucion responsable, continuidad operacional y soluciones ajustadas a cada terreno.',
  `Si tu empresa necesita evaluar o ejecutar un sistema para su proyecto, conversemos en ${CONTACT_URL}.`,
  LINKEDIN_HASHTAGS,
].join(' ');

const INSTAGRAM_CAPTION = [
  'Puesta a tierra en terreno, con foco en ejecucion responsable y continuidad para cada proyecto.',
  `Conversemos en ${CONTACT_URL}.`,
].join(' ');

const toCleanString = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const getVideos = (payload) => {
  if (!payload || payload.event !== EVENT_NAME || !Array.isArray(payload.videos)) {
    return [];
  }

  return payload.videos
    .map((video) => ({
      url: toCleanString(video?.url),
    }))
    .filter((video) => video.url.length > 0);
};

const renderVideoMarkdown = (video, index) => [
  `### Video ${index + 1}`,
  '',
  '1) URL',
  video.url,
  '',
  '2) Copy LinkedIn empresa',
  LINKEDIN_COPY,
  '',
  '3) Caption Instagram',
  INSTAGRAM_CAPTION,
].join('\n');

export const renderYoutubeUploadBatchMarkdown = (payload) => {
  const videos = getVideos(payload);

  if (videos.length === 0) {
    return NO_VIDEOS_RESPONSE;
  }

  return videos.map(renderVideoMarkdown).join('\n\n---\n\n');
};

export {
  EVENT_NAME as YOUTUBE_UPLOAD_BATCH_EVENT,
  INSTAGRAM_LIMIT,
  LINKEDIN_LIMIT,
  NO_VIDEOS_RESPONSE,
};
