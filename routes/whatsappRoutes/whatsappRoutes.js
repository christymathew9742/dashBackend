const express = require('express');
const { verifyWebhook, handleIncomingMessage } = require('../../controllers/whatsappController/whatsappController');

const router = express.Router();
console.log(verifyWebhook,'verifyWebhook')
router.get('/webhook', verifyWebhook);
router.post('/webhook', handleIncomingMessage);

module.exports = router;


