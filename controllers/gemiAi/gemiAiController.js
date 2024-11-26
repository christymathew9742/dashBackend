const { errorResponse } = require('../../utils/errorResponse');
const {createAIResponse,getAIResponseStatus} = require('../../services/aiServices/aiServices')

// Create ai responser
const createAiData = async (req, res, next) => {
    try {
        if (!req.user || !req.user.userId) {
            return next(errorResponse('user not responding ', 401));
        }
        const aiData = req.body;
        aiData.user = req.user.userId;
        const newAiResponse = await createAIResponse(aiData);
        res.status(201).json({ success: true, data: newAiResponse });
    } catch (error) {
        next(error);
    }
};

// Get ai response
const getAiResponse = async (req, res, next) => {
    try {
            const aiResponse = await getAIResponseStatus(req.params.id, req.user.userId);
            if (!aiResponse) {
                return res.status(404).json({ success: false, message: 'AI response not found' });
            }
        res.status(200).json({ success: true, data: aiResponse });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createAiData,
    getAiResponse,
};