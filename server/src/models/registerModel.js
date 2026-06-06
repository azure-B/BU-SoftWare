const bcrypt = require('bcryptjs');
const { getServerClient } = require('../config/supabase');

const RegisterModel = {
  findByStudentId: async (studentId) => {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, student_id')
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  findByEmail: async (email) => {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  findDepartmentByName: async (name) => {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('departments')
      .select('id, name')
      .eq('name', name)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  createDepartment: async (name) => {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('departments')
      .insert({ name })
      .select('id, name')
      .single();

    if (error) throw error;
    return data;
  },

  ensureDepartment: async (name) => {
    const existing = await RegisterModel.findDepartmentByName(name);
    if (existing) return existing;
    return RegisterModel.createDepartment(name);
  },

  createVerification: async ({ email, code, expiresAt }) => {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('email_verifications')
      .insert({
        email,
        code,
        verified: false,
        expires_at: expiresAt.toISOString(),
      })
      .select('id, email, code, expires_at')
      .single();

    if (error) throw error;
    return data;
  },

  getLatestVerification: async (email) => {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('email_verifications')
      .select('id, email, code, verified, expires_at, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  markVerificationVerified: async (id) => {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('email_verifications')
      .update({ verified: true })
      .eq('id', id)
      .select('id, email, verified')
      .single();

    if (error) throw error;
    return data;
  },

  createUser: async ({ departmentId, studentId, password, name, email }) => {
    const passwordHash = await bcrypt.hash(password, 10);
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('users')
      .insert({
        department_id: departmentId,
        student_id: studentId,
        password: passwordHash,
        name,
        email,
      })
      .select('id, student_id, name, email, department_id')
      .single();

    if (error) throw error;
    return data;
  },
};

module.exports = RegisterModel;
