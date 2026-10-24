# Notion 동기화 CLI

이 디렉터리의 `notion.md`와 지정한 Notion 페이지를 Markdown 기반으로 양방향 동기화합니다. 실행 위치와 관계없이 스크립트 경로를 기준으로 파일을 찾습니다.

```bash
cd utils/notion
npm ci
cp .env.example .env
# .env에 NOTION_TOKEN, NOTION_PAGE_ID 설정
npm run sync
```

- `npm run sync`: 변경된 쪽을 반영합니다. 양쪽이 변경되면 로컬본을 백업하고 Notion 내용을 반영합니다.
- `npm run push`: 로컬 내용으로 Notion을 덮어씁니다.
- `npm run pull`: Notion 내용으로 로컬 파일을 덮어씁니다.

첫 동기화는 Notion을 기준으로 하며, Notion이 비어 있고 로컬 내용이 있으면 업로드합니다. 첫 동기화에서 서로 다른 로컬 내용을 내려받기로 대체할 때는 백업합니다. 강제 `push`·`pull`은 덮어쓰기 명령입니다.

`.env`, `.sync-state.json`, `notion.bak.md`, `notion.conflict-*.md`는 이 디렉터리에 저장되고 Git에서 제외됩니다. 이전 `notion/`에서 사용하던 환경 파일·상태·백업이 있다면 함께 이곳으로 옮겨 사용합니다.
