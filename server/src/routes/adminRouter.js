const express = require('express');
const adminController = require('../controllers/adminController');
const requireAuth = require('../middlewares/requireAuth');
const requireAdmin = require('../middlewares/requireAdmin');
const { validate } = require('../middlewares/validate');

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get('/stats', adminController.getStats);
router.get('/notices', adminController.listNotices);
router.post('/notices', validate('title', 'content'), adminController.createNotice);
router.patch('/notices/:id', validate('title', 'content'), adminController.updateNotice);
router.delete('/notices/:id', adminController.deleteNotice);
router.get('/facilities', adminController.listFacilities);
router.post('/facilities', validate('name', 'location'), adminController.createFacility);
router.patch('/facilities/:id', validate('name', 'location'), adminController.updateFacility);
router.delete('/facilities/:id', adminController.deleteFacility);

module.exports = router;
