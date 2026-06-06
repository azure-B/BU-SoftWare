const bcrypt = require('bcryptjs');
const { getServerClient } = require('../config/supabase');

const USER_COLUMNS = `
  id,
  student_id,
  password,
  name,
  department_id,
  departments ( name )
`;

function mapUserRow(data) {
  if (!data) return null;
  return {
    id: data.id,
    student_id: data.student_id,
    password: data.password,
    name: data.name,
    department_id: data.department_id,
    department_name: data.departments?.name ?? null,
  };
}

const AuthModel = {
  /**
   * Supabase PostgREST — .eq()는 파라미터 바인딩으로 SQL Injection 방지
   */
  findByStudentId: async (studentId) => {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('users')
      .select(USER_COLUMNS)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      const err = new Error('Database query failed');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return mapUserRow(data);
  },

  verifyPassword: (plain, hashed) => bcrypt.compare(plain, hashed),
};

module.exports = AuthModel;
