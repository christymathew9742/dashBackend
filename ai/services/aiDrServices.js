const { DrConsultantModal, DepartmentModal } = require('../../models/drAppointment/drModel');
const generateDynamicPrompt = require('../../ai/training/drTraining/preprocess');
const generateAIResponse = require('../model/aiModel');
const cleanAIResponse = require('../../utils/common')

let userConversationHistories = {};
const updateConversationHistory = (userPhone, patientMessage, aiResponse) => {
    if (!userConversationHistories[userPhone]) {
        userConversationHistories[userPhone] = [];
    }
    userConversationHistories[userPhone].push(`Consultant: ${patientMessage}`);
    userConversationHistories[userPhone].push(`Eva: ${aiResponse}`);
};

const clearConversationHistory = (userPhone) => {
    delete userConversationHistories[userPhone];
};

const createAIResponse = async (userData) => {
    try {
        const { userPhone, userInput: prompt } = userData;
        const doctorData = await DepartmentModal.find();
        const regularConseltentData =  await DrConsultantModal.findOne({ userPhone })   
        const conversationHistory = userConversationHistories[userPhone] || [];
        const generatedPrompt = await generateDynamicPrompt(
            conversationHistory,
            prompt,
            doctorData,
            regularConseltentData,
        );
        console.log(regularConseltentData,userPhone)
        const expectedKeys = ['dId', 'name', 'age', 'doctor', 'date', 'token', 'department'];
        const aiResponse = await generateAIResponse(generatedPrompt);
        // console.log(aiResponse,'aiResponse')
        const match = aiResponse && aiResponse?.match(/{[\s\S]*}/)?.[0];
        const extractedObjs = match ? JSON.parse(match) : {};
        const aiCleanedResponse = cleanAIResponse(aiResponse && aiResponse.replace(match || '', ''));
        const isAllKeys = expectedKeys.every((key) => Object.hasOwn(extractedObjs, key) && extractedObjs[key]);
        updateConversationHistory(userPhone, prompt, aiCleanedResponse);

        if (regularConseltentData && Object.keys(regularConseltentData)?.length) {
            const updatedFields = Object.fromEntries(
                Object?.entries(extractedObjs)
                    ?.filter(([key, value]) => 
                        expectedKeys?.includes(key) && 
                        value !== regularConseltentData[key]
                    )
            );
        
            if (Object.keys(updatedFields)?.length > 0) {
                await DrConsultantModal.updateOne({ userPhone }, { $set: updatedFields });
            }  
            clearConversationHistory(userPhone);  

        } else if (isAllKeys && !regularConseltentData) {
            const newData = { ...userData, ...extractedObjs };
            const saved = await new DrConsultantModal(newData).save();

            if (saved) {
                const dIdArray = await DrConsultantModal.distinct('dId');
                const batchSize = 50;

                for (let i = 0; i < dIdArray.length; i += batchSize) {
                    const batch = dIdArray.slice(i, i + batchSize);
                    await Promise.all(
                        batch.map(async (elem) => {
                            const department = await DepartmentModal.findById(elem);
                            if (department) {
                                const currentTokenCount = await DrConsultantModal.countDocuments({ dId: elem });
                                const tokenStatus = department.totalToken - currentTokenCount;

                                if (department.currentToken !== currentTokenCount) {
                                    await DepartmentModal.findByIdAndUpdate(
                                        elem,
                                        {
                                            currentToken: currentTokenCount,
                                            tokenStatus,
                                        },
                                        { new: true, runValidators: true }
                                    );
                                }
                            }
                        })
                    );
                }
            }
            clearConversationHistory(userPhone);
        }

        return { message: aiCleanedResponse };
    } catch (error) {
        console.error('Error in processing:', error);
        return { message: "Please be patient, all my buddy's are busy." };
    }
};

module.exports = createAIResponse;



