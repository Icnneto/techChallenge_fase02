const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

// públicas
router.get('/search', postController.searchPosts);
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);

// privadas - apenas professores
router.post('/', authMiddleware, (req, res, next) => {
    if (!req.profile.is_teacher) return res.status(403).json({ error: 'Only teachers can create posts' });
    next();
}, postController.createPost);

router.put('/:id', authMiddleware, (req, res, next) => {
    if (!req.profile.is_teacher) return res.status(403).json({ error: 'Only teachers can create posts' });
    next();
}, postController.updatePost);

router.delete('/:id', authMiddleware, (req, res, next) => {
    if (!req.profile.is_teacher) return res.status(403).json({ error: 'Only teachers can create posts' });
    next();
}, postController.deletePost);

module.exports = router;