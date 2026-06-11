const { getServerClient } = require('../config/supabase');
const { isAdminStudentId } = require('../constants/adminAccount');

const DASHBOARD_NOTICE_BOARD_ID = 100;

const CATEGORY_TITLE_PREFIX = {
  Academic: '[학사]',
  Scholarship: '[장학]',
  General: '[일반]',
};

function slugifyFacilityName(name) {
  const base = String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-가-힣]+/g, '')
    .slice(0, 48);
  return `${base || 'facility'}-${Date.now().toString(36)}`;
}

function buildNoticeTitle(title, category) {
  const trimmed = String(title ?? '').trim();
  const prefix = CATEGORY_TITLE_PREFIX[category];
  if (!prefix) return trimmed;
  if (trimmed.startsWith(prefix)) return trimmed;
  return `${prefix} ${trimmed}`;
}

function buildNoticeContent(content, expiryDate) {
  const trimmed = String(content ?? '').trim();
  if (!expiryDate) return trimmed;
  return `${trimmed}\n\n(게시 만료: ${expiryDate})`;
}

function parseNoticeTitleForEdit(storedTitle) {
  const title = String(storedTitle ?? '');
  for (const [category, prefix] of Object.entries(CATEGORY_TITLE_PREFIX)) {
    if (title.startsWith(prefix)) {
      return { category, title: title.slice(prefix.length).trim() };
    }
  }
  return { category: 'General', title: title.trim() };
}

function parseNoticeContentForEdit(storedContent) {
  const content = String(storedContent ?? '');
  const match = content.match(/\n\n\(게시 만료: (\d{4}-\d{2}-\d{2})\)$/);
  if (match) {
    return {
      content: content.replace(/\n\n\(게시 만료: \d{4}-\d{2}-\d{2}\)$/, '').trim(),
      expiryDate: match[1],
    };
  }
  return { content: content.trim(), expiryDate: '' };
}

async function resolveDepartmentId(supabase, facilityCategory, departmentName) {
  if (facilityCategory !== 'dept') return null;

  const deptName = String(departmentName ?? '').trim();
  if (!deptName) {
    const err = new Error('학과 시설은 담당 학과명을 입력해 주세요.');
    err.status = 400;
    throw err;
  }

  const { data: department, error: deptError } = await supabase
    .from('departments')
    .select('id, name')
    .eq('name', deptName)
    .maybeSingle();

  if (deptError) {
    const err = new Error('학과 정보를 확인하지 못했습니다.');
    err.status = 500;
    err.cause = deptError;
    throw err;
  }

  if (!department) {
    const err = new Error(`학과를 찾을 수 없습니다: ${deptName}`);
    err.status = 404;
    throw err;
  }

  return department;
}

function mapNoticeRow(row) {
  const { category, title } = parseNoticeTitleForEdit(row.title);
  const { content, expiryDate } = parseNoticeContentForEdit(row.content);

  return {
    id: row.id,
    boardId: row.board_id,
    category,
    title,
    content,
    expiryDate,
    createdAt: row.created_at,
  };
}

function mapFacilityRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    location: row.location,
    category: row.category ?? 'student',
    departmentId: row.department_id ?? null,
    departmentName: row.departments?.name ?? '',
    maxParticipants: row.max_participants ?? 10,
    isAvailable: row.is_available !== false,
  };
}

