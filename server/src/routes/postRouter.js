const express = require('express');
const router  = express.Router();
const postController     = require('../controllers/postController');
const { validate }       = require('../middlewares/validate');

router.get('/',       postController.getAll);
router.get('/:id',    postController.getOne);
router.post('/',      validate('title', 'body'), postController.create);
router.delete('/:id', postController.delete);

module.exports = router;
