import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {project, type LonLat} from '../../config/mapProjection';
import {THEME} from '../../config/theme';
import {useCamera} from '../camera/CameraContext';
import {life, prog} from './anim';
import {arcPoints, pointAt, polylineLength, projectAll, sampleSmooth, toD} from './geometry';

type Props = {
  from: LonLat;
  to: LonLat;
  via?: LonLat[];
  bend?: number;
  start?: number;
  end?: number;
  duration?: number;
  color?: string;
  width?: number; // screen px
};

/** Operational arrow that grows along a curved path, with a tapered body and arrowhead. */
export const ArrowPath: React.FC<Props> = ({
  from, to, via, bend = 0.18, start = 0, end, duration = 45, color = THEME.alert, width = 7,
}) => {
  const frame = useCurrentFrame();
  const {zoom} = useCamera();
  const pts = useMemo(
    () => (via?.length ? sampleSmooth(projectAll([from, ...via, to])) : arcPoints(project(from), project(to), bend)),
    [from, to, via, bend],
  );
  const total = useMemo(() => polylineLength(pts), [pts]);
  if (frame < start) return null;
  const k = 1 / zoom;
  const p = prog(frame, start, duration);
  const alpha = life(frame, start, end ?? Infinity, 8);
  const len = total * p;
  const head = pointAt(pts, len);
  const w = width * k;
  // Body: shift the end back so the head covers it.
  const bodyPts = [] as typeof pts;
  let acc = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc > len - w) break;
    bodyPts.push(pts[i]);
  }
  const deg = (head.angle * 180) / Math.PI;
  return (
    <g opacity={alpha}>
      <path d={toD(bodyPts)} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={w * 1.6} strokeLinecap="round" transform={`translate(${2 * k},${3 * k})`} />
      <path d={toD(bodyPts)} fill="none" stroke={color} strokeOpacity={0.9} strokeWidth={w} strokeLinecap="butt" />
      <path d={toD(bodyPts)} fill="none" stroke={THEME.highlight} strokeOpacity={0.35} strokeWidth={w * 0.25} />
      {p > 0.02 && (
        <g transform={`translate(${head.p[0]},${head.p[1]}) rotate(${deg})`}>
          <path d={`M${w * 1.6},0 L${-w * 1.2},${-w * 1.35} L${-w * 0.6},0 L${-w * 1.2},${w * 1.35} Z`} fill={color} stroke={THEME.highlight} strokeOpacity={0.5} strokeWidth={0.8 * k} />
        </g>
      )}
    </g>
  );
};
