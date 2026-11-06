import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
// 3D transforms of large textures render reliably with ANGLE (software fallback in CI containers).
Config.setChromiumOpenGlRenderer('angle');
Config.setConcurrency(4);
// Use a pre-installed Chrome headless shell if available (e.g. in sandboxed CI). Remove to let Remotion download its own.
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
