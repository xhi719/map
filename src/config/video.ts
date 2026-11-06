export const VIDEO = {
  id: 'Trailer',
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

export const sec = (s: number) => Math.round(s * VIDEO.fps);
