# 원본 및 포팅 기록

- 저장소: https://github.com/t0mark/ros-tutorial
- 브랜치: `ros`
- 기준 커밋: `d0a80736926ba7235ca79bb6ca427ebf0aa6e144`
- 가져온 날짜: 2026-10-23
- 원본 설명: [UPSTREAM-README.md](UPSTREAM-README.md)

`src/`, HTML 진입점, 패키지 정의와 TypeScript 설정을 가져왔습니다. 원본 `.git`, GitHub Actions 배포 설정은 가져오지 않았습니다. 이 프로젝트는 기존 `/docs` 브랜치 배포 방식을 사용합니다.

포팅 변경: 빌드 출력 경로를 `docs/tools/ros/`로 지정하고, 상대 자산 경로와 세 HTML 진입점을 유지했습니다. 교재 목차·사용 안내 링크를 추가했습니다. Vite 및 전이 의존성을 업데이트했습니다.

## 라이선스 확인

위 커밋의 파일 트리에는 LICENSE/COPYING 파일과 package.json의 license 필드가 없습니다. 원본 코드에 임의의 라이선스를 부여하지 않았습니다. 출판물 부속 자료나 공개 재배포 시 원저작자의 이용 허락·라이선스를 확인해야 합니다.

외부 패키지의 라이선스는 각 패키지에 따릅니다. 배포 시 함께 보존할 고지는 `public/THIRD-PARTY-NOTICES.txt`이며, 빌드 결과에 복사됩니다.
