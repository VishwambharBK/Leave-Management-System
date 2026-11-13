const express = require('express');
const { getPolicies, updatePolicy } = require('../controllers/policyController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { updatePolicySchema } = require('../validators/schemas');

const router = express.Router();

router.use(protect);

router.get('/', getPolicies);
router.put('/:id', authorize('admin'), validate(updatePolicySchema), updatePolicy);

module.exports = router;

