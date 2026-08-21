const CONTACT_URL = 'magnoterra.cl/contacto';
const HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const NO_VIDEOS_RESPONSE = 'NO_VIDEOS';

const sanitizeInline = (value) =>
  String(value ?? '')
    .replace(/[\r\n<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const videoUrlFrom = (video) => {
  const explicitUrl = sanitizeInline(video?.url);

  if (explicitUrl) {
    return explicitUrl;
  }

  const videoId = sanitizeInline(video?.video_id);

  if (!videoId) {
    return '';
  }

  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
};

const linkedInCopy = () =>
  [
    'Nuevo registro en terreno de Magno Terra: evaluacion, mantencion y',
    'ejecucion de soluciones de puesta a tierra para instalaciones en Chile.',
    'Cada proyecto se revisa segun su alcance, condiciones del suelo,',
    'criticidad operacional y normativa aplicable. RIC N06 aplica de forma',
    'condicionada a las caracteristicas especificas del proyecto.',
    `Agenda una revision con nuestro equipo: ${CONTACT_URL}`,
    HASHTAGS,
  ].join(' ');

const instagramCaption = () =>
  [
    'Trabajo en terreno Magno Terra con foco en puesta a tierra, continuidad',
    'operacional y seguridad electrica. RIC N06 se evalua segun las',
    `condiciones de cada proyecto. Contacto: ${CONTACT_URL}`,
    HASHTAGS,
  ].join(' ');

export const getYoutubeUploadVideos = (payload) => {
  if (
    !payload ||
    payload.event !== 'youtube_upload_batch' ||
    !Array.isArray(payload.videos)
  ) {
    return [];
  }

  return payload.videos
    .map((video) => ({
      url: videoUrlFrom(video),
    }))
    .filter((video) => video.url);
};

export const buildYoutubeUploadBatchMarkdown = (payload) => {
  const videos = getYoutubeUploadVideos(payload);

  if (videos.length === 0) {
    return NO_VIDEOS_RESPONSE;
  }

  return videos
    .map((video) =>
      [
        `1) URL: <${video.url}>`,
        '',
        '2) Copy LinkedIn empresa:',
        linkedInCopy(),
        '',
        '3) Caption Instagram:',
        instagramCaption(),
      ].join('\n')
    )
    .join('\n\n---\n\n');
};

export { CONTACT_URL, HASHTAGS, NO_VIDEOS_RESPONSE };
