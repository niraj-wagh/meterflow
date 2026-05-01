const express = require('express');
const router = express.Router();
const { createApi, getMyApis, getApi, updateApi, deleteApi } = require('../controllers/apiController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getMyApis).post(createApi);
router.route('/:id').get(getApi).put(updateApi).delete(deleteApi);

module.exports = router;
