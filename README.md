# IRON MERIDIAN — 1936 전략 시뮬레이션 트레일러

Remotion으로 만든 1936년 세계지도 기반 시네마틱 트레일러입니다. 평면 지도 위에 CSS 3D 원근 카메라(2.5D), 레이어 분리(지도 / 오버레이 / 구름 2층 / 대기 헤이즈 / HUD), 애니메이션 오버레이를 얹어 영상감을 만듭니다.

- 1920×1080, 30fps, **82.8초 (2484프레임)**, H.264 MP4
- 결과물: `output/trailer.mp4` (`npm run render:root` 실행 시 `/output/trailer.mp4`에도 복사)

## 빠른 시작

```bash
npm install
npm run build:assets      # (선택) 지도·텍스처·오디오 에셋 재생성. 이미 커밋되어 있음
npm run studio            # Remotion Studio 미리보기
npm run render            # → output/trailer.mp4
npm run render:root       # → output/trailer.mp4 + /output/trailer.mp4
```

Remotion은 첫 렌더 때 Chrome Headless Shell을 자동으로 받습니다. 이미 설치된 브라우저를 쓰려면:

```bash
REMOTION_BROWSER=/path/to/chrome-headless-shell npm run render
```

FFmpeg를 따로 쓰고 싶다면 이미지 시퀀스로 뽑은 뒤 직접 인코딩할 수도 있습니다.

```bash
npx remotion render src/index.ts Trailer out/frames --sequence --image-format=jpeg
npx remotion render src/index.ts Trailer out/audio.wav            # 오디오만
ffmpeg -framerate 30 -i out/frames/element-%04d.jpeg -i out/audio.wav \
  -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -shortest output/trailer.mp4
```

## 폴더 구조

```
src/
  index.ts / Root.tsx / Trailer.tsx    엔트리, 컴포지션, 전체 타임라인(TransitionSeries + 사운드트랙)
  config/
    video.ts        해상도·FPS
    scenes.ts       ★ 장면 순서·길이·전환 종류·카메라 키프레임 (편집 포인트)
    text.ts         화면 텍스트 (1936 / 지역명 / 타이틀)
    audio.ts        음악·효과음 파일 연결과 큐 시트 (장면 기준 프레임)
    locations.ts    도시·지점 좌표 (경도, 위도)
    theme.ts        저채도 색상 체계·폰트
    map.json        투영 설정 + 고해상도 디테일 패치 영역
    mapProjection.ts  경위도 → 지도 픽셀 변환, 지도 이미지 연결
  components/
    MapStage.tsx            3D 카메라 + 지도 평면 + 오버레이 + 구름 시차 레이어 + 대기 헤이즈
    camera/CameraMotion.ts  키프레임 보간 (구간별 easing, 로그 스케일 줌, 핸드헬드 드리프트)
    overlays/               PolityHighlight(국경 트레이스+채움), PulseMarker(점멸 마커),
                            ArrowPath(작전 화살표), RouteLine(해상/철도 경로), FrontLine(전선),
                            SpreadHighlight(확산형 하이라이트), MapLabel(지도 위 국가명)
    ui/                     HudFrame, RegionTitle, CinematicLayer(비네트·그레인), LightSweep, Flash, FontLoader
    transitions/            lightSweep, mapOverlay, uiInterface, dipToBlack 커스텀 전환
  scenes/                   장면 컴포넌트 9개
  assets/
    map/        world1936.jpg(8192px 기본 지도), detail-*.jpg(4배 해상도 근접용 패치), world1936.svg(벡터 원본)
    data/       polities.json (주요 열강 윤곽선 – 하이라이트 애니메이션용)
    textures/   clouds.png, grain.png
    audio/      music/score.wav, sfx/*.wav (절차적 생성 자리표시자)
    fonts/      Barlow Condensed, IBM Plex Mono (OFL)
scripts/
  build-map.mjs   역사 GeoJSON → 1936 정치 색상 지도(SVG/JPG), 디테일 패치, 윤곽 데이터, 텍스처
  gen-audio.mjs   자리표시자 배경음악·효과음 합성
  stills.mjs      확인용 스틸 렌더 (node scripts/stills.mjs <dir> <frame...>)
data/source/      원본 GeoJSON
output/           렌더 결과
```

