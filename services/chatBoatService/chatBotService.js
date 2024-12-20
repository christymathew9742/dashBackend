const {ChatBotModel} = require('../../models/chatBotModel/chatBotModel');
const { errorResponse } = require('../../utils/errorResponse');

// Creating a new ChatBot
const createChatBot = async (chatBotData) => {
    try {
        const chatBot = new ChatBotModel(chatBotData);
        if (!chatBot) {
            throw errorResponse('chatBot not found', 404);
        }
        return await chatBot.save();
    } catch (error) {
        throw new Error('Error creating chatBot');
    }
};

// Getting all ChatBot for a specific user
const getAllChatBot= async (userId) => {
  try {
      return await ChatBotModel.find({ user: userId });
  } catch (error) {
      throw new Error(`Error fetching ChatBot: ${error.message}`);
  }
};

// Getting a single ChatBot by ID for a specific user
const getChatBotById = async (id, userId) => {
  
  try {
      const chatBot = await ChatBotModel.findOne({ _id:id, user: userId });
      if (!chatBot) {
          throw errorResponse('ChatBot not found', 404);
      }
      return chatBot;
  } catch (error) {
      throw new Error('Error fetching ChatBot');
  }
};

//Updating a ChatBot for a specific user
const updateChatBot = async (id, chatBot, userId) => {
  try {
      const updatedChatBot = await ChatBotModel.findOneAndUpdate(
          { _id: id, user: userId },
          chatBot,
          {
              new: true,
              runValidators: true,
          }
      );
      if (!updatedChatBot) {
          throw errorResponse('ChatBot not found', 404);
      }
      return updatedChatBot;
  } catch (error) {
      throw new Error('Error updating ChatBot');
  }
};

// Deleting a ChatBot for a specific user
const deleteChatBot = async (id, userId) => {
  try {
      const chatBot = await ChatBotModel.findOneAndDelete({ _id: id, user: userId });
      if (!chatBot) {
          throw errorResponse('ChatBot not found', 404);
      }
      return 'ChatBot deleted successfully';
  } catch (error) {
    throw errorResponse(error.message || 'Error deleting ChatBot', error.status || 500);
  }
};

module.exports = {
  createChatBot,
  getAllChatBot,
  getChatBotById,
  updateChatBot,
  deleteChatBot,
};