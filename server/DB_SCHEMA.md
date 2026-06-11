# Database Schema (PostgreSQL)

Node.js(Express) 백엔드 연동용 DB 스키마 참고 문서입니다.  
모델(`server/src/models/`) 교체·마이그레이션·시드 작성 시 이 파일을 기준으로 합니다.

> **Maintenance:** 수동 관리 문서입니다. 스키마 변경 시 SQL과 아래 테이블 설명을 함께 갱신하세요.

---

## 도메인 개요

| # | 도메인 | 테이블 |
|---|--------|--------|
| 1 | 인증 / 계정 관리 | `departments`, `users`, `email_verifications`, `facilities`, `admins` |
| 2 | 대시보드 / 학점 | `courses`, `enrollments`, `graduation_check` |
| 3 | 커뮤니티 | `boards`, `posts`, `comments`, `mentoring`, `team_projects`, `team_members` |
| 4 | 캠퍼스 투어 | `campus_places`, `place_photos` |
| 5 | 시설 대여 | `reservations` |
| 6 | 챗봇 | `chatbot_sessions`, `chatbot_messages` |

---

## ER 관계 요약

```
departments ──< users ──┬──< enrollments >── courses
                        ├──< graduation_check (1:1)
                        ├──< posts ──< comments (self-ref parent_id)
                        ├──< admins >── facilities
                        ├──< reservations >── facilities
                        ├──< place_photos >── campus_places
                        ├──< mentoring (mentor_id, mentee_id)
                        ├──< team_members >── team_projects
                        └──< chatbot_sessions ──< chatbot_messages

boards ──< posts
```

---

## 1. 인증 / 계정 관리

### `departments`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `serial` | PK | |
| `name` | `varchar(100)` | NOT NULL | 학과명 |

### `users`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `serial` | PK | |
| `department_id` | `int` | FK → `departments(id)` ON DELETE CASCADE | |
| `student_id` | `varchar(50)` | NOT NULL, UNIQUE | 학번 (로그인 ID) |
| `email` | `varchar(255)` | UNIQUE | `@bu.ac.kr` 캠퍼스 이메일 |
| `password` | `varchar(255)` | NOT NULL | 해시된 비밀번호 |
| `name` | `varchar(50)` | NOT NULL | 이름 |
| `created_at` | `timestamptz` | DEFAULT `current_timestamp` | |

### `facilities`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `serial` | PK | |
| `name` | `varchar(100)` | NOT NULL | 시설명 (강의실 등) |
| `location` | `varchar(255)` | NOT NULL | 위치 |

### `admins`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `serial` | PK | |
| `user_id` | `int` | FK → `users(id)` ON DELETE CASCADE | |
| `facility_id` | `int` | FK → `facilities(id)` ON DELETE SET NULL, NULL 허용 | 담당 시설 (총괄 관리자는 `null`) |
| `role` | `varchar(50)` | NOT NULL, DEFAULT `'FACILITY_ADMIN'` | 권한 레벨 |

---

## 2. 대시보드 / 학점

### `courses`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `serial` | PK | |
| `name` | `varchar(100)` | NOT NULL | 강의명 |
| `type` | `varchar(50)` | NOT NULL, CHECK | `major_required` \| `liberal_required` \| `elective` |
| `credit` | `int` | NOT NULL | 학점수 |
| `ge_area` | `varchar(50)` | NULL 허용 | 교양영역: `백석` \| `기초` \| `심화` (`liberal_required`) |
| `ge_subject` | `varchar(100)` | NULL 허용 | 교양 세부과목 (`GeRequirementsTable` subject) |
| `major_track` | `varchar(50)` | NULL 허용 | 전공 트랙: `basic` \| `core` \| `depth` \| `applied` |

### `enrollments`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `serial` | PK | |
| `user_id` | `int` | FK → `users(id)` ON DELETE CASCADE | |
| `course_id` | `int` | FK → `courses(id)` ON DELETE CASCADE | |
| `grade` | `varchar(10)` | NULL 허용 | 성적 (A+, B0 등) |
| `semester` | `varchar(20)` | NOT NULL | 수강 학기 (예: `2026-1`) |

### `graduation_check`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `serial` | PK | |
| `user_id` | `int` | FK → `users(id)` ON DELETE CASCADE, UNIQUE | |
| `major_required_credits` | `int` | DEFAULT 0 | 전공필수 이수학점 캐시 |
| `liberal_required_credits` | `int` | DEFAULT 0 | 교양필수 이수학점 캐시 |
| `elective_credits` | `int` | DEFAULT 0 | 일반선택 이수학점 캐시 |
| `gpa` | `numeric(3,2)` | DEFAULT 4.25 | 평점 평균 (Dashboard) |
| `last_updated` | `timestamptz` | DEFAULT `current_timestamp` | |

