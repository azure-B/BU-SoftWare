/**
 * 학과광장 Q&A board + 샘플 10건
 * 실행: node scripts/seed-qna-board.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const { getServerClient } = require('../src/config/supabase');

const SQL_FILE = path.join(__dirname, 'seed-qna-board.sql');

const SEED_POSTS = [
  {
    title: '[학사/수강] 수강신청 변경 기간은 언제인가요?',
    content: `이번 학기 수강신청을 완료했는데, 일부 과목을 변경하고 싶습니다. 정확한 변경 기간과 방법이 궁금합니다.

---QNA_ANSWER---
답변: 학사지원팀
답변일: 2026-02-16

2026학년도 1학기 수강신청 변경 기간은 3월 2일(월)부터 3월 8일(일)까지입니다.`,
  },
  {
    title: '[장학/등록] 국가장학금 신청 기간을 놓쳤습니다. 구제 방법이 있나요?',
    content: `국가장학금 1유형 신청 마감일을 놓쳤습니다.

---QNA_ANSWER---
답변: 장학담당
답변일: 2026-02-10

정해진 기간 이후에는 온라인 신청이 불가합니다. 2유형·근로장학 등 다른 프로그램을 확인해 주세요.`,
  },
  {
    title: '[학사/수강] 졸업 학점 기준이 어떻게 되나요?',
    content: `졸업 요건 학점이 궁금합니다.

---QNA_ANSWER---
답변: 학사지원팀
답변일: 2026-01-28

포털 [학사정보 → 졸업요건 조회]에서 학과별 기준을 확인할 수 있습니다.`,
  },
  {
    title: '[시설/이용] 도서관 스터디룸 예약은 어디서 하나요?',
    content: `그룹 스터디룸 예약 방법이 궁금합니다.

---QNA_ANSWER---
답변: 도서관
답변일: 2026-02-05

도서관 홈페이지 [시설예약] 또는 모바일 앱에서 예약할 수 있습니다.`,
  },
  {
    title: '[기타] 학생증 재발급 절차 안내 부탁드립니다.',
    content: `학생증을 분실했습니다.

---QNA_ANSWER---
답변: 학생지원팀
답변일: 2026-02-01

학생지원팀 방문 후 분실 신고서 작성 및 수수료 납부 후 재발급됩니다.`,
  },
  {
    title: '[장학/등록] 상장금 지급일은 언제인가요?',
    content: `상장금 지급 일정이 궁금합니다.

---QNA_ANSWER---
답변: 장학담당
답변일: 2026-01-20

시상식 이후 익월 말 계좌로 일괄 지급됩니다.`,
  },
  {
    title: '[학사/수강] 병결·공결 신청은 어떻게 하나요?',
    content: `공결 처리 방법을 알려주세요.

---QNA_ANSWER---
답변: 학사지원팀
답변일: 2026-02-08

결석일로부터 7일 이내 학과 사무실에 서류를 제출해야 합니다.`,
  },
  {
    title: '[시설/이용] 사물함 대여 방법이 궁금합니다.',
    content: `학과 사물함 신청 방법이 궁금합니다.

---QNA_ANSWER---
답변: 학과 사무실
답변일: 2026-03-01

매 학기 초 학과 사무실에서 선착순 접수합니다.`,
  },
  {
    title: '[기타] 휴학·복학 신청 절차 안내',
    content: `군 입대 전 휴학을 계획 중입니다.

---QNA_ANSWER---
답변: 학사지원팀
답변일: 2026-01-15

휴학원과 입영통지서 사본을 학사지원팀에 제출하면 됩니다.`,
  },
  {
    title: '[학사/수강] 전공 변경은 언제 가능한가요?',
    content: `전과 신청 시기와 조건이 궁금합니다.

---QNA_ANSWER---
답변: 학사지원팀
답변일: 2026-01-22

매 학년도 1학기 수강신청 전 지정된 기간에 신청합니다.`,
  },
];

async function run() {
  const supabase = getServerClient();

  const { data: existingBoard } = await supabase
    .from('boards')
    .select('id')
    .eq('board_kind', 'qna')
    .is('department_id', null)
    .maybeSingle();

  let boardId = existingBoard?.id;

  if (!boardId) {
    const { data, error } = await supabase
      .from('boards')
      .insert({ name: '학과광장 Q&A', category: 'university', board_kind: 'qna' })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    boardId = data.id;
    console.log(`Created Q&A board id=${boardId}`);
  } else {
    console.log(`Q&A board exists id=${boardId}`);
  }

  const { data: author } = await supabase
    .from('users')
    .select('id, name')
    .eq('name', '이승빈')
    .order('id')
    .limit(1)
    .maybeSingle();

  const authorId = author?.id ?? (await supabase.from('users').select('id').limit(1).single()).data?.id;
  if (!authorId) throw new Error('작성자 없음');

  let inserted = 0;
  for (const post of SEED_POSTS) {
    const { data: dup } = await supabase
      .from('posts')
      .select('id')
      .eq('board_id', boardId)
      .eq('title', post.title)
      .maybeSingle();

    if (dup) continue;

    const { error } = await supabase.from('posts').insert({
      board_id: boardId,
      user_id: authorId,
      title: post.title,
      content: post.content,
    });
    if (error) throw new Error(error.message);
    inserted += 1;
  }

  console.log(`Done. New Q&A posts: ${inserted}`);
  console.log(`SQL fallback: ${SQL_FILE}`);
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
