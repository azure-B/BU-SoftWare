-- campus_tour 게시판 카테고리 · 장소-게시판 연동
-- Supabase Dashboard → SQL Editor 에서 실행

CREATE TABLE IF NOT EXISTS campus_places (
    id serial PRIMARY KEY,
    kakao_place_id varchar(100) NOT NULL UNIQUE,
    name varchar(150) NOT NULL,
    category varchar(50) NULL
);

CREATE TABLE IF NOT EXISTS place_photos (
    id serial PRIMARY KEY,
    place_id int NOT NULL REFERENCES campus_places(id) ON DELETE CASCADE,
    user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url varchar(512) NOT NULL,
    uploaded_at timestamptz DEFAULT current_timestamp
);

ALTER TABLE boards DROP CONSTRAINT IF EXISTS boards_category_check;
ALTER TABLE boards ADD CONSTRAINT boards_category_check
  CHECK (category IN ('scholarship', 'university', 'department', 'campus_tour'));

ALTER TABLE campus_places ADD COLUMN IF NOT EXISTS board_id int REFERENCES boards(id) ON DELETE SET NULL;
ALTER TABLE campus_places ADD COLUMN IF NOT EXISTS address varchar(255);
ALTER TABLE campus_places ADD COLUMN IF NOT EXISTS lat numeric(10, 7);
ALTER TABLE campus_places ADD COLUMN IF NOT EXISTS lng numeric(10, 7);
ALTER TABLE campus_places ADD COLUMN IF NOT EXISTS distance_m int;
ALTER TABLE campus_places ADD COLUMN IF NOT EXISTS synced_at timestamptz;
ALTER TABLE campus_places ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;
ALTER TABLE campus_places ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT current_timestamp;

CREATE UNIQUE INDEX IF NOT EXISTS campus_places_board_id_unique ON campus_places(board_id) WHERE board_id IS NOT NULL;
