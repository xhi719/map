import React, {createContext, useContext} from 'react';
import type {CameraState} from './CameraMotion';

export const CameraContext = createContext<CameraState>({lon: 0, lat: 0, zoom: 1, tilt: 0, rotate: 0});
export const useCamera = () => useContext(CameraContext);
export const CameraProvider: React.FC<{value: CameraState; children: React.ReactNode}> = ({value, children}) => (
  <CameraContext.Provider value={value}>{children}</CameraContext.Provider>
);
