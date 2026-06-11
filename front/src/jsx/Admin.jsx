import { useCallback, useEffect, useState } from 'react';
import {
  deleteAdminFacility,
  deleteAdminNotice,
  fetchAdminFacilities,
  fetchAdminNotices,
  fetchAdminStats,
  publishAdminNotice,
  registerAdminFacility,
  updateAdminFacility,
  updateAdminNotice,
} from '../components/admin/adminApi';
import { fetchRegisterDepartments } from '../components/community/communityData';
import DepartmentCombobox from '../components/regi/DepartmentCombobox';
import '../public/css/admin.css';

const NOTICE_CATEGORIES = [
  { value: 'Academic', label: '학사' },
  { value: 'Scholarship', label: '장학' },
  { value: 'General', label: '일반' },
];

const FACILITY_CATEGORIES = [
  { value: 'startup', label: '창업지원단' },
  { value: 'student', label: '학생처' },
  { value: 'dept', label: '소속 학과' },
  { value: 'futsal', label: '풋살장' },
];

const NOTICE_CATEGORY_OPTIONS = NOTICE_CATEGORIES.map(({ value, label }) => ({
  id: value,
  name: label,
}));

const INITIAL_NOTICE_FORM = {
  category: 'Academic',
  expiryDate: '',
  title: '',
  content: '',
};

const INITIAL_FACILITY_FORM = {
  name: '',
  departmentId: '',
  capacity: '',
  location: '',
  category: 'student',
};

function resolveDepartmentId(departmentName, options) {
  if (!departmentName) return '';
  const match = options.find((option) => option.name === departmentName);
  return match ? String(match.id) : '';
}

function resolveDepartmentName(departmentId, options) {
  if (!departmentId) return '';
  const match = options.find((option) => String(option.id) === String(departmentId));
  return match?.name ?? '';
}

function formatDateLabel(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ko-KR');
}

function categoryLabel(value) {
  return NOTICE_CATEGORIES.find((item) => item.value === value)?.label ?? '일반';
}

function facilityCategoryLabel(value) {
  return FACILITY_CATEGORIES.find((item) => item.value === value)?.label ?? value;
}

