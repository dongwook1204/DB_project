# 공유 일기장

데이터프로그래밍 수행평가를 위한 공유 일기장 프로젝트입니다. React와 Vite로 회원 화면을 제공하고, Node.js와 Express 서버가 MySQL 데이터베이스와 통신합니다.

참고 코드는 [oktobat/school_market](https://github.com/oktobat/school_market)입니다.

## 진행 상태

- 회원가입, 로그인, 프로필 조회·수정과 탈퇴 등 회원 관리 기능을 구현했습니다.
- 일기 CRUD API와 전체 목록·상세·작성·수정·삭제 화면을 구현했습니다.
- 회원·일기 SQL JOIN 조회 API와 작성자별 일기 메뉴를 구현했습니다.
- 사용자가 기본 동작을 실제로 확인한 결과는 아래와 같습니다.
  - 회원가입, 로그인, 프로필 조회·수정 성공.
  - 웹 화면에서 회원 탈퇴 후 재로그인 실패를 확인했고, 탈퇴한 회원의 기존 토큰 조회는 401을 반환했습니다.
  - MySQL에 저장된 비밀번호가 `$2b$`로 시작하고 길이가 60인 것을 확인했습니다.
  - 일기 작성 후 상세 내용과 줄바꿈, 새로고침 뒤 일기와 수정한 제목이 유지되는 것을 확인했습니다.
  - 비로그인 상세 조회가 가능하고, 토큰 없는 작성 요청은 401을 반환했습니다.
  - 다른 회원 일기의 수정·삭제 요청이 각각 403을 반환했습니다.
  - 본인 일기 삭제 후 홈 목록과 JOIN 메뉴에서 사라지는 것을 확인했습니다.
  - 작성자별 일기 메뉴에서 제목과 작성자 닉네임을 확인했습니다.
  - 탈퇴 후 이동 화면은 로그인 화면이었습니다.
- 사용자 확인과 별도로, 현재 코드를 읽어 다음 구현 위치를 확인했습니다.
  - `server/routes/auth.js`에서 `bcrypt.hash`와 `bcrypt.compare`를 사용합니다.
  - `server/routes/diaries.js`의 `/with-authors` 조회에 SQL `INNER JOIN`이 있습니다.
- 브라우저 확인은 위 사용자 보고 결과이며, 이 README 갱신 작업에서 별도 테스트를 다시 실행한 것은 아닙니다.

## 기능과 구현 위치

| 기능 | 구현 파일 | API 및 화면 |
| --- | --- | --- |
| 회원가입·로그인 | `server/routes/auth.js` | `POST /api/auth/signup`, `POST /api/auth/login` |
| 프로필 조회·수정·탈퇴 | `server/routes/users.js` | `GET`, `PUT`, `DELETE /api/users/me`; React 화면 `client/src/pages/MyPage.jsx` |
| 인증 및 회원 존재 확인 | `server/middlewares/auth.js` | 보호된 회원·일기 API에서 Bearer 토큰 검증 |
| 일기 CRUD | `server/routes/diaries.js` | `/api/diaries`, `/api/diaries/:id`; 화면 `HomePage.jsx`, `DiaryDetailPage.jsx`, `DiaryFormPage.jsx` |
| 회원·일기 JOIN 조회 | `server/routes/diaries.js` | `GET /api/diaries/with-authors`; `AuthorsPage.jsx` |

## 개발 환경

- Node.js 22.19.0
- npm 10.9.3
- MySQL Server 8.4.11
- React + Vite, Node.js + Express, MySQL

## 폴더 구성

| 폴더 | 역할 |
| --- | --- |
| `client/` | React 화면, Vite 개발 서버 및 `/api` 프록시 설정 |
| `server/` | Express API, MySQL 연결, 인증 및 회원 관리 |
| `database/` | MySQL 데이터베이스와 테이블 생성 SQL |
| `reference-school-market/` | 선생님이 제공한 참고 코드 |

## 다른 Windows PC에서 처음 실행하기

1. GitHub 저장소를 복제하고 프로젝트 폴더로 이동합니다.

   ```powershell
   git clone <저장소 주소>
   cd <복제된 프로젝트 폴더>
   ```

2. MySQL Server를 설치하고 실행한 뒤, 해당 PC에서 MySQL 접속이 되는지 확인합니다.

3. MySQL Workbench에서 `database/schema.sql` 파일을 열어 실행합니다. 이 스크립트는 `diary_20514` 데이터베이스와 `users`, `diaries` 테이블을 생성합니다.

4. `server/.env.example`을 `server/.env`로 복사합니다. 대상 `.env`가 이미 있으면 복사로 덮어쓰지 말고 기존 설정을 사용하거나 필요한 항목만 직접 보완합니다.

   ```powershell
   if (-not (Test-Path .\server\.env)) {
     Copy-Item .\server\.env.example .\server\.env
   }
   ```

5. `server/.env`에서 `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`을 해당 PC의 MySQL 설정에 맞춥니다. 기본 DB 이름은 `diary_20514`입니다. `PORT`는 API 서버 포트이며 기본값은 `5000`입니다.

6. `JWT_SECRET`을 새로 생성해 `.env`에 설정합니다. 다음 명령은 Node.js `crypto`로 임의의 48바이트 비밀값을 생성해 터미널에 표시합니다. 출력값을 `JWT_SECRET=` 뒤에 붙여 `server/.env`에 직접 입력하세요. 이 값을 공유 저장소에 올리지 마세요.

   ```powershell
   node -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('base64url') + '\n')"
   ```

7. 각 폴더에서 lock 파일 기준으로 의존성을 설치합니다.

   ```powershell
   cd .\server
   npm ci
   cd ..\client
   npm ci
   cd ..
   ```

8. 터미널을 두 개 열어 각각 프로젝트 폴더에서 개발 서버를 실행합니다.

   첫 번째 터미널:

   ```powershell
   cd <프로젝트 경로>\server
   npm run dev
   ```

   두 번째 터미널:

   ```powershell
   cd <프로젝트 경로>\client
   npm run dev
   ```

9. 브라우저에서 `http://localhost:5000/api/health`를 열어 `{"status":"ok"}` 응답을 확인합니다. client는 Vite가 터미널에 표시하는 `Local` 주소로 접속합니다. client의 `/api` 요청은 Vite 설정에 따라 `http://localhost:5000`으로 전달됩니다.

## 같은 PC에서 다시 실행하기

MySQL Server가 실행 중인지 확인한 뒤 터미널 두 개에서 각각 아래 명령을 사용합니다. 기존 `server/.env`는 그대로 사용합니다.

```powershell
cd C:\DB_project\server
npm run dev
```

```powershell
cd C:\DB_project\client
npm run dev
```

브라우저에서 Vite 터미널에 표시되는 `Local` 주소로 접속합니다. 서버 상태는 `http://localhost:5000/api/health`에서 확인할 수 있습니다.

## 데이터와 Git 제외 항목

MySQL의 사용자 계정과 실제 회원·일기 데이터는 GitHub 저장소를 복제해도 자동으로 복사되지 않습니다. 각 PC에서 MySQL 계정과 데이터베이스를 별도로 준비해야 합니다.

`.gitignore`는 `.env`, `node_modules/`, `dist/`, `reference-school-market/`을 업로드 대상에서 제외합니다. 예시 설정인 `server/.env.example`과 의존성 고정 파일인 `client/package-lock.json`, `server/package-lock.json`은 저장소에 포함합니다.
