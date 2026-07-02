const CONTACT_CTA = 'Conversemos en magnoterra.cl/contacto';
const HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';

const compactWhitespace = (value) => value.replace(/\s+/g, ' ').trim();

const stringifyJob = (job) => {
  if (!job) {
    return '';
  }

  if (typeof job === 'string') {
    return compactWhitespace(job);
  }

  if (typeof job !== 'object') {
    return compactWhitespace(String(job));
  }

  const parts = [
    job.title,
    job.name,
    job.project,
    job.service,
    job.location,
    job.description,
  ].filter(Boolean);

  return compactWhitespace(parts.join(' '));
};

const removeRestrictedClaims = (value) =>
  compactWhitespace(
    value
      .replace(/\b\d+(?:[.,]\d+)?\s*(?:ohmios?|ohms?|omega|\u03a9)\b/gi, '')
      .replace(/\b(?:certificaci[o\u00f3]n|certificado|cert)\s+SEC\b/gi, '')
      .replace(/\bSEC\b/g, '')
      .replace(/\bRIC\s*N(?:\u00b0|\u00ba|o\.?)?\s*06\b/gi, '')
  );

const clip = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  const shortened = value.slice(0, maxLength - 1).trimEnd();
  return `${shortened}...`;
};

const buildContext = (job) => {
  const context = removeRestrictedClaims(stringifyJob(job));
  return context || 'un proyecto de puesta a tierra';
};

export const buildLinkedInCopy = (video) => {
  const context = buildContext(video.job);
  const copy = [
    `Compartimos un nuevo registro de ${context}.`,
    'En Magno Terra abordamos cada obra con diagnostico tecnico, coordinacion en terreno y soluciones de puesta a tierra ajustadas a las condiciones reales del proyecto.',
    'Cuando corresponde aplicar RIC N06, su alcance debe revisarse segun las caracteristicas y exigencias de cada proyecto.',
    CONTACT_CTA,
    HASHTAGS,
  ].join('\n\n');

  return clip(copy, 900);
};

export const buildInstagramCaption = (video) => {
  const context = buildContext(video.job);
  const caption = [
    `Nuevo registro en terreno: ${context}.`,
    'Puesta a tierra con criterio tecnico, revision del proyecto y ejecucion responsable.',
    'Hablemos en magnoterra.cl/contacto',
  ].join('\n\n');

  return clip(caption, 500);
};

export const buildYoutubeUploadBatchMarkdown = (payload) => {
  if (
    !payload ||
    !Array.isArray(payload.videos) ||
    payload.videos.length === 0
  ) {
    return 'NO_VIDEOS';
  }

  return payload.videos
    .map((item, index) => {
      const video = item || {};
      const url =
        video.url || `https://www.youtube.com/watch?v=${video.video_id}`;

      return [
        `### Video ${index + 1}`,
        '',
        `1. URL: ${url}`,
        '',
        '2. Copy LinkedIn empresa:',
        '',
        buildLinkedInCopy(video),
        '',
        '3. Caption Instagram:',
        '',
        buildInstagramCaption(video),
      ].join('\n');
    })
    .join('\n\n---\n\n');
};
