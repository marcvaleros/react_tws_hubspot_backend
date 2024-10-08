const express = require('express');
const router = express.Router(); 
const {signup, verifyMagicLink} = require('../controllers/authController');
const {getUserById} = require('../controllers/userController');
const {authenticateJWT} = require('../middlewares/authMiddleware');
const { getAllFranchisees } = require('../controllers/franchiseeController');

router.post('/signup', signup);
router.get('/verification/:token', verifyMagicLink);

router.get('/user', authenticateJWT, getUserById);
router.get('/franchisees/list', getAllFranchisees);

module.exports = router;