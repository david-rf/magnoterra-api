const CONTACT_URL = 'magnoterra.cl/contacto';
const LINKEDIN_LIMIT = 900;
const INSTAGRAM_LIMIT = 500;
const JOB_LABEL_LIMIT = 180;
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';

const normalizeText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const sanitizeClaimText = (value) => normalizeText(value)
  .replace(/\b\d+(?:[.,]\d+)?\s*(?:[\u03a9\u03c9]|\bohms?\b|\bomega(?:s)?\b)/gi, 'mediciones verificadas')
  .replace(/[\u03a9\u03c9]|\bohms?\b|\bomega(?:s)?\b/gi, 'resistencia')
  .replace(/\b(?:cert(?:ificado|ificaci(?:o|\u00f3)n)?\.?\s*)?SEC\b/gi, 'respaldo normativo')
  .replace(/\bcert(?:ificado|ificaci(?:o|\u00f3)n)\b/gi, 'documentacion')
  .replace(/\s+/g, ' ')
  .trim();

const truncate = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - 3).trimEnd() + '...';
};

const getJobLabel = (job) => {
  const safeJob = sanitizeClaimText(job);

  return safeJob ? truncate(safeJob, JOB_LABEL_LIMIT) : 'un trabajo de puesta a tierra';
};

export const buildLinkedInCopy = (video) => {
  const jobLabel = getJobLabel(video?.job);
  const copy = [
    `En Magno Terra compartimos un nuevo registro de ${jobLabel}.`,
    'Nuestro foco esta en sistemas de puesta a tierra pensados para continuidad operacional, seguridad electrica y trazabilidad tecnica en terreno.',
    'Coordinamos cada etapa con el contexto del proyecto; cuando corresponde, revisamos criterios aplicables del RIC N06 segun alcance y condiciones de la instalacion.',
    `Si tu empresa necesita diagnostico, mantencion o ejecucion de puesta a tierra en Chile, conversemos: ${CONTACT_URL}`,
    '',
    REQUIRED_HASHTAGS,
  ].join(' ');

  return truncate(copy, LINKEDIN_LIMIT);
};

export const buildInstagramCaption = (video) => {
  const jobLabel = getJobLabel(video?.job);
  const caption = [
    `Nuevo registro en terreno: ${jobLabel}.`,
    'Puesta a tierra con foco en seguridad, orden y continuidad para instalaciones en Chile.',
    'RIC N06 se revisa segun el proyecto.',
  ].join(' ');

  return truncate(caption, INSTAGRAM_LIMIT);
};

const hasVideos = (videos) => Array.isArray(videos) && videos.length > 0;

export const renderYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = hasVideos(payload?.videos) ? payload.videos : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map((video) => {
    const url = normalizeText(video?.url) || 'URL no disponible';

    return [
      '1) URL',
      url,
      '',
      '2) Copy LinkedIn empresa',
      buildLinkedInCopy(video),
      '',
      '3) Caption Instagram',
      buildInstagramCaption(video),
    ].join('\n');
  }).join('\n\n---\n\n');
};

export const isYoutubeUploadBatchEvent = (payload = {}) => payload?.event === 'youtube_upload_batch';
