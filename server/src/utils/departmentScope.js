function getDepartmentFilterIds(departmentId) {
  const id = Number(departmentId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return [id];
}

module.exports = { getDepartmentFilterIds };
