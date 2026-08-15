export const YOUTUBE_UPLOAD_BATCH_EVENT = 'youtube_upload_batch';

const LINKEDIN_COMPANY_COPY =
  'Nuevo video MagnoTerra: seguimos acompanando proyectos en Chile con soluciones de puesta a tierra pensadas para terreno real, coordinacion tecnica y criterios de seguridad electrica. La aplicacion de RIC N06 debe revisarse segun las condiciones y alcance de cada proyecto. Si tu equipo necesita evaluar, mantener o mejorar su sistema de puesta a tierra, conversemos en magnoterra.cl/contacto #PuestaATierra #Chile #MagnoTerra';

const INSTAGRAM_CAPTION =
  'Trabajo en terreno y criterio tecnico para soluciones de puesta a tierra en Chile. La aplicacion de RIC N06 depende del alcance de cada proyecto. Contactanos en magnoterra.cl/contacto #PuestaATierra #Chile #MagnoTerra';

const URL_PROTOCOLS = new Set(['http:', 'https:']);

export const SOCIAL_COPY_LIMITS = {
  linkedin: 900,
  instagram: 500,
};

export function getLinkedinCompanyCopy() {
  return LINKEDIN_COMPANY_COPY;
}

export function getInstagramCaption() {
  return INSTAGRAM_CAPTION;
}

export function renderYoutubeUploadBatchMarkdown(payload) {
  const videos = getValidVideos(payload);

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map(renderVideoMarkdown).join('\n\n---\n\n');
}

function getValidVideos(payload) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    payload.event !== YOUTUBE_UPLOAD_BATCH_EVENT ||
    !Array.isArray(payload.videos)
  ) {
    return [];
  }

  return payload.videos
    .map((video) => ({
      url: normalizeUrl(video?.url),
    }))
    .filter((video) => video.url);
}

function normalizeUrl(value) {
  if (typeof value !== 'string') {
    return '';
  }

  try {
    const url = new URL(value.trim());
    return URL_PROTOCOLS.has(url.protocol) ? url.toString() : '';
  } catch (_error) {
    return '';
  }
}

function renderVideoMarkdown(video) {
  return [
    `1. URL: ${video.url}`,
    `2. Copy LinkedIn empresa: ${LINKEDIN_COMPANY_COPY}`,
    `3. Caption Instagram: ${INSTAGRAM_CAPTION}`,
  ].join('\n');
}