---

## 3. 커뮤니티

### `boards`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `serial` | PK | |
| `name` | `varchar(100)` | NOT NULL | 게시판 이름 |
| `category` | `varchar(50)` | NOT NULL, CHECK | `scholarship` \| `university` \| `department` \| `campus_tour` |

### `posts`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `serial` | PK | |
| `board_id` | `int` | FK → `boards(id)` ON DELETE CASCADE | |
| `user_id` | `int` | FK → `users(id)` ON DELETE CASCADE | |
| `title` | `varchar(255)` | NOT NULL | |
| `content` | `text` | NOT NULL | |
| `created_at` | `timestamptz` | DEFAULT `current_timestamp` | |

### `comments`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `serial` | PK | |
| `post_id` | `int` | FK → `posts(id)` ON DELETE CASCADE | |
| `user_id` | `int` | FK → `users(id)` ON DELETE CASCADE | |
| `parent_id` | `int` | FK → `comments(id)` ON DELETE CASCADE, NULL 허용 | 대댓글용 자기 참조 |
| `content` | `text` | NOT NULL | |
| `created_at` | `timestamptz` | DEFAULT `current_timestamp` | |

### `mentoring`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `serial` | PK | |
| `mentor_id` | `int` | FK → `users(id)` ON DELETE CASCADE | |
| `mentee_id` | `int` | FK → `users(id)` ON DELETE CASCADE | |
| `status` | `varchar(50)` | DEFAULT `'MATCHING'` | 매칭 상태 |

### `team_projects`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `serial` | PK | |
| `created_by` | `int` | FK → `users(id)` ON DELETE CASCADE | 프로젝트 개설자 |
| `title` | `varchar(255)` | NOT NULL | |
| `description` | `text` | NULL 허용 | |

### `team_members`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `serial` | PK | |
| `project_id` | `int` | FK → `team_projects(id)` ON DELETE CASCADE | |
| `user_id` | `int` | FK → `users(id)` ON DELETE CASCADE | |
| `role` | `varchar(100)` | NULL 허용 | 팀 내 역할 |

---

## 4. 캠퍼스 투어

### `campus_places`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `serial` | PK | |
| `kakao_place_id` | `varchar(100)` | NOT NULL, UNIQUE | 카카오맵 API 연동 ID |
| `name` | `varchar(150)` | NOT NULL | 장소명 |
| `category` | `varchar(50)` | NULL 허용 | 식당, 카페 등 |
| `board_id` | `int` | FK → `boards(id)`, UNIQUE | 음식점별 리뷰 게시판 |
| `address` | `varchar(255)` | NULL 허용 | 도로명/지번 주소 |
| `lat` | `numeric(10,7)` | NULL 허용 | 위도 |
| `lng` | `numeric(10,7)` | NULL 허용 | 경도 |
| `distance_m` | `int` | NULL 허용 | 학생복지동 기준 거리(m) |
| `synced_at` | `timestamptz` | NULL 허용 | 카카오 동기화 시각 |
| `last_verified_at` | `timestamptz` | NULL 허용 | 마지막 존재 확인 시각 |
| `created_at` | `timestamptz` | DEFAULT `current_timestamp` | 등록 시각 |

### `place_photos`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `serial` | PK | |
| `place_id` | `int` | FK → `campus_places(id)` ON DELETE CASCADE | |
| `user_id` | `int` | FK → `users(id)` ON DELETE CASCADE | |
| `image_url` | `varchar(512)` | NOT NULL | S3 등 이미지 저장 경로 |
| `uploaded_at` | `timestamptz` | DEFAULT `current_timestamp` | |

---

## 5. 시설 대여

### `reservations`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `serial` | PK | |
| `facility_id` | `int` | FK → `facilities(id)` ON DELETE CASCADE | |
| `user_id` | `int` | FK → `users(id)` ON DELETE CASCADE | |
| `start_time` | `timestamptz` | NOT NULL | |
| `end_time` | `timestamptz` | NOT NULL | |
| `status` | `varchar(50)` | DEFAULT `'PENDING'` | 승인 대기, 완료, 반려 등 |
| `n_reason` | `text` | NULL 허용 | 반려 사유 |

---

