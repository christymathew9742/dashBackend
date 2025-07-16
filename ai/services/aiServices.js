// const NodeCache = require('node-cache');
// const AppointmentModal = require('../../models/AppointmentModal');
// const generateDynamicPrompt = require('../../ai/training/preprocess');
// const generateAIResponse = require('../model/aiModel');
// const {
//     cleanAIResponse, 
//     extractJsonFromResponse, 
//     safeParseOptions,
// } = require('../../utils/common');
// const { ChatBotModel } = require('../../models/chatBotModel/chatBotModel');

// const userConversationHistories = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

// const updateConversationHistory = (userPhone, prompt, aiResponse) => {
//     const session = userConversationHistories.get(userPhone) || { conversation: [] };
//     const newTurn = [`Consultant: ${prompt}`, `AI: ${aiResponse}`];

//     session.conversation.push(...newTurn);
//     userConversationHistories.set(userPhone, session);
// };

// const clearUserSessionData = (userPhone) => {
//     userConversationHistories.del(userPhone);
// };
  
// const createAIResponse = async (chatData) => {
//     try {
//         const { userPhone, userInput: prompt, userOption, userId } = chatData;
//         const isStartingWithP = typeof userOption === 'string' && userOption?.startsWith('P-');
//         const userPrompt = userOption && isStartingWithP ? userOption : prompt;

//         let session = userConversationHistories.get(userPhone) || {
//             conversation: [],
//             selectedFlowId: null,
//             userOptionsShown: false,
//         };

//         if (!session.selectedFlowId && !userOption) {
//             const flows =   await ChatBotModel.find({ user: userId, status:true }, '_id title').limit(5).lean();
//             if (flows.length > 1) {
//                 session.userOptionsShown = true;
//                 userConversationHistories.set(userPhone, session);
//                 return {
//                     optionsArray: flows.map(({ _id, title }) => ({ _id, title }))
//                 };
//             } else if (flows.length === 1) {
//                 session.selectedFlowId = flows[0]._id;
//             } else {
//                 return { message: "No AI flow is currently available for your profile." };
//             }
//         }

//         if (userOption && !session.selectedFlowId) {
//             session.selectedFlowId = userOption;
//         }

//         userConversationHistories.set(userPhone, session);

//         const flowTrainingData = await ChatBotModel.findOne({ _id: session.selectedFlowId }, 'edges nodes').lean();
//         if (!flowTrainingData && !userPrompt) return { message: "Selected flow not found." };

//         const generatedPrompt = await generateDynamicPrompt(session.conversation, userPrompt, flowTrainingData);
//         const aiResponse = await generateAIResponse(generatedPrompt);
//         const options = safeParseOptions(aiResponse) 
    
//         updateConversationHistory(userPhone, userPrompt, aiResponse);

//         const extractJsonFromResp = extractJsonFromResponse(aiResponse);
//         const cleanAIResp = cleanAIResponse(aiResponse);

//         if (Array.isArray(options) && options.length > 0) {
//             return {
//               optionsArray: options.map(({ id, value }) => ({ _id: id, title: value }))
//             };
//         }

//         if (extractJsonFromResp) {
//             await AppointmentModal.create({
//                 user: userId,
//                 whatsAppNumber: userPhone,
//                 flowId: session.selectedFlowId,
//                 data: typeof extractJsonFromResp === 'string'
//                     ? JSON.parse(extractJsonFromResp)
//                     : extractJsonFromResp
//             });
            
//             clearUserSessionData(userPhone);
//         }
      
//         return { message: cleanAIResp };

//     } catch (error) {
//         console.error("AI Processing Error:", error);
//         return { message: "Please be patient, all my AI buddies are currently busy." };
//     }
// };

// module.exports = createAIResponse;

const NodeCache = require('node-cache');
const AppointmentModal = require('../../models/AppointmentModal');
const generateDynamicPrompt = require('../../ai/training/preprocess');
const generateAIResponse = require('../model/aiModel');
const {
    cleanAIResponse, 
    extractJsonFromResponse, 
    safeParseOptions,
} = require('../../utils/common');
const { ChatBotModel } = require('../../models/chatBotModel/chatBotModel');

const userConversationHistories = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

const updateConversationHistory = (userPhone, prompt, aiResponse) => {
    const session = userConversationHistories.get(userPhone) || { conversation: [] };
    const newTurn = [`Consultant: ${prompt}`, `AI: ${aiResponse}`];
    session.conversation.push(...newTurn);
    userConversationHistories.set(userPhone, session);
};

