const createAIResponse = require('../../ai/services/aiDrServices')

const handleConversation = async (userData) => {
  try {
      const aiResponse = await createAIResponse(userData); 
      return aiResponse?.message;
  } catch (error) {
      console.error('Error in handling conversation:', error);
  }
};

module.exports =  handleConversation ;



