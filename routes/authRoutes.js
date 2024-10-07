const express = require('express');
const router = express.Router(); 
const {signup, verifyMagicLink} = require('../controllers/authController');
const {getUserById} = require('../controllers/userController');
const {authenticateJWT} = require('../middlewares/authMiddleware');

router.post('/signup', signup);
router.get('/verification/:token', verifyMagicLink);

router.get('/user', authenticateJWT, getUserById);

module.exports = router;