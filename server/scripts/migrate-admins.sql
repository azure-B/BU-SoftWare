-- admins 테이블 (관리자 권한). Supabase SQL Editor에서 1회 실행.
-- 이후: cd server && npm run seed:admin

create table if not exists admins (
    id serial primary key,
    user_id int not null,
    facility_id int null,
    role varchar(50) not null default 'FACILITY_ADMIN',
    foreign key (user_id) references users(id) on delete cascade,
    foreign key (facility_id) references facilities(id) on delete set null
);

create unique index if not exists admins_user_id_unique on admins (user_id);
