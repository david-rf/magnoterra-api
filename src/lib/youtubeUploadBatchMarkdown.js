const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const CONTACT_URL = 'magnoterra.cl/contacto';
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
    'Nuevo registro de trabajo en terreno de Magno Terra: planificacion,',
    'inspeccion y ejecucion orientadas a sistemas de puesta a tierra para',
    'instalaciones en Chile. Cada proyecto se revisa segun su alcance,',
    'condiciones del suelo, criticidad operacional y normativa aplicable;',
    'RIC N06 aplica segun las condiciones especificas del proyecto.',
    'Si necesitas evaluar, mantener o construir una solucion de puesta a',
    `tierra para tu instalacion, conversemos: ${CONTACT_URL}`,
    '',
    LINKEDIN_HASHTAGS,
  ].join(' ');

const instagramCaption = () =>
  [
    'Trabajo en terreno Magno Terra: puesta a tierra con foco en diagnostico,',
    'seguridad y continuidad operacional. RIC N06 se evalua segun cada',
    `proyecto. Conversemos en ${CONTACT_URL}`,
    '',
    LINKEDIN_HASHTAGS,
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
    .map((video, index) =>
      [
        `### Video ${index + 1}`,
        '',
        `1) URL: <${video.url}>`,
        '',
        '2) Copy LinkedIn empresa (<=900 chars):',
        '',
        linkedInCopy(),
        '',
        '3) Caption Instagram (<=500 chars):',
        '',
        instagramCaption(),
      ].join('\n')
    )
    .join('\n\n---\n\n');
};

export { CONTACT_URL, LINKEDIN_HASHTAGS, NO_VIDEOS_RESPONSE };
