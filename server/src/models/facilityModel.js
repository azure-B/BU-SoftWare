const { getServerClient } = require('../config/supabase');
const {
  CATEGORY_SECTION_TITLES,
  FACILITY_CATEGORIES,
} = require('../utils/facilityCatalog');

function mapFacilityRow(row) {
  const amenities = Array.isArray(row.amenities) ? row.amenities : [];
  return {
    dbId: row.id,
    id: row.slug || String(row.id),
    slug: row.slug || String(row.id),
    title: row.name,
    name: row.name,
    location: row.location ?? '',
    description: row.description ?? '',
    available: row.is_available !== false,
    unavailableReason: row.is_available === false ? '현재 예약을 받지 않습니다.' : null,
    amenities,
    maxParticipants: row.max_participants ?? 10,
    category: row.category ?? null,
    departmentId: row.department_id ?? null,
  };
}

function filterCanonicalFacilities(rows) {
  const namesWithSlug = new Set(
    (rows ?? []).filter((row) => row.slug).map((row) => row.name),
  );

  return (rows ?? []).filter((row) => row.slug || !namesWithSlug.has(row.name));
}

function buildCategoryGroups(facilities, departmentName) {
  const byCategory = new Map();
  for (const facility of facilities) {
    const key = facility.category || 'other';
    const list = byCategory.get(key) ?? [];
    list.push(facility);
    byCategory.set(key, list);
  }

  return FACILITY_CATEGORIES.map((category) => {
    const label =
      category.id === 'dept' && departmentName
        ? departmentName
        : category.label;

    return {
      id: category.id,
      label,
      icon: category.icon,
      global: category.global,
      sectionTitle:
        category.id === 'dept' && departmentName
          ? `${departmentName} 시설`
          : CATEGORY_SECTION_TITLES[category.id] || category.label,
      facilities: byCategory.get(category.id) ?? [],
    };
  }).filter((group) => group.id !== 'dept' || group.facilities.length > 0);
}

const FACILITY_LIST_SELECT =
  'id, name, location, category, department_id, slug, description, max_participants, is_available, amenities';
const GLOBAL_FACILITY_CATEGORIES = ['startup', 'student', 'futsal'];

const FacilityModel = {
  findCanonicalFacilityRowsForDepartment: async (departmentId = null) => {
    const supabase = getServerClient();
    const exactId = Number(departmentId);

    const globalQuery = supabase
      .from('facilities')
      .select(FACILITY_LIST_SELECT)
      .in('category', GLOBAL_FACILITY_CATEGORIES)
      .is('department_id', null)
      .order('id', { ascending: true });

    if (!Number.isInteger(exactId) || exactId < 1) {
      const { data: globalRows, error: globalError } = await globalQuery;
      if (globalError) {
        const err = new Error('시설 목록을 불러오지 못했습니다.');
        err.status = 500;
        err.cause = globalError;
        throw err;
      }
      return filterCanonicalFacilities(globalRows ?? []);
    }

    const [{ data: globalRows, error: globalError }, { data: deptRows, error: deptFacilitiesError }] =
      await Promise.all([
        globalQuery,
        supabase
          .from('facilities')
          .select(FACILITY_LIST_SELECT)
          .eq('category', 'dept')
          .eq('department_id', exactId)
          .order('id', { ascending: true }),
      ]);

    if (globalError || deptFacilitiesError) {
      const err = new Error('시설 목록을 불러오지 못했습니다.');
      err.status = 500;
      err.cause = globalError || deptFacilitiesError;
      throw err;
    }

    return filterCanonicalFacilities([...(globalRows ?? []), ...(deptRows ?? [])]);
  },

  findFacilitiesForDepartment: async (departmentId) => {
    const exactId = Number(departmentId);
    if (!Number.isInteger(exactId) || exactId < 1) {
      const err = new Error('departmentId 쿼리가 필요합니다.');
      err.status = 400;
      throw err;
    }

    const supabase = getServerClient();

    const { data: department, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('id', exactId)
      .maybeSingle();

    if (deptError) {
      const err = new Error('시설 목록을 불러오지 못했습니다.');
      err.status = 500;
      err.cause = deptError;
      throw err;
    }

    if (!department) {
      const err = new Error('학과 정보를 찾을 수 없습니다.');
      err.status = 404;
      throw err;
    }

    const rawRows = await FacilityModel.findCanonicalFacilityRowsForDepartment(exactId);
    const facilities = rawRows.map(mapFacilityRow);
    const categories = buildCategoryGroups(facilities, department.name);

    return {
      departmentId: department.id,
      departmentName: department.name,
      categories,
    };
  },

  findFacilityBySlug: async (facilitySlug) => {
    const slug = String(facilitySlug ?? '').trim();
    if (!slug) {
      const err = new Error('유효하지 않은 시설입니다.');
      err.status = 400;
      throw err;
    }

    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('facilities')
      .select(
        'id, name, location, category, department_id, slug, description, max_participants, is_available, amenities',
      )
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      const err = new Error('시설 정보를 불러오지 못했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    if (!data) {
      const err = new Error('시설을 찾을 수 없습니다. npm run seed:facilities 를 실행해 주세요.');
      err.status = 404;
      throw err;
    }

    return mapFacilityRow(data);
  },
};

module.exports = FacilityModel;
