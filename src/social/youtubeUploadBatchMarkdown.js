const YOUTUBE_UPLOAD_BATCH_EVENT = 'youtube_upload_batch';
const EMPTY_RESPONSE = 'NO_VIDEOS';

const LINKEDIN_COPY =
  'Nuevo video de MagnoTerra: una mirada practica a la puesta a tierra para proyectos electricos en Chile. Compartimos criterios de diseno, revision y mantencion que ayudan a evaluar riesgos, continuidad operacional y cumplimiento normativo. La aplicacion de RIC N06 debe revisarse segun las condiciones de cada proyecto, su ingenieria y el contexto de instalacion. Si necesitas apoyo para evaluar o mejorar tu sistema de puesta a tierra, contactanos en magnoterra.cl/contacto #PuestaATierra #Chile #MagnoTerra';

const INSTAGRAM_CAPTION =
  'Nuevo video: puesta a tierra aplicada a proyectos electricos en Chile. Revisa criterios practicos y recuerda que RIC N06 se evalua segun cada proyecto. Contacto: magnoterra.cl/contacto #PuestaATierra #Chile #MagnoTerra';

const normalizeUrl = (video) => {
  if (!video || typeof video !== 'object') {
    return '';
  }

  if (typeof video.url === 'string' && video.url.trim()) {
    return video.url.trim().replace(/\s+/g, '');
  }

  if (typeof video.video_id === 'string' && video.video_id.trim()) {
    const videoId = encodeURIComponent(video.video_id.trim());
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  return '';
};

const getValidVideoUrls = (payload) => {
  if (
    !payload ||
    payload.event !== YOUTUBE_UPLOAD_BATCH_EVENT ||
    !Array.isArray(payload.videos)
  ) {
    return [];
  }

  return payload.videos.map(normalizeUrl).filter(Boolean);
};

const formatVideoMarkdown = (url) => `1) URL
${url}

2) Copy LinkedIn empresa
${LINKEDIN_COPY}

3) Caption Instagram
${INSTAGRAM_CAPTION}`;

export const formatYoutubeUploadBatchMarkdown = (payload) => {
  const urls = getValidVideoUrls(payload);

  if (urls.length === 0) {
    return EMPTY_RESPONSE;
  }

  return urls.map(formatVideoMarkdown).join('\n\n---\n\n');
};

export {
  EMPTY_RESPONSE,
  INSTAGRAM_CAPTION,
  LINKEDIN_COPY,
  YOUTUBE_UPLOAD_BATCH_EVENT,
};
