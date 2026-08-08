export const EMPTY_YOUTUBE_BATCH_RESPONSE = 'NO_VIDEOS';

const LINKEDIN_CTA = 'https://magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';

const LINKEDIN_COPY = [
  'Nuevo video de Magno Terra: mostramos trabajo en terreno para soluciones de puesta a tierra,',
  'con foco en seguridad, continuidad operacional y criterios tecnicos aplicables en Chile.',
  'La referencia RIC N06 se revisa segun las condiciones y alcance de cada proyecto.',
  `Si tu empresa necesita evaluar, mantener o proyectar su sistema de puesta a tierra, conversemos: ${LINKEDIN_CTA}`,
  REQUIRED_HASHTAGS,
].join(' ');

const INSTAGRAM_CAPTION = [
  'Trabajo en terreno de Magno Terra para puesta a tierra en Chile.',
  'La aplicacion de RIC N06 depende del alcance y condiciones de cada proyecto.',
  'Contacto: magnoterra.cl/contacto',
  REQUIRED_HASHTAGS,
].join(' ');

const isMarkdownSafeVideoUrl = (value) => {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  try {
    const parsedUrl = new URL(value.trim());
    return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';
  } catch (_error) {
    return false;
  }
};

const normalizeVideoUrl = (value) => new URL(value.trim()).toString();

const buildVideoMarkdown = (url) => [
  `1) URL: ${url}`,
  `2) Copy LinkedIn empresa: ${LINKEDIN_COPY}`,
  `3) Caption Instagram: ${INSTAGRAM_CAPTION}`,
].join('\n');

export const generateYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];
  const blocks = videos
    .filter((video) => isMarkdownSafeVideoUrl(video?.url))
    .map((video) => buildVideoMarkdown(normalizeVideoUrl(video.url)));

  return blocks.length > 0 ? blocks.join('\n\n') : EMPTY_YOUTUBE_BATCH_RESPONSE;
};

export const socialCopyLimits = {
  linkedin: 900,
  instagram: 500,
};