## 6. 챗봇

### `chatbot_sessions`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `serial` | PK | |
| `user_id` | `int` | FK → `users(id)` ON DELETE CASCADE | |
| `started_at` | `timestamptz` | DEFAULT `current_timestamp` | |

### `chatbot_messages`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `serial` | PK | |
| `session_id` | `int` | FK → `chatbot_sessions(id)` ON DELETE CASCADE | |
| `sender_type` | `varchar(10)` | NOT NULL, CHECK | `user` \| `bot` |
| `message` | `text` | NOT NULL | |
| `sent_at` | `timestamptz` | DEFAULT `current_timestamp` | |

---

## Node.js 연동 메모

- **Supabase (권장)**: `@supabase/supabase-js` — `server/src/config/supabase.js`
  - `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (또는 `SUPABASE_ANON_KEY`)
  - 서버 API: `SUPABASE_SERVICE_ROLE_KEY` (Dashboard → Project Settings → API, **비공개**)
  - RLS: `server/scripts/supabase-rls.sql` 실행 후 publishable 키는 브라우저에서만 사용
- **직접 연결 (선택)**: `pg` + Supabase `DATABASE_URL` (`server/src/config/db.js`)
- **환경 변수:** `server/.env` — `.env.example` 참고 (커밋 금지)
- **비밀번호:** `users.password`는 bcrypt 등으로 해시 저장; 평문 저장 금지
- **CHECK 값:** API/모델 레이어에서도 동일 enum 검증 권장
  - `courses.type`: `major_required`, `liberal_required`, `elective`
  - `boards.category`: `scholarship`, `university`, `department`
  - `chatbot_messages.sender_type`: `user`, `bot`
- **프론트 페이지 매핑 (참고)**

| 화면 (`front/src/jsx/`) | 주요 테이블 |
|-------------------------|-------------|
| `Login.jsx` | `users`, `departments` |
| `Dashboard.jsx` | `enrollments`, `courses`, `graduation_check` |
| `Community.jsx` | `boards`, `posts`, `comments` |
| `Tour.jsx` | `campus_places`, `place_photos` |
| `Reservation.jsx` | `facilities`, `reservations` |
| `MyPage.jsx` | `users`, `graduation_check`, `enrollments` |

---

## 전체 DDL (초기화 + 생성)

아래 SQL을 그대로 실행하면 기존 테이블을 삭제한 뒤 스키마를 재생성합니다.

```sql
-- ==========================================
-- 0. 기존 테이블 초기화 (존재할 경우 삭제)
-- ==========================================
drop table if exists chatbot_messages cascade;
drop table if exists chatbot_sessions cascade;
drop table if exists reservations cascade;
drop table if exists place_photos cascade;
drop table if exists campus_places cascade;
drop table if exists team_members cascade;
drop table if exists team_projects cascade;
drop table if exists mentoring cascade;
drop table if exists comments cascade;
drop table if exists posts cascade;
drop table if exists boards cascade;
drop table if exists graduation_check cascade;
drop table if exists enrollments cascade;
drop table if exists courses cascade;
drop table if exists admins cascade;
drop table if exists facilities cascade;
drop table if exists users cascade;
drop table if exists departments cascade;

-- ==========================================
-- 1. 인증 / 계정 관리 도메인
-- ==========================================
create table departments (
    id serial primary key,
    name varchar(100) not null -- 학과명
);

create table users (
    id serial primary key,
    department_id int not null,
    student_id varchar(50) not null unique, -- 학번(로그인 ID)
    password varchar(255) not null, -- 해시된 비밀번호
    name varchar(50) not null, -- 이름
    created_at timestamp with time zone default current_timestamp,
    foreign key (department_id) references departments(id) on delete cascade
);

create table facilities (
    id serial primary key,
    name varchar(100) not null, -- 시설명 (강의실 등)
    location varchar(255) not null -- 위치
);

create table admins (
    id serial primary key,
    user_id int not null,
    facility_id int null, -- 담당 시설 (Nullable: 총괄 관리자는 null)
    role varchar(50) not null default 'FACILITY_ADMIN', -- 권한 레벨
    foreign key (user_id) references users(id) on delete cascade,
    foreign key (facility_id) references facilities(id) on delete set null
);