function Admin({ session, onLogout }) {
  const [stats, setStats] = useState({ activeAnnouncements: 0, registeredFacilities: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [notices, setNotices] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [editingNoticeId, setEditingNoticeId] = useState(null);
  const [editingFacilityId, setEditingFacilityId] = useState(null);
  const [noticeForm, setNoticeForm] = useState(INITIAL_NOTICE_FORM);
  const [facilityForm, setFacilityForm] = useState(INITIAL_FACILITY_FORM);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeMessageType, setNoticeMessageType] = useState('');
  const [facilityMessage, setFacilityMessage] = useState('');
  const [facilityMessageType, setFacilityMessageType] = useState('');
  const [noticeSubmitting, setNoticeSubmitting] = useState(false);
  const [noticeDeleting, setNoticeDeleting] = useState(false);
  const [facilitySubmitting, setFacilitySubmitting] = useState(false);
  const [facilityDeleting, setFacilityDeleting] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDepartments() {
      setDepartmentsLoading(true);
      setDepartmentsError('');
      try {
        const rows = await fetchRegisterDepartments();
        if (!cancelled) {
          setDepartmentOptions(Array.isArray(rows) ? rows : []);
        }
      } catch (err) {
        if (!cancelled) {
          setDepartmentOptions([]);
          setDepartmentsError(err.message || '학과 목록을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setDepartmentsLoading(false);
      }
    }

    loadDepartments();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadAdminData = useCallback(async () => {
    if (!session.token) return;

    setStatsLoading(true);
    setListsLoading(true);

    try {
      const [statsData, noticeRows, facilityRows] = await Promise.all([
        fetchAdminStats(session.token),
        fetchAdminNotices(session.token),
        fetchAdminFacilities(session.token),
      ]);

      setStats(statsData);
      setNotices(Array.isArray(noticeRows) ? noticeRows : []);
      setFacilities(Array.isArray(facilityRows) ? facilityRows : []);
    } catch {
      setStats({ activeAnnouncements: 0, registeredFacilities: 0 });
      setNotices([]);
      setFacilities([]);
    } finally {
      setStatsLoading(false);
      setListsLoading(false);
    }
  }, [session.token]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  useEffect(() => {
    if (!editingFacilityId || !departmentOptions.length) return;
    setFacilityForm((current) => {
      if (current.departmentId) return current;
      const facility = facilities.find((row) => row.id === editingFacilityId);
      if (!facility?.departmentName) return current;
      const departmentId = resolveDepartmentId(facility.departmentName, departmentOptions);
      if (!departmentId) return current;
      return { ...current, departmentId };
    });
  }, [departmentOptions, editingFacilityId, facilities]);

  const resetNoticeForm = () => {
    setEditingNoticeId(null);
    setNoticeForm(INITIAL_NOTICE_FORM);
    setNoticeMessage('');
    setNoticeMessageType('');
  };

  const resetFacilityForm = () => {
    setEditingFacilityId(null);
    setFacilityForm(INITIAL_FACILITY_FORM);
    setFacilityMessage('');
    setFacilityMessageType('');
  };

  const handleSelectNotice = (notice) => {
    setEditingNoticeId(notice.id);
    setNoticeForm({
      category: notice.category || 'General',
      expiryDate: notice.expiryDate || '',
      title: notice.title || '',
      content: notice.content || '',
    });
    setNoticeMessage('');
    setNoticeMessageType('');
  };

  const handleSelectFacility = (facility) => {
    setEditingFacilityId(facility.id);
    setFacilityForm({
      name: facility.name || '',
      departmentId: resolveDepartmentId(facility.departmentName, departmentOptions),
      capacity: facility.maxParticipants ? String(facility.maxParticipants) : '',
      location: facility.location || '',
      category: facility.category || 'student',
    });
    setFacilityMessage('');
    setFacilityMessageType('');
  };

  const handleNoticeChange = (field) => (event) => {
    setNoticeForm((current) => ({ ...current, [field]: event.target.value }));
    setNoticeMessage('');
    setNoticeMessageType('');
  };

  const handleFacilityChange = (field) => (event) => {
    setFacilityForm((current) => ({ ...current, [field]: event.target.value }));
    setFacilityMessage('');
    setFacilityMessageType('');
  };

  const handleFacilityComboboxChange = (field) => (nextValue) => {
    setFacilityForm((current) => ({ ...current, [field]: nextValue }));
    setFacilityMessage('');
    setFacilityMessageType('');
  };

  const handleFacilityCategoryChange = (event) => {
    const nextCategory = event.target.value;
    setFacilityForm((current) => ({
      ...current,
      category: nextCategory,
      departmentId: nextCategory === 'dept' ? current.departmentId : '',
    }));
    setFacilityMessage('');
    setFacilityMessageType('');
  };

  const handleNoticeCategoryChange = (nextCategory) => {
    setNoticeForm((current) => ({ ...current, category: nextCategory }));
    setNoticeMessage('');
    setNoticeMessageType('');
  };

  const handleNoticeSubmit = async (event) => {
    event.preventDefault();
    setNoticeMessage('');
    setNoticeMessageType('');

    if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
      setNoticeMessage('제목과 내용을 입력해 주세요.');
      setNoticeMessageType('error');
      return;
    }

    setNoticeSubmitting(true);
    try {
      const payload = {
        token: session.token,
        title: noticeForm.title.trim(),
        content: noticeForm.content.trim(),
        category: noticeForm.category,
        expiryDate: noticeForm.expiryDate || null,
      };

      if (editingNoticeId) {
        await updateAdminNotice({ ...payload, noticeId: editingNoticeId });
        setNoticeMessage('중요 공지가 수정되었습니다.');
      } else {
        await publishAdminNotice(payload);
        setNoticeMessage('중요 공지가 등록되었습니다.');
      }

      setNoticeMessageType('success');
      resetNoticeForm();
      await loadAdminData();
    } catch (err) {
      setNoticeMessage(err.message || '공지 저장에 실패했습니다.');
      setNoticeMessageType('error');
    } finally {
      setNoticeSubmitting(false);
    }
  };

  const handleNoticeDelete = async () => {
    if (!editingNoticeId) return;

    const notice = notices.find((row) => row.id === editingNoticeId);
    const label = notice?.title || '선택한 공지';
    if (!window.confirm(`「${label}」 공지를 삭제하시겠습니까?`)) return;

    setNoticeMessage('');
    setNoticeMessageType('');
    setNoticeDeleting(true);
    try {
      await deleteAdminNotice({ token: session.token, noticeId: editingNoticeId });
      setNoticeMessage('중요 공지가 삭제되었습니다.');
      setNoticeMessageType('success');
      resetNoticeForm();
      await loadAdminData();
    } catch (err) {
      setNoticeMessage(err.message || '공지 삭제에 실패했습니다.');
      setNoticeMessageType('error');
    } finally {
      setNoticeDeleting(false);
    }
  };

  const handleFacilitySubmit = async (event) => {
    event.preventDefault();
    setFacilityMessage('');
    setFacilityMessageType('');

    if (!facilityForm.name.trim() || !facilityForm.location.trim()) {
      setFacilityMessage('시설명과 위치를 입력해 주세요.');
      setFacilityMessageType('error');
      return;
    }

    if (facilityForm.category === 'dept' && !facilityForm.departmentId) {
      setFacilityMessage('학과 시설은 담당 학과를 선택해 주세요.');
      setFacilityMessageType('error');
      return;
    }

    const departmentName = resolveDepartmentName(facilityForm.departmentId, departmentOptions);

    setFacilitySubmitting(true);
    try {
      const payload = {
        token: session.token,
        name: facilityForm.name.trim(),
        location: facilityForm.location.trim(),
        capacity: facilityForm.capacity,
        category: facilityForm.category,
        departmentName,
      };

      if (editingFacilityId) {
        await updateAdminFacility({ ...payload, facilityId: editingFacilityId });
        setFacilityMessage('시설 정보가 수정되었습니다.');
      } else {
        await registerAdminFacility(payload);
        setFacilityMessage('시설이 등록되었습니다.');
      }

      setFacilityMessageType('success');
      resetFacilityForm();
      await loadAdminData();
    } catch (err) {
      setFacilityMessage(err.message || '시설 저장에 실패했습니다.');
      setFacilityMessageType('error');
    } finally {
      setFacilitySubmitting(false);
    }
  };

  const handleFacilityDelete = async () => {
    if (!editingFacilityId) return;

    const facility = facilities.find((row) => row.id === editingFacilityId);
    const label = facility?.name || '선택한 시설';
    if (!window.confirm(`「${label}」 시설을 삭제하시겠습니까?\n연결된 예약도 함께 삭제됩니다.`)) return;

    setFacilityMessage('');
    setFacilityMessageType('');
    setFacilityDeleting(true);
    try {
      await deleteAdminFacility({ token: session.token, facilityId: editingFacilityId });
      setFacilityMessage('시설이 삭제되었습니다.');
      setFacilityMessageType('success');
      resetFacilityForm();
      await loadAdminData();
    } catch (err) {
      setFacilityMessage(err.message || '시설 삭제에 실패했습니다.');
      setFacilityMessageType('error');
    } finally {
      setFacilityDeleting(false);
    }
  };

  return (
    <div className="admin-page bg-background text-on-background antialiased flex min-h-screen">
      <nav className="admin-sidebar bg-surface h-screen fixed left-0 top-0 border-r border-outline-variant flex flex-col py-8 px-4 z-50">
        <div className="mb-12 px-4">
          <h1 className="font-headline-md text-headline-md text-primary mb-2">백석 학생 허브</h1>
          <p className="font-label-md text-label-md tracking-wider text-on-surface-variant">
            관리자 포털
          </p>
        </div>
        <ul className="flex-1 space-y-2">
          <li>
            <a
              className="admin-nav-link admin-nav-link--active flex items-center gap-3 px-4 py-3 font-label-md text-label-md tracking-wider transition-colors duration-200"
              href="#announcements"
            >
              <span className="material-symbols-outlined">campaign</span>
              중요 공지
            </a>
          </li>
          <li>
            <a
              className="admin-nav-link flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-secondary transition-colors duration-200 font-label-md text-label-md tracking-wider"
              href="#facilities"
            >
              <span className="material-symbols-outlined">domain</span>
              시설 관리
            </a>
          </li>
        </ul>
        <div className="mt-auto px-4 space-y-2">
          <p className="text-xs text-on-surface-variant px-1">
            {session.name || '관리자'} ({session.studentId})
          </p>
          <button
            type="button"
            className="w-full py-3 bg-primary text-on-primary font-label-md text-label-md tracking-wider border border-primary hover:bg-secondary transition-colors"
            onClick={onLogout}
          >
            로그아웃
          </button>
        </div>
      </nav>

      <main className="admin-main flex-1 flex flex-col min-h-screen">
        <header className="bg-background sticky top-0 z-40 border-b border-outline-variant flex justify-between items-center h-16 px-margin-mobile md:px-margin-desktop">
          <div className="font-headline-md text-headline-md text-primary">학사 행정 관리</div>
        </header>

        <div className="flex-1 px-margin-mobile md:px-margin-desktop py-12">
          <section className="mb-16">
            <h2 className="font-display-lg text-display-lg text-primary mb-4">관리자 대시보드</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              중요 공지와 캠퍼스 시설을 등록·수정합니다. 변경 사항은 대시보드와 시설 예약 화면에 반영됩니다.
            </p>
            <div className="editorial-divider mt-8 w-1/3" />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-column-gap">
            <div className="lg:col-span-8 space-y-16">
              <section id="announcements">
                <div className="flex items-end justify-between mb-6 editorial-divider pb-2">
                  <h3 className="font-headline-md text-headline-md text-primary">중요 공지 관리</h3>
                </div>
                <div className="bg-surface-container-lowest border border-surface-variant p-8">
                  <h4 className="font-label-md text-label-md text-on-surface-variant mb-3">
                    등록된 공지 ({listsLoading ? '…' : notices.length})
                  </h4>
                  {listsLoading ? (
                    <p className="text-sm text-on-surface-variant mb-6">목록을 불러오는 중입니다…</p>
                  ) : notices.length === 0 ? (
                    <p className="text-sm text-on-surface-variant mb-6">등록된 중요 공지가 없습니다.</p>
                  ) : (
                    <div className="admin-record-list">
                      {notices.map((notice) => (
                        <button
                          key={notice.id}
                          type="button"
                          className={`admin-record-item${
                            editingNoticeId === notice.id ? ' admin-record-item--selected' : ''
                          }`}
                          onClick={() => handleSelectNotice(notice)}
                        >
                          <div className="admin-record-item__title">{notice.title}</div>
                          <div className="admin-record-item__meta">
                            {categoryLabel(notice.category)} · {formatDateLabel(notice.createdAt)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <h4 className="font-label-md text-label-md text-on-surface-variant mb-4">
                    {editingNoticeId ? '공지 수정' : '새 공지 작성'}
                  </h4>

                  <form className="space-y-6" onSubmit={handleNoticeSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="flex flex-col">
                        <label
                          htmlFor="notice-category"
                          className="font-label-md text-label-md text-on-surface-variant mb-2"
                        >
                          분류
                        </label>
                        <DepartmentCombobox
                          id="notice-category"
                          value={noticeForm.category}
                          onChange={handleNoticeCategoryChange}
                          options={NOTICE_CATEGORY_OPTIONS}
                          placeholder="분류 검색·선택"
                          emptyMessage="검색 결과가 없습니다"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label
                          htmlFor="notice-expiry"
                          className="font-label-md text-label-md text-on-surface-variant mb-2"
                        >
                          게시 만료일
                        </label>
                        <input
                          id="notice-expiry"
                          className="form-input-border font-body-md text-body-md text-on-background py-2"
                          type="date"
                          value={noticeForm.expiryDate}
                          onChange={handleNoticeChange('expiryDate')}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label
                        htmlFor="notice-title"
                        className="font-label-md text-label-md text-on-surface-variant mb-2"
                      >
                        제목
                      </label>
                      <input
                        id="notice-title"
                        className="form-input-border font-headline-md text-headline-md text-on-background py-2"
                        placeholder="공지 제목을 입력하세요"
                        type="text"
                        value={noticeForm.title}
                        onChange={handleNoticeChange('title')}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label
                        htmlFor="notice-content"
                        className="font-label-md text-label-md text-on-surface-variant mb-2"
                      >
                        내용
                      </label>
                      <div className="border border-surface-variant bg-background p-4 min-h-[200px]">
                        <textarea
                          id="notice-content"
                          className="w-full h-40 bg-transparent border-none focus:ring-0 font-body-md text-body-md resize-none"
                          placeholder="공지 내용을 입력하세요"
                          value={noticeForm.content}
                          onChange={handleNoticeChange('content')}
                        />
                      </div>
                    </div>
                    {noticeMessage && (
                      <p
                        className={`admin-form-message admin-form-message--${noticeMessageType || 'error'}`}
                      >
                        {noticeMessage}
                      </p>
                    )}
                    <div className="admin-section-actions">
                      {editingNoticeId && (
                        <>
                          <button
                            type="button"
                            className="admin-btn-danger"
                            onClick={handleNoticeDelete}
                            disabled={noticeSubmitting || noticeDeleting}
                          >
                            {noticeDeleting ? '삭제 중…' : '공지 삭제'}
                          </button>
                          <button
                            type="button"
                            className="admin-btn-secondary"
                            onClick={resetNoticeForm}
                            disabled={noticeSubmitting || noticeDeleting}
                          >
                            새 공지
                          </button>
                        </>
                      )}
                      <button
                        className="px-8 py-3 bg-primary text-on-primary font-label-md text-label-md tracking-wider hover:bg-secondary transition-colors disabled:opacity-60"
                        type="submit"
                        disabled={noticeSubmitting || noticeDeleting}
                      >
                        {noticeSubmitting
                          ? '저장 중…'
                          : editingNoticeId
                            ? '공지 수정'
                            : '공지 등록'}
                      </button>
                    </div>
                  </form>
                </div>
              </section>

              <section id="facilities">
                <div className="flex items-end justify-between mb-6 editorial-divider pb-2">
                  <h3 className="font-headline-md text-headline-md text-primary">시설 등록 및 관리</h3>
                </div>
                <div className="bg-surface-container-lowest border border-surface-variant p-8">
                  <h4 className="font-label-md text-label-md text-on-surface-variant mb-3">
                    등록된 시설 ({listsLoading ? '…' : facilities.length})
                  </h4>
                  {listsLoading ? (
                    <p className="text-sm text-on-surface-variant mb-6">목록을 불러오는 중입니다…</p>
                  ) : facilities.length === 0 ? (
                    <p className="text-sm text-on-surface-variant mb-6">등록된 시설이 없습니다.</p>
                  ) : (
                    <div className="admin-record-list">
                      {facilities.map((facility) => (
                        <button
                          key={facility.id}
                          type="button"
                          className={`admin-record-item${
                            editingFacilityId === facility.id ? ' admin-record-item--selected' : ''
                          }`}
                          onClick={() => handleSelectFacility(facility)}
                        >
                          <div className="admin-record-item__title">{facility.name}</div>
                          <div className="admin-record-item__meta">
                            {facilityCategoryLabel(facility.category)} · {facility.location}
                            {facility.departmentName ? ` · ${facility.departmentName}` : ''}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <h4 className="font-label-md text-label-md text-on-surface-variant mb-4">
                    {editingFacilityId ? '시설 수정' : '새 시설 등록'}
                  </h4>

                  <form className="space-y-6" onSubmit={handleFacilitySubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="flex flex-col">
                        <label
                          htmlFor="facility-name"
                          className="font-label-md text-label-md text-on-surface-variant mb-2"
                        >
                          시설명
                        </label>
                        <input
                          id="facility-name"
                          className="form-input-border font-body-md text-body-md text-on-background py-2"
                          type="text"
                          value={facilityForm.name}
                          onChange={handleFacilityChange('name')}
                        />
                      </div>
                      <div className="flex flex-col">
                        <label
                          htmlFor="facility-category"
                          className="font-label-md text-label-md text-on-surface-variant mb-2"
                        >
                          구분
                        </label>
                        <select
                          id="facility-category"
                          className="form-input-border form-select-border font-body-md text-body-md text-on-background py-2"
                          value={facilityForm.category}
                          onChange={handleFacilityCategoryChange}
                        >
                          {FACILITY_CATEGORIES.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {facilityForm.category === 'dept' && (
                        <div className="flex flex-col md:col-span-2">
                          <label
                            htmlFor="facility-department"
                            className="font-label-md text-label-md text-on-surface-variant mb-2"
                          >
                            담당 학과
                          </label>
                          <DepartmentCombobox
                            id="facility-department"
                            className="regi-dept-picker"
                            value={facilityForm.departmentId}
                            onChange={handleFacilityComboboxChange('departmentId')}
                            options={departmentOptions}
                            loading={departmentsLoading}
                            error={departmentsError}
                            placeholder="학과 검색·선택"
                            emptyMessage="검색 결과가 없습니다"
                          />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <label
                          htmlFor="facility-capacity"
                          className="font-label-md text-label-md text-on-surface-variant mb-2"
                        >
                          수용 인원
                        </label>
                        <input
                          id="facility-capacity"
                          className="form-input-border font-body-md text-body-md text-on-background py-2"
                          type="number"
                          min="1"
                          value={facilityForm.capacity}
                          onChange={handleFacilityChange('capacity')}
                        />
                      </div>
                      <div className="flex flex-col">
                        <label
                          htmlFor="facility-location"
                          className="font-label-md text-label-md text-on-surface-variant mb-2"
                        >
                          위치
                        </label>
                        <input
                          id="facility-location"
                          className="form-input-border font-body-md text-body-md text-on-background py-2"
                          type="text"
                          value={facilityForm.location}
                          onChange={handleFacilityChange('location')}
                        />
                      </div>
                    </div>
                    {facilityMessage && (
                      <p
                        className={`admin-form-message admin-form-message--${facilityMessageType || 'error'}`}
                      >
                        {facilityMessage}
                      </p>
                    )}
                    <div className="admin-section-actions">
                      {editingFacilityId && (
                        <>
                          <button
                            type="button"
                            className="admin-btn-danger"
                            onClick={handleFacilityDelete}
                            disabled={facilitySubmitting || facilityDeleting}
                          >
                            {facilityDeleting ? '삭제 중…' : '시설 삭제'}
                          </button>
                          <button
                            type="button"
                            className="admin-btn-secondary"
                            onClick={resetFacilityForm}
                            disabled={facilitySubmitting || facilityDeleting}
                          >
                            새 시설
                          </button>
                        </>
                      )}
                      <button
                        className="px-8 py-3 bg-primary text-on-primary font-label-md text-label-md tracking-wider hover:bg-secondary transition-colors disabled:opacity-60"
                        type="submit"
                        disabled={facilitySubmitting || facilityDeleting}
                      >
                        {facilitySubmitting
                          ? '저장 중…'
                          : editingFacilityId
                            ? '시설 수정'
                            : '시설 등록'}
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            </div>

            <aside className="lg:col-span-4 space-y-12 lg:pl-8 lg:border-l lg:border-surface-variant">
              <section>
                <h4 className="font-headline-md text-headline-md text-primary mb-4 editorial-divider pb-2">
                  운영 현황
                </h4>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="font-body-md text-body-md text-on-surface-variant">중요 공지</span>
                    <span className="font-headline-md text-headline-md text-primary">
                      {statsLoading ? '…' : stats.activeAnnouncements}
                    </span>
                  </div>
                  <div className="navy-divider opacity-20" />
                  <div className="flex items-center justify-between">
                    <span className="font-body-md text-body-md text-on-surface-variant">등록 시설</span>
                    <span className="font-headline-md text-headline-md text-secondary">
                      {statsLoading ? '…' : stats.registeredFacilities}
                    </span>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>

        <footer className="bg-surface-container-lowest border-t border-outline-variant py-8 px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-4 mt-auto">
          <div className="font-headline-md text-headline-md text-primary">백석 학생 허브</div>
          <div className="font-label-md text-label-md text-on-surface-variant">
            © 2024 백석대학교 Student Hub
          </div>
        </footer>
      </main>
    </div>
  );
}

export default Admin;
