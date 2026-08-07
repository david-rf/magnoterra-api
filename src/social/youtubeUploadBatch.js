export const YOUTUBE_UPLOAD_BATCH_EVENT = 'youtube_upload_batch';

const CONTACT_CTA = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const MAX_LINKEDIN_CHARS = 900;
const MAX_INSTAGRAM_CHARS = 500;
const DEFAULT_JOB_SUMMARY = 'un nuevo trabajo de puesta a tierra en terreno';

const FORBIDDEN_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:omega|ohm(?:s|ios)?|Ω)\b/gi,
  /\bomega\b/gi,
  /Ω/g,
  /\bohm(?:s|ios)?\b/gi,
  /\bcert(?:ificacion|ificado|ifica|\.?)\b/gi,
  /\bSEC\b/g,
  /\bRIC\s*N\s*0?6\b/gi,
];

const collapseWhitespace = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const sanitizeForCopy = (value) => {
  const text = collapseWhitespace(value);
  const sanitized = FORBIDDEN_PATTERNS.reduce(
    (current, pattern) => current.replace(pattern, ''),
    text,
  )
    .replace(/[()[\]{}*_`>#|~]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();

  return sanitized || DEFAULT_JOB_SUMMARY;
};

const summarizeJob = (job) => {
  if (typeof job === 'string') {
    return sanitizeForCopy(job);
  }

  if (job && typeof job === 'object') {
    const candidate = job.title || job.name || job.tipo || job.type || job.description;
    return sanitizeForCopy(candidate);
  }

  return DEFAULT_JOB_SUMMARY;
};

const truncate = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}.`;
};

const fitBetween = ({ prefix, middle, suffix, maxLength }) => {
  const available = maxLength - prefix.length - suffix.length;
  const fittedMiddle = truncate(middle, Math.max(0, available));

  return `${prefix}${fittedMiddle}${suffix}`;
};

export const normalizeVideoUrl = (video) => {
  const url = collapseWhitespace(video?.url);

  if (url) {
    return url;
  }

  const videoId = collapseWhitespace(video?.video_id);
  return videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : '';
};

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos
    .map((video) => {
      const url = normalizeVideoUrl(video);
      const jobSummary = summarizeJob(video?.job);
      const linkedIn = fitBetween({
        prefix: 'Nuevo video de Magno Terra: ',
        middle: jobSummary,
        suffix: `. En cada proyecto de puesta a tierra, combinamos diagnostico, diseno y ejecucion en terreno para apoyar instalaciones mas seguras y continuidad operacional. Agenda una conversacion en ${CONTACT_CTA}. ${REQUIRED_HASHTAGS}`,
        maxLength: MAX_LINKEDIN_CHARS,
      });
      const instagram = fitBetween({
        prefix: 'Nuevo video: ',
        middle: jobSummary,
        suffix: `. Trabajo tecnico en terreno, foco en seguridad y continuidad operacional. Contacto: ${CONTACT_CTA}.`,
        maxLength: MAX_INSTAGRAM_CHARS,
      });

      return [
        `1) URL: ${url}`,
        `2) Copy LinkedIn empresa: ${linkedIn}`,
        `3) Caption Instagram: ${instagram}`,
      ].join('\n');
    })
    .join('\n\n');
};
