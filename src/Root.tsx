import React from 'react';
import {Composition} from 'remotion';
import {Trailer} from './Trailer';
import {VIDEO} from './config/video';
import {totalFrames} from './config/scenes';
import {loadFonts} from './components/ui';

loadFonts();

export const RemotionRoot: React.FC = () => (
  <Composition
    id={VIDEO.id}
    component={Trailer}
    durationInFrames={totalFrames()}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
);
