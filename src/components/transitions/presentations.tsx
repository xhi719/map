import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';

type Empty = Record<string, never>;

/* ---------- Light sweep: a bright diagonal beam wipes the new scene in ---------- */
const LightSweepComp: React.FC<TransitionPresentationComponentProps<Empty>> = ({children, presentationDirection, presentationProgress}) => {
  const p = Easing.inOut(Easing.cubic)(presentationProgress);
  const edge = -20 + p * 140; // percent
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill style={{filter: `brightness(${1 + p * 0.6})`}}>{children}</AbsoluteFill>;
  }
  const mask = `linear-gradient(105deg, #000 ${edge - 12}%, transparent ${edge}%)`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{WebkitMaskImage: mask, maskImage: mask}}>{children}</AbsoluteFill>
      <AbsoluteFill
        style={{
          mixBlendMode: 'screen', pointerEvents: 'none',
          background: `linear-gradient(105deg, rgba(255,236,190,0) ${edge - 16}%, rgba(255,236,190,${0.55 * Math.sin(Math.PI * p)}) ${edge - 4}%, rgba(255,236,190,0) ${edge + 6}%)`,
        }}
      />
    </AbsoluteFill>
  );
};
export const lightSweep = (): TransitionPresentation<Empty> => ({component: LightSweepComp, props: {} as Empty});

/* ---------- Map overlay: the scene dissolves into a cartographic grid, then the next resolves out of it ---------- */
const GRID = 'repeating-linear-gradient(0deg, rgba(143,179,196,0.35) 0 1px, transparent 1px 60px), repeating-linear-gradient(90deg, rgba(143,179,196,0.35) 0 1px, transparent 1px 60px)';
const MapOverlayComp: React.FC<TransitionPresentationComponentProps<Empty>> = ({children, presentationDirection, presentationProgress}) => {
  const p = presentationProgress;
  if (presentationDirection === 'exiting') {
    const k = Math.min(1, p * 2);
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{opacity: 1 - k, filter: `contrast(${1 + k}) brightness(${1 - k * 0.4}) blur(${k * 3}px)`}}>{children}</AbsoluteFill>
        <AbsoluteFill style={{background: GRID, opacity: Math.sin(Math.PI * Math.min(1, p * 1.4)), transform: `scale(${1 + p * 0.08})`}} />
      </AbsoluteFill>
    );
  }
  const k = Math.max(0, p * 2 - 1);
  const r = Easing.out(Easing.cubic)(k) * 140;
  const mask = `radial-gradient(circle at 50% 50%, #000 ${r - 10}%, transparent ${r}%)`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{WebkitMaskImage: mask, maskImage: mask, opacity: k > 0 ? 1 : 0}}>{children}</AbsoluteFill>
      <AbsoluteFill style={{background: GRID, opacity: (1 - k) * (p > 0.5 ? 1 : 0), transform: `scale(${1.04 - k * 0.04})`}} />
    </AbsoluteFill>
  );
};
export const mapOverlay = (): TransitionPresentation<Empty> => ({component: MapOverlayComp, props: {} as Empty});

/* ---------- UI interface: horizontal data-bands slice the new scene in, with frame brackets ---------- */
const UiComp: React.FC<TransitionPresentationComponentProps<Empty>> = ({children, presentationDirection, presentationProgress}) => {
  const p = Easing.inOut(Easing.quad)(presentationProgress);
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill style={{filter: `saturate(${1 - p}) brightness(${1 - p * 0.5})`, transform: `scale(${1 + p * 0.03})`}}>{children}</AbsoluteFill>;
  }
  const band = 54;
  const open = p * band;
  const mask = `repeating-linear-gradient(to bottom, #000 0 ${open}px, transparent ${open}px ${band}px)`;
  const brackets = Math.sin(Math.PI * p);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{WebkitMaskImage: mask, maskImage: mask}}>{children}</AbsoluteFill>
      <AbsoluteFill style={{pointerEvents: 'none', opacity: brackets}}>
        <svg width={1920} height={1080}>
          <rect x={160 - 100 * p} y={110 - 60 * p} width={1600 + 200 * p} height={860 + 120 * p} fill="none" stroke="#d9d4c3" strokeOpacity={0.6} strokeWidth={2} strokeDasharray="60 1400" strokeDashoffset={-p * 400} />
          <line x1={0} x2={1920} y1={1080 * p} y2={1080 * p} stroke="#8fb3c4" strokeOpacity={0.7} strokeWidth={2} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
export const uiInterface = (): TransitionPresentation<Empty> => ({component: UiComp, props: {} as Empty});

/* ---------- Dip: fade through black (heavier than a cross-fade) ---------- */
const DipComp: React.FC<TransitionPresentationComponentProps<Empty>> = ({children, presentationDirection, presentationProgress}) => {
  const p = presentationProgress;
  const o = presentationDirection === 'exiting' ? Math.max(0, 1 - p * 2) : Math.max(0, p * 2 - 1);
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};
export const dipToBlack = (): TransitionPresentation<Empty> => ({component: DipComp, props: {} as Empty});
