import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {THEME} from '../../config/theme';

type Props = {text: string; start?: number; end: number; align?: 'left' | 'right'};

/** Lower-third region name with a brass rule. Stays clear of the map centre. */
export const RegionTitle: React.FC<Props> = ({text, start = 0, end, align = 'left'}) => {
  const frame = useCurrentFrame();
  const ease = Easing.out(Easing.cubic);
  const rule = ease(interpolate(frame, [start, start + 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const txt = ease(interpolate(frame, [start + 8, start + 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const out = interpolate(frame, [end - 16, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (frame < start) return null;
  const side = align === 'left' ? {left: 110} : {right: 110};
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: out}}>
      <div style={{position: 'absolute', bottom: 112, ...side, textAlign: align}}>
        <div
          style={{
            fontFamily: THEME.fonts.display, fontWeight: 600, fontSize: 50, color: THEME.ink,
            letterSpacing: `${0.32 + (1 - txt) * 0.25}em`, opacity: txt,
            transform: `translateY(${(1 - txt) * 14}px)`, textShadow: '0 2px 14px rgba(0,0,0,0.8)',
          }}
        >
          {text}
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexDirection: align === 'left' ? 'row' : 'row-reverse'}}>
          <div style={{width: 9, height: 9, background: THEME.accent, transform: 'rotate(45deg)', opacity: rule}} />
          <div style={{height: 2, width: 420 * rule, background: `linear-gradient(${align === 'left' ? 'to right' : 'to left'}, ${THEME.accent}, rgba(216,162,74,0))`}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
