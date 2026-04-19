const express = require('express');
const router  = express.Router();
const userController              = require('../controllers/userController');
const { validate, validateEmail } = require('../middlewares/validate');

router.get('/',       userController.getAll);
router.get('/:id',    userController.getOne);
router.post('/',      validate('name', 'email'), validateEmail('email'), userController.create);
router.delete('/:id', userController.delete);

module.exports = router;
