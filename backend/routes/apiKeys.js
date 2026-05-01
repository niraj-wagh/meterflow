const express = require('express');
const router = express.Router();
const { generateKey, getMyKeys, getKeysByApi, revokeKey, rotateKey, deleteKey } = require('../controllers/apiKeyController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getMyKeys).post(generateKey);
router.get('/api/:apiId', getKeysByApi);
router.put('/:id/revoke', revokeKey);
router.put('/:id/rotate', rotateKey);
router.delete('/:id', deleteKey);

module.exports = router;
