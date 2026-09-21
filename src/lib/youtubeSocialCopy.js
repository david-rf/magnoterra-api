const LINKEDIN_LIMIT = 900;
const INSTAGRAM_LIMIT = 500;
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const CONTACT_CTA = 'Conversemos en magnoterra.cl/contacto';

const FORBIDDEN_NUMBERED_OMEGA =
  /(?:\d+(?:[.,]\d+)?\s*(?:omega|ohm(?:io)?s?|[oO]hm|Ω)|(?:omega|ohm(?:io)?s?|[oO]hm|Ω)\s*\d+(?:[.,]\d+)?)/gi;
const FORBIDDEN_SEC_CERT = /\b(?:cert(?:ificacion|ificado|\.?)\s*)?SEC\b/gi;

const toText = (value) => {
  if (typeof value === 'string') {
    return value;
  }

  if (value == null) {
    return '';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(toText).filter(Boolean).join(' ');
  }

  if (typeof value === 'object') {
    const preferredKeys = [
      'title',
      'name',
      'nombre',
      'project',
      'proyecto',
      'service',
      'servicio',
      'location',
      'ubicacion',
    ];
    const parts = preferredKeys
      .map((key) => value[key])
      .filter((part) => part !== undefined && part !== null)
      .map(toText)
      .filter(Boolean);

    return parts.join(' ');
  }

  return '';
};

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();

export const sanitizeMarketingText = (value) => {
  const cleaned = normalizeWhitespace(
    toText(value)
      .replace(FORBIDDEN_NUMBERED_OMEGA, '')
      .replace(FORBIDDEN_SEC_CERT, '')
      .replace(/[<>]/g, '')
  );

  return cleaned.slice(0, 180);
};

const truncate = (value, limit) => {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
};

const fitWithSuffix = (body, suffix, limit) => {
  const separator = body.endsWith('\n') ? '' : '\n\n';
  const suffixWithSeparator = `${separator}${suffix}`;
  const bodyLimit = limit - suffixWithSeparator.length;

  if (bodyLimit <= 0) {
    return truncate(suffix, limit);
  }

  return `${truncate(body, bodyLimit)}${suffixWithSeparator}`;
};

const videoUrl = (video) => normalizeWhitespace(String(video?.url || ''));

const jobContext = (job) => {
  const sanitized = sanitizeMarketingText(job);
  return sanitized ? ` en ${sanitized}` : '';
};

export const buildLinkedInCopy = (video) => {
  const context = jobContext(video?.job);
  const body = [
    `Nuevo registro de terreno Magno Terra${context}.`,
    'Mostramos parte del proceso profesional de puesta a tierra: diagnostico, ejecucion y verificacion tecnica segun el alcance real de cada instalacion.',
    'La aplicacion de RIC N06 queda condicionada al proyecto, sus riesgos y los requerimientos definidos para la obra.',
    CONTACT_CTA,
  ].join('\n\n');

  return fitWithSuffix(body, LINKEDIN_HASHTAGS, LINKEDIN_LIMIT);
};

export const buildInstagramCaption = (video) => {
  const context = jobContext(video?.job);
  const caption = [
    `Puesta a tierra en terreno${context}.`,
    'Trabajo tecnico, ordenado y definido segun las condiciones de cada proyecto. RIC N06 condicionado al proyecto.',
    'Magno Terra acompana desde la evaluacion hasta la solucion.',
  ].join(' ');

  return truncate(caption, INSTAGRAM_LIMIT);
};

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos)
    ? payload.videos.filter((video) => video && video.url)
    : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos
    .map((video) => {
      const url = videoUrl(video);

      return [
        `1) URL: ${url}`,
        `2) Copy LinkedIn empresa:\n${buildLinkedInCopy(video)}`,
        `3) Caption Instagram:\n${buildInstagramCaption(video)}`,
      ].join('\n\n');
    })
    .join('\n\n---\n\n');
};

export const limits = {
  linkedIn: LINKEDIN_LIMIT,
  instagram: INSTAGRAM_LIMIT,
};