## 장면 구성 (scenes.ts)

| # | 장면 | 길이 | 카메라 | 나가는 전환 |
|---|------|------|--------|-------------|
| 1 | 인트로 – 암전에서 지도 등장, "1936" | 9.0s | 정면 탑뷰, 느린 줌 아웃 | 광선 스윕 |
| 2 | 유럽 – 독일·이탈리아 국경 강조, 라인란트 확산 하이라이트 | 10.0s | 느린 줌 인 → 사선 틸트 + 회전 | 하드 컷 (다른 각도) |
| 3 | 이베리아 – 스페인 내전 전선, 진격 화살표 | 7.0s | 저공 사선 트래킹 샷 | 지도 오버레이(그리드) |
| 4 | 동아시아 – 일본·만주국 해칭, 조선–만주 철도, 화북 압박 | 11.0s | 좌→우 패닝 → 만주/한반도 근접 확대 + 회전 | UI 인터페이스(데이터 밴드) |
| 5 | 아프리카·중동 – 제국 생명선, 에티오피아 병합, 식민지 구도 | 11.0s | 상→하 이동 → 근접 → 광역 | 암전 디졸브 |
| 6 | 북미·태평양 – 대서양 수송로, 태평양 항로·점멸 거점 | 12.0s | 대서양 횡단 사선 트래킹 → 광역 태평양 | 슬라이드 |
| 7 | 몽타주 – 6컷 교차 편집 (베를린·도쿄·모스크바·수에즈·로마·워싱턴) | 8.2s | 컷마다 다른 높이/틸트/회전, 플래시 컷 | 광선 스윕 |
| 8 | 클라이맥스 – 전 전선·화살표·경로·마커 중첩 | 12.0s | 유럽→동아시아→아프리카 급이동 후 중앙 정지 | 페이드 |
| 9 | 엔딩 – 어두운 지도 + 타이틀, 페이드아웃 | 9.0s | 미세 푸시 인 | — |

전환·컷: 장면 간 8회 + 몽타주 내부 컷 5회 + 장면 내부 카메라 전환 다수.

## 수정 방법

- **장면 길이 / 전환 바꾸기**: `src/config/scenes.ts`의 `SCENES` 배열. `out.kind`는 `cut | fade | dip | lightSweep | mapOverlay | uiInterface | slide`.
- **카메라 경로**: 같은 파일의 `CAMERAS`. 키프레임 = `{at, center:[lon,lat], zoom, tilt, rotate, ease}`. `zoom 0.24` ≈ 세계 전체 폭, `tilt`은 도 단위 피치, `ease`는 그 키프레임에 도달할 때의 곡선(`inOut | out | in | snap | glide | linear`).
- **텍스트**: `src/config/text.ts`.
- **지도 교체**: 동일 투영(등장방형, 위도 84°N~60°S, 폭 8192px)의 이미지를 `src/assets/map/world1936.jpg`에 덮어쓰면 됩니다. 다른 크기/범위면 `map.json`을 함께 수정. 근접 화질용 패치(`detail-*.jpg`)는 `map.json`의 `detailPatches`로 정의되며 `npm run build:map`으로 재생성됩니다.
- **음악·효과음 교체**: `src/assets/audio/music/score.wav`, `sfx/*.wav`를 같은 이름으로 교체하거나 `src/config/audio.ts`의 import를 변경. 효과음 타이밍은 `SFX_CUES` (장면 기준 프레임).
- **정치 색상 / 국가 매핑**: `scripts/build-map.mjs`의 `PALETTE`, `POLITY_BY_NAME`.

## 데이터 및 라이선스 메모

- 국경 데이터: [aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps) (GPL-3.0)의 `world_1938`을 기반으로, 1936년 기준으로 보정(오스트리아는 `world_1930`에서 복원, 에티오피아는 이탈리아령, 인도차이나는 프랑스령 등). 역사 지도 데이터 특성상 국경은 근사치입니다.
- 이베리아 전선·화북 전선 등은 연출용 근사선입니다.
- 폰트: Barlow Condensed, IBM Plex Mono (SIL OFL, @fontsource).
- 음악·효과음은 `scripts/gen-audio.mjs`로 합성한 자리표시자입니다. 특정 게임의 로고·UI·아트·영상은 사용하지 않았습니다.
