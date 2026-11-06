import type React from 'react';
import type {SceneId} from '../config/scenes';
import {IntroScene} from './IntroScene';
import {EuropeScene} from './EuropeScene';
import {IberiaScene} from './IberiaScene';
import {EastAsiaScene} from './EastAsiaScene';
import {AfricaScene} from './AfricaScene';
import {AmericasScene} from './AmericasScene';
import {MontageScene} from './MontageScene';
import {ClimaxScene} from './ClimaxScene';
import {EndingScene} from './EndingScene';

export const SCENE_COMPONENTS: Record<SceneId, React.FC> = {
  intro: IntroScene,
  europe: EuropeScene,
  iberia: IberiaScene,
  eastAsia: EastAsiaScene,
  africa: AfricaScene,
  americas: AmericasScene,
  montage: MontageScene,
  climax: ClimaxScene,
  ending: EndingScene,
};
