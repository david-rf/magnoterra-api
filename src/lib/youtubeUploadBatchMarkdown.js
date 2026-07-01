const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const CONTACT_CTA = 'magnoterra.cl/contacto';
const DEFAULT_JOB = 'puesta a tierra y continuidad operacional';

const normalizeWhitespace = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const stripRestrictedClaims = (value) => normalizeWhitespace(value)
  .replace(/\b\d+(?:[.,]\d+)?\s*\u03a9/gi, '')
  .replace(/\b\d+(?:[.,]\d+)?\s*(?:ohms?|ohmios?|omega)\b/gi, '')
  .replace(/\b(?:cert(?:ificado|ificacion|ificación)?\.?\s*)?SEC\b/gi, '')
  .replace(/\u03a9/gi, '')
  .replace(/\b(?:cifras?\s*)?(?:ohms?|ohmios?|omega)\b/gi, '')
  .replace(/\s+/g, ' ')
  .trim();

const truncate = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};

const getJobLabel = (job) => {
  const sanitizedJob = stripRestrictedClaims(job);
  return truncate(sanitizedJob || DEFAULT_JOB, 180);
};

const buildLinkedInCopy = (job) => {
  const jobLabel = getJobLabel(job);
  const copy = [
    `Nuevo video de Magno Terra: ${jobLabel}.`,
    '',
    'Mostramos criterios prácticos para planificar, ejecutar y revisar soluciones de puesta a tierra en terreno, con foco en seguridad, continuidad operacional y trazabilidad técnica. Cada proyecto requiere evaluar condiciones del sitio, alcance y normativa aplicable; RIC N06 se considera cuando corresponde al proyecto.',
    '',
    `Conversemos sobre tu instalación: ${CONTACT_CTA}`,
    '',
    REQUIRED_HASHTAGS,
  ].join('\n');

  return truncate(copy, 900);
};

const buildInstagramCaption = (job) => {
  const jobLabel = getJobLabel(job);
  const caption = `Nuevo video: ${jobLabel}. Puesta a tierra con enfoque técnico, revisión en terreno y soluciones acordes al proyecto. Si necesitas apoyo para tu instalación, conversemos en ${CONTACT_CTA}`;

  return truncate(caption, 500);
};

export const buildYoutubeUploadBatchMarkdown = (payload) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map((video, index) => {
    const url = normalizeWhitespace(video?.url);

    return [
      `## Video ${index + 1}`,
      '',
      `1) URL: ${url}`,
      '',
      '2) Copy LinkedIn empresa:',
      '',
      buildLinkedInCopy(video?.job),
      '',
      '3) Caption Instagram:',
      '',
      buildInstagramCaption(video?.job),
    ].join('\n');
  }).join('\n\n---\n\n');
};

export const socialCopyRules = {
  CONTACT_CTA,
  REQUIRED_HASHTAGS,
};
