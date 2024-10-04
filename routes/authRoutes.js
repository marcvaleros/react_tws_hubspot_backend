const express = require('express');
const router = express.Router(); 
const {signup, login, verifyMagicLink} = require('../controllers/authController');


router.post('/signup', signup);
router.post('/login', login);
router.get('/verification/:token', verifyMagicLink);

module.exports = router;