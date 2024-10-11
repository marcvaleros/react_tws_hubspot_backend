const express = require('express');
const router = express.Router(); 
const {signup, verifyMagicLink} = require('../controllers/auth');
const {getUserById, getAllUsers, updateUserAssociation} = require('../controllers/user');
const {authenticateJWT} = require('../middlewares/authMiddleware');
const { getAllFranchisees } = require('../controllers/franchisee');

router.post('/signup', signup);
router.get('/verification/:token', verifyMagicLink);

router.get('/user', authenticateJWT, getUserById);
router.put('/user/:user_id/update/:tws_id', authenticateJWT, updateUserAssociation);
router.get('/users/list', authenticateJWT, getAllUsers);

router.get('/franchisees/list', authenticateJWT, getAllFranchisees);

module.exports = router;