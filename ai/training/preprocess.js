const generateDynamicFlowData = require('./conversationFlowGenerator');

const extractMandatoryFieldsFromFlow = (flowTrainingData) => {
    const fieldSet = new Set();
    const optionObjects = [];

    flowTrainingData?.nodes?.forEach((node) => {
        node?.data?.inputs?.forEach((input) => {
            if (input?.field === 'replay') {
                const matches = input.value.match(/\[([^\]]+)\]/g);

                if (matches && matches.length > 0) {
                    matches.forEach((match) => {
                        const fieldName = match.replace(/[\[\]]/g, '').trim();
                        if (fieldName) fieldSet.add(fieldName);
                    });
                }
            } else if (input?.field === 'preference') {
                input?.options?.forEach((opt, i) => {
                    if (i > 0) {
                        optionObjects.push({
                            id: opt?.id,
                            value: opt?.value?.trim()
                        });
                    }
                });
            }
        });
    });

    const result = Array.from(fieldSet);
    if (optionObjects.length > 0) {
        result.push({
            field: 'preference',
            preferenceOptions: optionObjects
        });
    }

    return result;
};

const generateDynamicPrompt = async (
    conversationHistory,
    ConsultantMessage,
    flowTrainingData,
    currentNodeId,
    userData = {}
) => {
    if (!flowTrainingData) return null;

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toLocaleTimeString();
    const currentYear = now.getFullYear();

    console.log(conversationHistory,'conversationHistory')

    const structuredFlow = generateDynamicFlowData(flowTrainingData);
    const currentStep = structuredFlow?.find(step => step.nodeId === currentNodeId);
    if (!currentStep) return `⚠️ Error: Flow step with nodeId "${currentNodeId}" not found.`;

    const mandatoryFields = extractMandatoryFieldsFromFlow(flowTrainingData);
    const preferenceField = mandatoryFields?.find(f => f.field === 'preference');
    const preferenceOptionsStr = preferenceField
        ? JSON.stringify(preferenceField.preferenceOptions || [], null, 2)
        : '[]';

    const flowData = structuredFlow?.map(section => `- ${section.section} (Node ID: ${section.nodeId || 'N/A'}):\n  ${section.instructions.map(i => `  - ${i}`).join('\n')}`)
        .join('\n');
    console.log(flowData,'flowData')
    const prompt = `
        **Training Data**
        Key Flow Instructions:
        ${flowData}

        **Conversation History**
        ${conversationHistory.join('\n')}

        **New Consultant Message**
        ${ConsultantMessage}

        **System Time**
        ${currentDate} (${currentYear}) - ${currentTime}

        📌 **Instruction: Collect Required Fields and Prepare Structured Response**
        🎯 **Required Fields to Collect**
        ${mandatoryFields.length > 0
            ? mandatoryFields.map(field => `- ${field.field || field}`).join('\n')
            : '✅ No mandatory fields required.'
        }

        ${preferenceField ? `
            🎯 **Preference Options**
            Use the following list to match consultant-selected preference option IDs:
            ${preferenceOptionsStr}
        ` : ''}
        
        - **Mandatory: Collect all consultent selected Preference Options(id) from conversation history, create an array and pass as value of Preference [Eg: preference:[op1,op2,op3, etc..]]**
        - **Mandatory: Build a JavaScript object where each required field becomes a key, and the corresponding user input becomes its value, ✅ This object must be included in the conversation history together with the final message of AI in Json format.**
    `.trim();

    return prompt;
};

module.exports = generateDynamicPrompt;
















  

















  