const clearUserSessionData = (userPhone) => {
    userConversationHistories.del(userPhone);
};

const createAIResponse = async (chatData) => {
    try {
        const { userPhone, userInput: prompt, userOption, userId } = chatData;
        const isStartingWithP = typeof userOption === 'string' && userOption?.startsWith('P-');
        const userPrompt = userOption && isStartingWithP ? userOption : prompt;
        const existingAppointment = await AppointmentModal.findOne({ whatsAppNumber: userPhone }).lean();

        let session = userConversationHistories.get(userPhone) || {
            conversation: [],
            selectedFlowId: null,
            userOptionsShown: false,
            existingUserData: null,
            awaitingRescheduleOrCancel: false,
        };
       
        if (!session.awaitingRescheduleOrCancel) {
            
            if (existingAppointment) {
                session.awaitingRescheduleOrCancel = true;
                session.existingUserData = existingAppointment;
                userConversationHistories.set(userPhone, session);

                return {
                    optionsArray: {
                    mainTitle: `Hi ${existingAppointment?.data?.name || "there"}, welcome back again! You already have an appointment. Would you like to cancel or reschedule it?`,
                    items: [
                        { _id: 'reschedule', title: 'Reschedule Appointment' },
                        { _id: 'cancel', title: 'Cancel Appointment' }
                    ]
                    }
                };
            
            }
        }

        if (session.awaitingRescheduleOrCancel && userOption) {
            if (userOption) {
                if (userOption === 'cancel') {
                    await AppointmentModal.deleteOne({ whatsAppNumber: userPhone });
                    clearUserSessionData(userPhone);
                    return { message: 'Your appointment has been cancelled successfully.' };
                }
    
                if (userOption === 'reschedule') {
                    session.selectedFlowId = session.existingUserData?.flowId || null;
                    session.conversation = [];
                    userConversationHistories.set(userPhone, session);
                }
            }
        }

        if (!session.selectedFlowId && !userOption) {
            const flows = await ChatBotModel.find({ user: userId, status: true }, '_id title').limit(5).lean();
          
            if (flows.length > 1) {
              session.userOptionsShown = true;
              userConversationHistories.set(userPhone, session);
              return {
                optionsArray: {
                  mainTitle: "Please select an Appointment to continue:",
                  items: flows.map(({ _id, title }) => ({ _id, title }))
                }
              };
            } else if (flows.length === 1) {
              session.selectedFlowId = flows[0]._id;
            } else {
              return { message: "No AI flow is currently available for your profile." };
            }
        }
          
        if (!existingAppointment && userOption && !session.selectedFlowId) {
            session.selectedFlowId = userOption;
        }

        userConversationHistories.set(userPhone, session);

        const flowTrainingData = await ChatBotModel.findOne({ _id: session.selectedFlowId }, 'edges nodes').lean();
        if (!flowTrainingData && !userPrompt) return { message: "Selected flow not found." };

        const generatedPrompt = await generateDynamicPrompt(session.conversation, userPrompt, flowTrainingData);
        const aiResponse = await generateAIResponse(generatedPrompt);
        const options = safeParseOptions(aiResponse);
        updateConversationHistory(userPhone, userPrompt, aiResponse);

        const extractJsonFromResp = extractJsonFromResponse(aiResponse);
        const cleanAIResp = cleanAIResponse(aiResponse);

        if (Array.isArray(options) && options.length > 0) {
            const [{ id: firstId, value: mainTitle }, ...rest] = options;
          
            return {
              optionsArray: {
                mainTitle,
                items: rest.map(({ id, value }) => ({ _id: id, title: value }))
              }
            };
        }
          
        if (extractJsonFromResp) {
            await AppointmentModal.create({
                user: userId,
                whatsAppNumber: userPhone,
                flowId: session.selectedFlowId,
                data: typeof extractJsonFromResp === 'string'
                    ? JSON.parse(extractJsonFromResp)
                    : extractJsonFromResp
            });
            clearUserSessionData(userPhone);
        }

        return { message: cleanAIResp };

    } catch (error) {
        console.error("AI Processing Error:", error);
        return { message: "Please be patient, all my AI buddies are currently busy." };
    }
};

module.exports = createAIResponse;






























