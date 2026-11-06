import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate} from 'remotion';
import {TransitionSeries, linearTiming, type TransitionPresentation} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {SCENES, sceneStart, totalFrames, type TransitionKind} from './config/scenes';
import {MUSIC, SFX, SFX_CUES} from './config/audio';
import {SCENE_COMPONENTS} from './scenes';
import {CinematicLayer} from './components/ui';
import {dipToBlack, lightSweep, mapOverlay, uiInterface} from './components/transitions/presentations';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const presentationFor = (kind: TransitionKind): TransitionPresentation<any> => {
  switch (kind) {
    case 'fade': return fade();
    case 'dip': return dipToBlack();
    case 'lightSweep': return lightSweep();
    case 'mapOverlay': return mapOverlay();
    case 'uiInterface': return uiInterface();
    case 'slide': return slide({direction: 'from-right'});
    default: return fade();
  }
};

const Soundtrack: React.FC = () => {
  const total = totalFrames();
  return (
    <>
      <Audio
        src={MUSIC.src}
        volume={(f) =>
          MUSIC.volume *
          Math.min(
            interpolate(f, [0, MUSIC.fadeInFrames], [0, 1], {extrapolateRight: 'clamp'}),
            interpolate(f, [total - MUSIC.fadeOutFrames, total], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
          )
        }
      />
      {SFX_CUES.map((c, i) => (
        <Sequence key={i} from={sceneStart(c.scene) + c.at} durationInFrames={120} layout="none">
          <Audio src={SFX[c.sfx]} volume={c.volume ?? 0.6} />
        </Sequence>
      ))}
    </>
  );
};

export const Trailer: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <TransitionSeries>
      {SCENES.flatMap((s) => {
        const Comp = SCENE_COMPONENTS[s.id];
        const nodes = [
          <TransitionSeries.Sequence key={s.id} durationInFrames={s.duration}>
            <Comp />
          </TransitionSeries.Sequence>,
        ];
        if (s.out && s.out.kind !== 'cut' && s.out.frames > 0) {
          nodes.push(
            <TransitionSeries.Transition
              key={`${s.id}-out`}
              presentation={presentationFor(s.out.kind)}
              timing={linearTiming({durationInFrames: s.out.frames})}
            />,
          );
        }
        return nodes;
      })}
    </TransitionSeries>
    <CinematicLayer />
    <Soundtrack />
  </AbsoluteFill>
);
