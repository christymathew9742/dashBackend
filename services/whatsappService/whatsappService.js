// const createAIResponse = require('../../ai/services/aiServices')

// const handleConversation = async (userData) => {
  
//   try {
//       const aiResponse = await createAIResponse(userData); 
//       return aiResponse?.message ? {resp:aiResponse?.message,type:'text'} : {resp:aiResponse?.optionsArray,type:'list'}
//   } catch (error) {
//       console.error('Error in handling conversation:', error);
//   }
// };

// module.exports =  handleConversation ;

const createAIResponse = require('../../ai/services/aiServices');

const handleConversation = async (userData) => {
  console.log(userData,'userData')
  try {
    const aiResponse = await createAIResponse(userData);

    // Return both message and list if both exist
    if (aiResponse?.message && aiResponse?.optionsArray) {
      return {
        resp: {
          message: aiResponse.message,
          options: aiResponse.optionsArray
        },
        type: 'text+list'
      };
    }

    // Return only text
    if (aiResponse?.message) {
      return {
        resp: aiResponse.message,
        type: 'text'
      };
    };

    // Return only list
    if (aiResponse?.optionsArray) {
      return {
        resp: aiResponse.optionsArray.items,
        type: 'list',
        mainTitle: aiResponse.optionsArray.mainTitle,
      }
    };

    // Fallback in case nothing is returned
    return {
      resp: 'Please try again.',
      type: 'text'
    };
    
  } catch (error) {
    console.error('Error in handling conversation:', error);
    return {
      resp: 'An unexpected error occurred.',
      type: 'text'
    };
  }
};

module.exports = handleConversation;