const AdminModel = {
  DASHBOARD_NOTICE_BOARD_ID,

  isUserAdmin: async (userId, studentId) => {
    if (isAdminStudentId(studentId)) return true;

    const exactId = Number(userId);
    if (!Number.isInteger(exactId) || exactId < 1) return false;

    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', exactId)
      .maybeSingle();

    if (error) {
      const err = new Error('관리자 권한을 확인하지 못했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return Boolean(data?.id);
  },

  createDashboardNotice: async ({ userId, title, content, category, expiryDate }) => {
    const authorId = Number(userId);
    const supabase = getServerClient();

    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('id')
      .eq('id', DASHBOARD_NOTICE_BOARD_ID)
      .maybeSingle();

    if (boardError) {
      const err = new Error('공지 게시판을 확인하지 못했습니다.');
      err.status = 500;
      err.cause = boardError;
      throw err;
    }

    if (!board) {
      const err = new Error('중요 공지 게시판(id=100)이 없습니다. 시드 SQL을 실행해 주세요.');
      err.status = 404;
      throw err;
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        board_id: DASHBOARD_NOTICE_BOARD_ID,
        user_id: authorId,
        title: buildNoticeTitle(title, category),
        content: buildNoticeContent(content, expiryDate),
      })
      .select('id, board_id, user_id, title, content, created_at')
      .single();

    if (error) {
      const err = new Error('중요 공지 등록에 실패했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return mapNoticeRow(data);
  },

  listDashboardNotices: async () => {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('posts')
      .select('id, board_id, title, content, created_at')
      .eq('board_id', DASHBOARD_NOTICE_BOARD_ID)
      .order('created_at', { ascending: false });

    if (error) {
      const err = new Error('중요 공지 목록을 불러오지 못했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return (data ?? []).map(mapNoticeRow);
  },

  updateDashboardNotice: async ({ noticeId, title, content, category, expiryDate }) => {
    const exactId = Number(noticeId);
    if (!Number.isInteger(exactId) || exactId < 1) {
      const err = new Error('유효하지 않은 공지입니다.');
      err.status = 400;
      throw err;
    }

    const supabase = getServerClient();
    const { data: existing, error: fetchError } = await supabase
      .from('posts')
      .select('id, board_id')
      .eq('id', exactId)
      .maybeSingle();

    if (fetchError) {
      const err = new Error('공지 정보를 확인하지 못했습니다.');
      err.status = 500;
      err.cause = fetchError;
      throw err;
    }

    if (!existing || existing.board_id !== DASHBOARD_NOTICE_BOARD_ID) {
      const err = new Error('중요 공지를 찾을 수 없습니다.');
      err.status = 404;
      throw err;
    }

    const { data, error } = await supabase
      .from('posts')
      .update({
        title: buildNoticeTitle(title, category),
        content: buildNoticeContent(content, expiryDate),
      })
      .eq('id', exactId)
      .select('id, board_id, title, content, created_at')
      .single();

    if (error) {
      const err = new Error('중요 공지 수정에 실패했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return mapNoticeRow(data);
  },

  deleteDashboardNotice: async (noticeId) => {
    const exactId = Number(noticeId);
    if (!Number.isInteger(exactId) || exactId < 1) {
      const err = new Error('유효하지 않은 공지입니다.');
      err.status = 400;
      throw err;
    }

    const supabase = getServerClient();
    const { data: existing, error: fetchError } = await supabase
      .from('posts')
      .select('id, board_id')
      .eq('id', exactId)
      .maybeSingle();

    if (fetchError) {
      const err = new Error('공지 정보를 확인하지 못했습니다.');
      err.status = 500;
      err.cause = fetchError;
      throw err;
    }

    if (!existing || existing.board_id !== DASHBOARD_NOTICE_BOARD_ID) {
      const err = new Error('중요 공지를 찾을 수 없습니다.');
      err.status = 404;
      throw err;
    }

    const { error } = await supabase.from('posts').delete().eq('id', exactId);

    if (error) {
      const err = new Error('중요 공지 삭제에 실패했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return { id: exactId };
  },

  createFacility: async ({
    name,
    location,
    capacity,
    category,
    departmentName,
  }) => {
    const supabase = getServerClient();
    const trimmedName = String(name ?? '').trim();
    const trimmedLocation = String(location ?? '').trim();
    const facilityCategory = String(category ?? 'student').trim() || 'student';
    const maxParticipants = Math.max(1, Number(capacity) || 10);

    let departmentId = null;
    if (facilityCategory === 'dept') {
      const department = await resolveDepartmentId(supabase, facilityCategory, departmentName);
      departmentId = department.id;
    }

    const slug = slugifyFacilityName(trimmedName);
    const payload = {
      name: trimmedName,
      location: trimmedLocation,
      category: facilityCategory,
      department_id: departmentId,
      slug,
      description: '',
      max_participants: maxParticipants,
      is_available: true,
      amenities: [{ icon: 'groups', text: `수용 인원: ${maxParticipants}명` }],
    };

    const { data, error } = await supabase
      .from('facilities')
      .insert(payload)
      .select(
        'id, slug, name, location, category, department_id, max_participants, is_available, departments ( name )',
      )
      .single();

    if (error) {
      const err = new Error('시설 등록에 실패했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return mapFacilityRow(data);
  },

  listFacilities: async () => {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('facilities')
      .select(
        'id, slug, name, location, category, department_id, max_participants, is_available, departments ( name )',
      )
      .order('id', { ascending: true });

    if (error) {
      const err = new Error('시설 목록을 불러오지 못했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return (data ?? []).map(mapFacilityRow);
  },

  updateFacility: async ({
    facilityId,
    name,
    location,
    capacity,
    category,
    departmentName,
  }) => {
    const exactId = Number(facilityId);
    if (!Number.isInteger(exactId) || exactId < 1) {
      const err = new Error('유효하지 않은 시설입니다.');
      err.status = 400;
      throw err;
    }

    const supabase = getServerClient();
    const trimmedName = String(name ?? '').trim();
    const trimmedLocation = String(location ?? '').trim();
    const facilityCategory = String(category ?? 'student').trim() || 'student';
    const maxParticipants = Math.max(1, Number(capacity) || 10);

    const { data: existing, error: fetchError } = await supabase
      .from('facilities')
      .select('id, slug')
      .eq('id', exactId)
      .maybeSingle();

    if (fetchError) {
      const err = new Error('시설 정보를 확인하지 못했습니다.');
      err.status = 500;
      err.cause = fetchError;
      throw err;
    }

    if (!existing) {
      const err = new Error('시설을 찾을 수 없습니다.');
      err.status = 404;
      throw err;
    }

    let departmentId = null;
    if (facilityCategory === 'dept') {
      const department = await resolveDepartmentId(supabase, facilityCategory, departmentName);
      departmentId = department.id;
    }

    const { data, error } = await supabase
      .from('facilities')
      .update({
        name: trimmedName,
        location: trimmedLocation,
        category: facilityCategory,
        department_id: departmentId,
        max_participants: maxParticipants,
        amenities: [{ icon: 'groups', text: `수용 인원: ${maxParticipants}명` }],
      })
      .eq('id', exactId)
      .select(
        'id, slug, name, location, category, department_id, max_participants, is_available, departments ( name )',
      )
      .single();

    if (error) {
      const err = new Error('시설 수정에 실패했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return mapFacilityRow(data);
  },

  deleteFacility: async (facilityId) => {
    const exactId = Number(facilityId);
    if (!Number.isInteger(exactId) || exactId < 1) {
      const err = new Error('유효하지 않은 시설입니다.');
      err.status = 400;
      throw err;
    }

    const supabase = getServerClient();
    const { data: existing, error: fetchError } = await supabase
      .from('facilities')
      .select('id')
      .eq('id', exactId)
      .maybeSingle();

    if (fetchError) {
      const err = new Error('시설 정보를 확인하지 못했습니다.');
      err.status = 500;
      err.cause = fetchError;
      throw err;
    }

    if (!existing) {
      const err = new Error('시설을 찾을 수 없습니다.');
      err.status = 404;
      throw err;
    }

    const { error } = await supabase.from('facilities').delete().eq('id', exactId);

    if (error) {
      const err = new Error('시설 삭제에 실패했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return { id: exactId };
  },

  getStats: async () => {
    const supabase = getServerClient();

    const [{ count: noticeCount, error: noticeError }, { count: facilityCount, error: facilityError }] =
      await Promise.all([
        supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('board_id', DASHBOARD_NOTICE_BOARD_ID),
        supabase.from('facilities').select('id', { count: 'exact', head: true }),
      ]);

    if (noticeError || facilityError) {
      const err = new Error('운영 통계를 불러오지 못했습니다.');
      err.status = 500;
      err.cause = noticeError || facilityError;
      throw err;
    }

    return {
      activeAnnouncements: noticeCount ?? 0,
      registeredFacilities: facilityCount ?? 0,
    };
  },
};

module.exports = AdminModel;
