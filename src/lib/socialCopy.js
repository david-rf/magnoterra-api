const CTA_URL = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';

export const LINKEDIN_COMPANY_COPY = `En Magno Terra compartimos un nuevo video sobre puesta a tierra para equipos, obras y operacion en terreno. Nuestro enfoque combina diagnostico, diseno y ejecucion responsable, considerando RIC N06 cuando corresponde al proyecto y las condiciones reales de cada instalacion.

Si tu empresa necesita revisar, mejorar o planificar su sistema de puesta a tierra, conversemos: ${CTA_URL}

${REQUIRED_HASHTAGS}`;

export const INSTAGRAM_CAPTION = `Nuevo video de Magno Terra: puesta a tierra con criterio tecnico, foco en terreno y RIC N06 cuando aplica al proyecto.

Conversemos en ${CTA_URL}

${REQUIRED_HASHTAGS}`;

const COPY_LIMITS = {
  linkedin: 900,
  instagram: 500,
};

const assertCopyLimits = () => {
  if (LINKEDIN_COMPANY_COPY.length > COPY_LIMITS.linkedin) {
    throw new Error('LinkedIn company copy exceeds 900 characters');
  }

  if (INSTAGRAM_CAPTION.length > COPY_LIMITS.instagram) {
    throw new Error('Instagram caption exceeds 500 characters');
  }
};

assertCopyLimits();

const formatVideoMarkdown = (video) => [
  `1. URL: ${video.url}`,
  '2. Copy LinkedIn empresa:',
  LINKEDIN_COMPANY_COPY,
  '',
  '3. Caption Instagram:',
  INSTAGRAM_CAPTION,
].join('\n');

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map(formatVideoMarkdown).join('\n\n---\n\n');
};

