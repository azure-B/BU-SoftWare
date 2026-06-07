-- Supabase SQL Editor에서 한 번 실행
-- facilities 확장 + 공용(전학과) + 학과별 시설 2개씩 시드

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS category varchar(50);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS department_id int REFERENCES departments(id) ON DELETE CASCADE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS slug varchar(120);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS max_participants int DEFAULT 10;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS amenities jsonb DEFAULT '[]'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_facilities_slug ON facilities(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_category ON facilities(category);
CREATE INDEX IF NOT EXISTS idx_facilities_department_id ON facilities(department_id);

-- 전학과 공용: 창업지원단(3) · 학생처(3) · 풋살장(2)
INSERT INTO facilities (name, location, category, department_id, slug, description, max_participants, is_available, amenities)
SELECT * FROM (VALUES
  ('코워킹 스페이스', '창업지원단 2층', 'startup', NULL::int, 'startup-coworking', '다양한 팀이 함께 아이디어를 나누고 작업할 수 있는 오픈 스페이스입니다.', 20, true, '[{"icon":"groups","text":"수용 인원: 20명"}]'::jsonb),
  ('회의실 A', '창업지원단 3층', 'startup', NULL::int, 'startup-meeting-a', '소규모 팀 회의 및 프레젠테이션 연습에 적합한 독립된 회의 공간입니다.', 6, true, '[{"icon":"groups","text":"수용 인원: 6명"}]'::jsonb),
  ('세미나실', '창업지원단 1층', 'startup', NULL::int, 'startup-seminar', '특강, 워크숍, 대규모 발표를 위한 세미나 공간입니다.', 40, true, '[{"icon":"groups","text":"수용 인원: 40명"}]'::jsonb),
  ('학생상담실', '학생회관 2층', 'student', NULL::int, 'student-counseling', '학업·진로·심리 상담을 위한 1:1 및 소그룹 상담 공간입니다.', 4, true, '[{"icon":"groups","text":"수용 인원: 4명"}]'::jsonb),
  ('동아리 활동실', '학생회관 3층', 'student', NULL::int, 'student-club-room', '학생 동아리 정기 모임, 연습, 소규모 공연 리허설에 이용할 수 있는 공간입니다.', 30, true, '[{"icon":"groups","text":"수용 인원: 30명"}]'::jsonb),
  ('학생회관 다목적실', '학생회관 1층', 'student', NULL::int, 'student-lounge', '학생회 행사, OT, 설명회 등 대규모 학생 행사를 위한 다목적 공간입니다.', 80, false, '[{"icon":"groups","text":"수용 인원: 80명"}]'::jsonb),
  ('풋살장 A구역', '체육관 옥외 구장', 'futsal', NULL::int, 'futsal-a', '인조 잔디 구장으로 동아리 연습 및 친선 경기에 이용할 수 있습니다.', 10, true, '[{"icon":"groups","text":"수용 인원: 10명 (5vs5)"}]'::jsonb),
  ('풋살장 B구역', '체육관 실내 구장', 'futsal', NULL::int, 'futsal-b', '실내 풋살장으로 날씨와 관계없이 이용 가능한 실내 구역입니다.', 10, false, '[{"icon":"groups","text":"수용 인원: 10명 (5vs5)"}]'::jsonb)
) AS v(name, location, category, department_id, slug, description, max_participants, is_available, amenities)
WHERE NOT EXISTS (SELECT 1 FROM facilities f WHERE f.slug = v.slug);

UPDATE facilities AS f SET
  name = v.name,
  location = v.location,
  category = v.category,
  description = v.description,
  max_participants = v.max_participants,
  is_available = v.is_available,
  amenities = v.amenities
FROM (VALUES
  ('startup-coworking', '코워킹 스페이스', '창업지원단 2층', 'startup', '다양한 팀이 함께 아이디어를 나누고 작업할 수 있는 오픈 스페이스입니다.', 20, true, '[{"icon":"groups","text":"수용 인원: 20명"}]'::jsonb),
  ('startup-meeting-a', '회의실 A', '창업지원단 3층', 'startup', '소규모 팀 회의 및 프레젠테이션 연습에 적합한 독립된 회의 공간입니다.', 6, true, '[{"icon":"groups","text":"수용 인원: 6명"}]'::jsonb),
  ('startup-seminar', '세미나실', '창업지원단 1층', 'startup', '특강, 워크숍, 대규모 발표를 위한 세미나 공간입니다.', 40, true, '[{"icon":"groups","text":"수용 인원: 40명"}]'::jsonb),
  ('student-counseling', '학생상담실', '학생회관 2층', 'student', '학업·진로·심리 상담을 위한 1:1 및 소그룹 상담 공간입니다.', 4, true, '[{"icon":"groups","text":"수용 인원: 4명"}]'::jsonb),
  ('student-club-room', '동아리 활동실', '학생회관 3층', 'student', '학생 동아리 정기 모임, 연습, 소규모 공연 리허설에 이용할 수 있는 공간입니다.', 30, true, '[{"icon":"groups","text":"수용 인원: 30명"}]'::jsonb),
  ('student-lounge', '학생회관 다목적실', '학생회관 1층', 'student', '학생회 행사, OT, 설명회 등 대규모 학생 행사를 위한 다목적 공간입니다.', 80, false, '[{"icon":"groups","text":"수용 인원: 80명"}]'::jsonb),
  ('futsal-a', '풋살장 A구역', '체육관 옥외 구장', 'futsal', '인조 잔디 구장으로 동아리 연습 및 친선 경기에 이용할 수 있습니다.', 10, true, '[{"icon":"groups","text":"수용 인원: 10명 (5vs5)"}]'::jsonb),
  ('futsal-b', '풋살장 B구역', '체육관 실내 구장', 'futsal', '실내 풋살장으로 날씨와 관계없이 이용 가능한 실내 구역입니다.', 10, false, '[{"icon":"groups","text":"수용 인원: 10명 (5vs5)"}]'::jsonb)
) AS v(slug, name, location, category, description, max_participants, is_available, amenities)
WHERE f.slug = v.slug;

-- 학과별 시설 2개씩 (실습실 + 세미나실)
DO $$
DECLARE
  dept RECORD;
BEGIN
  FOR dept IN SELECT id, name FROM departments ORDER BY id LOOP
    IF NOT EXISTS (SELECT 1 FROM facilities WHERE slug = 'dept-' || dept.id || '-lab') THEN
      INSERT INTO facilities (name, location, category, department_id, slug, description, max_participants, is_available, amenities)
      VALUES (
        dept.name || ' 실습실',
        dept.name || '관',
        'dept',
        dept.id,
        'dept-' || dept.id || '-lab',
        dept.name || ' 전공 실습 및 팀 프로젝트를 위한 학과 전용 공간입니다.',
        24,
        true,
        '[{"icon":"groups","text":"수용 인원: 24명"}]'::jsonb
      );
    ELSE
      UPDATE facilities SET
        name = dept.name || ' 실습실',
        location = dept.name || '관',
        department_id = dept.id,
        description = dept.name || ' 전공 실습 및 팀 프로젝트를 위한 학과 전용 공간입니다.'
      WHERE slug = 'dept-' || dept.id || '-lab';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM facilities WHERE slug = 'dept-' || dept.id || '-seminar') THEN
      INSERT INTO facilities (name, location, category, department_id, slug, description, max_participants, is_available, amenities)
      VALUES (
        dept.name || ' 세미나실',
        dept.name || '관',
        'dept',
        dept.id,
        'dept-' || dept.id || '-seminar',
        dept.name || ' 세미나, 발표, 교수·학생 회의를 위한 세미나 공간입니다.',
        20,
        true,
        '[{"icon":"groups","text":"수용 인원: 20명"}]'::jsonb
      );
    ELSE
      UPDATE facilities SET
        name = dept.name || ' 세미나실',
        location = dept.name || '관',
        department_id = dept.id,
        description = dept.name || ' 세미나, 발표, 교수·학생 회의를 위한 세미나 공간입니다.'
      WHERE slug = 'dept-' || dept.id || '-seminar';
    END IF;
  END LOOP;
END $$;

-- slug 없는 구버전 중복 시설 숨김 (예: 코워킹 스페이스 2건)
-- reservations 가 묶인 legacy row 가 있으면 삭제 대신 slug 시설로 예약을 옮긴 뒤 수동 삭제하세요.
