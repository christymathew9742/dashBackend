const express = require('express');
const {createAiData, getAiResponse} = require('../../controllers/gemiAi/gemiAiController');
const {validateAiResponse,aiValidate} = require('../../middlewares/gemiAiMiddleware/gemiAiMiddleware')
const authMiddleware = require('../../middlewares/authMiddleware');
const router = express.Router();

router.post('/',authMiddleware,validateAiResponse,aiValidate,createAiData);
router.get('/:id', authMiddleware,getAiResponse);

module.exports = router;