-- ==========================================
-- 2. 대시보드 및 학점 도메인
-- ==========================================
create table courses (
    id serial primary key,
    name varchar(100) not null, -- 강의명
    type varchar(50) check (type in ('major_required', 'liberal_required', 'elective')) not null, -- 이수구분
    credit int not null, -- 학점수
    ge_area varchar(50) null, -- 교양영역: 백석 | 기초 | 심화
    ge_subject varchar(100) null, -- 교양 세부과목
    major_track varchar(50) null -- 전공 트랙: basic | core | depth | applied
);

create table enrollments (
    id serial primary key,
    user_id int not null,
    course_id int not null,
    grade varchar(10) null, -- 성적 집계 (A+, B0 등)
    semester varchar(20) not null, -- 수강 학기 (예: 2026-1)
    foreign key (user_id) references users(id) on delete cascade,
    foreign key (course_id) references courses(id) on delete cascade
);

create table graduation_check (
    id serial primary key,
    user_id int not null unique,
    major_required_credits int default 0, -- 전공필수 이수학점 캐싱
    liberal_required_credits int default 0, -- 교양필수 이수학점 캐싱
    elective_credits int default 0, -- 일반선택 이수학점 캐싱
    last_updated timestamp with time zone default current_timestamp,
    foreign key (user_id) references users(id) on delete cascade
);


-- ==========================================
-- 3. 커뮤니티 도메인
-- ==========================================
create table boards (
    id serial primary key,
    name varchar(100) not null, -- 게시판 이름
    category varchar(50) check (category in ('scholarship', 'university', 'department')) not null -- 장학/대학/학과 구분
);

create table posts (
    id serial primary key,
    board_id int not null,
    user_id int not null,
    title varchar(255) not null,
    content text not null,
    created_at timestamp with time zone default current_timestamp,
    foreign key (board_id) references boards(id) on delete cascade,
    foreign key (user_id) references users(id) on delete cascade
);

create table comments (
    id serial primary key,
    post_id int not null,
    user_id int not null,
    parent_id int null, -- 대댓글 구현을 위한 자기 참조 FK
    content text not null,
    created_at timestamp with time zone default current_timestamp,
    foreign key (post_id) references posts(id) on delete cascade,
    foreign key (user_id) references users(id) on delete cascade,
    foreign key (parent_id) references comments(id) on delete cascade
);

create table mentoring (
    id serial primary key,
    mentor_id int not null,
    mentee_id int not null,
    status varchar(50) default 'MATCHING', -- 매칭 상태
    foreign key (mentor_id) references users(id) on delete cascade,
    foreign key (mentee_id) references users(id) on delete cascade
);

create table team_projects (
    id serial primary key,
    created_by int not null, -- 프로젝트 개설자
    title varchar(255) not null,
    description text null,
    foreign key (created_by) references users(id) on delete cascade
);

create table team_members (
    id serial primary key,
    project_id int not null,
    user_id int not null,
    role varchar(100) null, -- 팀 내 역할
    foreign key (project_id) references team_projects(id) on delete cascade,
    foreign key (user_id) references users(id) on delete cascade
);


-- ==========================================
-- 4. 캠퍼스 투어 도메인
-- ==========================================
create table campus_places (
    id serial primary key,
    kakao_place_id varchar(100) not null unique, -- 카카오맵 API 연동 ID
    name varchar(150) not null, -- 장소명
    category varchar(50) null -- 식당, 카페 등 구분
);

create table place_photos (
    id serial primary key,
    place_id int not null,
    user_id int not null,
    image_url varchar(512) not null, -- S3 등 이미지 저장 경로
    uploaded_at timestamp with time zone default current_timestamp,
    foreign key (place_id) references campus_places(id) on delete cascade,
    foreign key (user_id) references users(id) on delete cascade
);


-- ==========================================
-- 5. 시설 대여 도메인
-- ==========================================
create table reservations (
    id serial primary key,
    facility_id int not null,
    user_id int not null,
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    status varchar(50) default 'PENDING', -- 승인 대기, 완료, 반려 등
    foreign key (facility_id) references facilities(id) on delete cascade,
    foreign key (user_id) references users(id) on delete cascade
);


-- ==========================================
-- 6. 챗봇 서비스 도메인
-- ==========================================
create table chatbot_sessions (
    id serial primary key,
    user_id int not null,
    started_at timestamp with time zone default current_timestamp,
    foreign key (user_id) references users(id) on delete cascade
);

create table chatbot_messages (
    id serial primary key,
    session_id int not null,
    sender_type varchar(10) check (sender_type in ('user', 'bot')) not null,
    message text not null,
    sent_at timestamp with time zone default current_timestamp,
    foreign key (session_id) references chatbot_sessions(id) on delete cascade
);
```
