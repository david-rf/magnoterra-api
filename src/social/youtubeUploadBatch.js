const CONTACT_URL = 'magnoterra.cl/contacto';
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const NO_VIDEOS = 'NO_VIDEOS';
const DEFAULT_TOPIC = 'contenido sobre puesta a tierra';

const FORBIDDEN_REPLACEMENTS = [
  [/\b\d+(?:[.,]\d+)?\s*(?:omega|ohm(?:ios?)?)\b/gi, 'criterios tecnicos'],
  [/\d+(?:[.,]\d+)?\s*Ω/gi, 'criterios tecnicos'],
  [/\b(?:omega|ohm(?:ios?)?)\b/gi, 'puesta a tierra'],
  [/\bcert(?:\.|ificacion)?\s+SEC\b/gi, 'cumplimiento aplicable'],
  [/\bcertificacion\s+SEC\b/gi, 'cumplimiento aplicable'],
  [/\bSEC\b/g, 'cumplimiento aplicable'],
];

const cleanText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  let text = value
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[<>[\]()`*_#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  for (const [pattern, replacement] of FORBIDDEN_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }

  return text.replace(/\s+/g, ' ').trim();
};

const truncateAtWord = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.slice(0, Math.max(0, maxLength - 1));
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 20) {
    return `${truncated.slice(0, lastSpace).trim()}...`;
  }

  return `${truncated.trim()}...`;
};

const getJobTopic = (job, maxLength) => {
  const rawTopic =
    typeof job === 'string'
      ? job
      : job?.title || job?.name || job?.description || job?.type || '';
  const topic = cleanText(rawTopic) || DEFAULT_TOPIC;

  return truncateAtWord(topic, maxLength);
};

const fitTopic = (topic, prefix, suffix, maxLength) => {
  const available = maxLength - prefix.length - suffix.length;

  if (available <= 0) {
    return '';
  }

  return truncateAtWord(topic, available);
};

export const formatVideoSocialMarkdown = (video) => {
  const url = cleanText(video?.url || video?.video_id || '');
  const topic = getJobTopic(video?.job, 160);

  const linkedinPrefix = 'Nuevo video: ';
  const linkedinSuffix =
    `. En Magno Terra acompanamos a empresas y equipos tecnicos en sistemas de puesta a tierra con foco en seguridad, continuidad operacional y decisiones ajustadas al alcance real de la instalacion. Cuando corresponde al proyecto, revisamos criterios aplicables como RIC N06. Mira el video y conversemos sobre tu proyecto: ${CONTACT_URL}\n\n${LINKEDIN_HASHTAGS}`;
  const linkedinCopy = `${linkedinPrefix}${fitTopic(
    topic,
    linkedinPrefix,
    linkedinSuffix,
    900
  )}${linkedinSuffix}`;

  const instagramPrefix = 'Nuevo video: ';
  const instagramSuffix = `. Puesta a tierra para proyectos que necesitan seguridad, continuidad y revision tecnica segun su alcance. RIC N06 se revisa solo cuando corresponde al proyecto. Contacto: ${CONTACT_URL}`;
  const instagramCaption = `${instagramPrefix}${fitTopic(
    topic,
    instagramPrefix,
    instagramSuffix,
    500
  )}${instagramSuffix}`;

  return [
    `1. URL: ${url}`,
    `2. Copy LinkedIn empresa: ${linkedinCopy}`,
    `3. Caption Instagram: ${instagramCaption}`,
  ].join('\n');
};

export const formatYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];

  if (videos.length === 0) {
    return NO_VIDEOS;
  }

  return videos.map(formatVideoSocialMarkdown).join('\n\n---\n\n');
};

export { NO_VIDEOS };
