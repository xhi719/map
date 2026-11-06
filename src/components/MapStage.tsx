import React, {useMemo} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {DETAIL_PATCHES, MAP, project} from '../config/mapProjection';
import {THEME} from '../config/theme';
import cloudsTex from '../assets/textures/clouds.png';
import {evaluateCamera, type CameraPath} from './camera/CameraMotion';
import {CameraProvider} from './camera/CameraContext';

export type MapStageProps = {
  camera: CameraPath;
  /** SVG overlay elements drawn in map pixel space (they tilt/zoom with the map). */
  children?: React.ReactNode;
  /** Screen-space elements (HUD, titles) drawn above the map. */
  screen?: React.ReactNode;
  /** Opacity of the parallax cloud layers (0 disables). */
  clouds?: number;
  /** Darken the map (0 = none, 1 = black). */
  dim?: number;
  /** Optional frame offset into the camera path (used by montage shots). */
  frameOffset?: number;
  perspective?: number;
};

const COPIES = [-1, 0, 1];

/**
 * The 2.5D map world: a flat map plane viewed by a perspective camera, with an
 * in-plane SVG overlay and cloud planes floating at different heights for parallax.
 */
export const MapStage: React.FC<MapStageProps> = ({
  camera,
  children,
  screen,
  clouds = 0.5,
  dim = 0,
  frameOffset = 0,
  perspective = 1500,
}) => {
  const frame = useCurrentFrame() + frameOffset;
  const cam = useMemo(() => evaluateCamera(camera, frame), [camera, frame]);
  const [x, y] = project([cam.lon, cam.lat]);
  const tiltK = Math.min(1, cam.tilt / 60);

  const planeTransform = `rotateX(${cam.tilt}deg) rotateZ(${cam.rotate}deg) scale(${cam.zoom}) translate(${-x}px, ${-y}px)`;

  return (
    <CameraProvider value={cam}>
      <AbsoluteFill style={{background: THEME.background, overflow: 'hidden'}}>
        <AbsoluteFill style={{perspective, perspectiveOrigin: '50% 45%'}}>
          <div
            style={{
              position: 'absolute',
              left: 960,
              top: 540,
              width: 0,
              height: 0,
              transformStyle: 'preserve-3d',
              transformOrigin: '0 0',
              transform: planeTransform,
            }}
          >
            {COPIES.map((i) => (
              <Img
                key={i}
                src={MAP.image}
                style={{position: 'absolute', left: i * MAP.width, top: 0, width: MAP.width, height: MAP.height}}
              />
            ))}
            {/* Sharper raster patches for close-ups (only when zoomed in enough to matter). */}
            {cam.zoom > 0.9 &&
              DETAIL_PATCHES.map((p) => (
                <Img key={p.id} src={p.src} style={{position: 'absolute', left: p.x, top: p.y, width: p.w, height: p.h}} />
              ))}
            <svg
              width={MAP.width}
              height={MAP.height}
              viewBox={`0 0 ${MAP.width} ${MAP.height}`}
              style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', transform: 'translateZ(1px)'}}
            >
              {children}
            </svg>
            {clouds > 0 &&
              [
                {z: 140, size: 5200, op: 0.55, speed: 0.6},
                {z: 320, size: 7600, op: 0.35, speed: 1.1},
              ].map((l, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: -MAP.width,
                    top: -MAP.height * 0.25,
                    width: MAP.width * 3,
                    height: MAP.height * 1.5,
                    transform: `translateZ(${l.z}px)`,
                    backgroundImage: `url(${cloudsTex})`,
                    backgroundSize: `${l.size}px ${l.size / 2}px`,
                    backgroundPosition: `${frame * l.speed * 4}px ${frame * l.speed}px`,
                    opacity: clouds * l.op,
                    pointerEvents: 'none',
                  }}
                />
              ))}
          </div>
        </AbsoluteFill>
        {/* Atmospheric depth: haze toward the horizon when the camera is pitched. */}
        <AbsoluteFill
          style={{
            background: `linear-gradient(to bottom, rgba(10,18,23,${0.92 * tiltK}) 0%, rgba(24,36,40,${0.55 * tiltK}) 18%, rgba(10,18,23,0) ${30 + 20 * tiltK}%)`,
          }}
        />
        {dim > 0 && <AbsoluteFill style={{background: `rgba(4,8,10,${dim})`}} />}
        {screen}
      </AbsoluteFill>
    </CameraProvider>
  );
};
