const AdminModel = require('../models/adminModel');
const { sanitizePostContent, isEmptyHtml } = require('../utils/sanitizeHtml');

function parseNoticeId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) return null;
  return id;
}

function parseFacilityId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) return null;
  return id;
}

const adminController = {
  getStats: async (req, res, next) => {
    try {
      const stats = await AdminModel.getStats();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  },

  listNotices: async (req, res, next) => {
    try {
      const notices = await AdminModel.listDashboardNotices();
      res.json(notices);
    } catch (err) {
      next(err);
    }
  },

  createNotice: async (req, res, next) => {
    try {
      const title = String(req.body.title ?? '').trim();
      const content = sanitizePostContent(req.body.content);

      if (!title) {
        return res.status(400).json({ message: '제목을 입력해 주세요.' });
      }

      if (isEmptyHtml(content)) {
        return res.status(400).json({ message: '내용을 입력해 주세요.' });
      }

      const notice = await AdminModel.createDashboardNotice({
        userId: req.user.id,
        title,
        content,
        category: req.body.category,
        expiryDate: req.body.expiryDate,
      });

      res.status(201).json(notice);
    } catch (err) {
      next(err);
    }
  },

  updateNotice: async (req, res, next) => {
    try {
      const noticeId = parseNoticeId(req.params.id);
      if (!noticeId) {
        return res.status(400).json({ message: '유효하지 않은 공지입니다.' });
      }

      const title = String(req.body.title ?? '').trim();
      const content = sanitizePostContent(req.body.content);

      if (!title) {
        return res.status(400).json({ message: '제목을 입력해 주세요.' });
      }

      if (isEmptyHtml(content)) {
        return res.status(400).json({ message: '내용을 입력해 주세요.' });
      }

      const notice = await AdminModel.updateDashboardNotice({
        noticeId,
        title,
        content,
        category: req.body.category,
        expiryDate: req.body.expiryDate,
      });

      res.json(notice);
    } catch (err) {
      next(err);
    }
  },

  deleteNotice: async (req, res, next) => {
    try {
      const noticeId = parseNoticeId(req.params.id);
      if (!noticeId) {
        return res.status(400).json({ message: '유효하지 않은 공지입니다.' });
      }

      const result = await AdminModel.deleteDashboardNotice(noticeId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  listFacilities: async (req, res, next) => {
    try {
      const facilities = await AdminModel.listFacilities();
      res.json(facilities);
    } catch (err) {
      next(err);
    }
  },

  createFacility: async (req, res, next) => {
    try {
      const name = String(req.body.name ?? '').trim();
      const location = String(req.body.location ?? '').trim();

      if (!name) {
        return res.status(400).json({ message: '시설명을 입력해 주세요.' });
      }

      if (!location) {
        return res.status(400).json({ message: '위치를 입력해 주세요.' });
      }

      const facility = await AdminModel.createFacility({
        name,
        location,
        capacity: req.body.capacity,
        category: req.body.category,
        departmentName: req.body.departmentName,
      });

      res.status(201).json(facility);
    } catch (err) {
      next(err);
    }
  },

  updateFacility: async (req, res, next) => {
    try {
      const facilityId = parseFacilityId(req.params.id);
      if (!facilityId) {
        return res.status(400).json({ message: '유효하지 않은 시설입니다.' });
      }

      const name = String(req.body.name ?? '').trim();
      const location = String(req.body.location ?? '').trim();

      if (!name) {
        return res.status(400).json({ message: '시설명을 입력해 주세요.' });
      }

      if (!location) {
        return res.status(400).json({ message: '위치를 입력해 주세요.' });
      }

      const facility = await AdminModel.updateFacility({
        facilityId,
        name,
        location,
        capacity: req.body.capacity,
        category: req.body.category,
        departmentName: req.body.departmentName,
      });

      res.json(facility);
    } catch (err) {
      next(err);
    }
  },

  deleteFacility: async (req, res, next) => {
    try {
      const facilityId = parseFacilityId(req.params.id);
      if (!facilityId) {
        return res.status(400).json({ message: '유효하지 않은 시설입니다.' });
      }

      const result = await AdminModel.deleteFacility(facilityId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminController;
