const EVENT_NAME = 'youtube_upload_batch';
const CONTACT_URL = 'magnoterra.cl/contacto';
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';

const LINKEDIN_COPY = `Nuevo video de Magno Terra: mostramos como abordamos soluciones de puesta a tierra para proyectos en Chile, con foco en diagnostico, diseno responsable y ejecucion segun las condiciones de cada instalacion. La aplicacion de RIC N06 siempre debe evaluarse segun el proyecto y su contexto tecnico. Si tu empresa necesita revisar o planificar su sistema de puesta a tierra, conversemos en ${CONTACT_URL}

${LINKEDIN_HASHTAGS}`;

const INSTAGRAM_CAPTION = `Nuevo video: puesta a tierra para proyectos en Chile, con mirada tecnica y ejecucion responsable. La aplicacion de RIC N06 depende del proyecto y sus condiciones. Contacto: ${CONTACT_URL}`;

const hasVideos = (payload) => Array.isArray(payload?.videos) && payload.videos.length > 0;

const normalizeUrl = (video) => {
  if (typeof video?.url === 'string' && video.url.trim()) {
    return video.url.trim();
  }

  if (typeof video?.video_id === 'string' && video.video_id.trim()) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(video.video_id.trim())}`;
  }

  return '';
};

const formatVideoMarkdown = (video) => {
  const url = normalizeUrl(video);

  return [
    '1) URL',
    url,
    '',
    '2) Copy LinkedIn empresa',
    LINKEDIN_COPY,
    '',
    '3) Caption Instagram',
    INSTAGRAM_CAPTION,
  ].join('\n');
};

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  if (payload?.event !== EVENT_NAME || !hasVideos(payload)) {
    return 'NO_VIDEOS';
  }

  return payload.videos.map(formatVideoMarkdown).join('\n\n---\n\n');
};

export const socialCopyLimits = {
  linkedInMaxChars: 900,
  instagramMaxChars: 500,
  linkedInCopy: LINKEDIN_COPY,
  instagramCaption: INSTAGRAM_CAPTION,
};
