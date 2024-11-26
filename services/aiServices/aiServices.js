const {AiModal} = require('../../models/gemiAiModel/gemiAiModel');
const {DepartmentModal} = require('../../models/departmentModel/departmentModel');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const vm = require('vm');
const axios = require('axios');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; 
const GREETING_RESPONSES = {
    morning: "Good morning! Welcome to our hospital. How can we assist you today?",
    afternoon: "Good afternoon! Welcome to our hospital. How can we assist you today?",
    evening: "Good evening! Welcome to our hospital. How can we assist you today?",
    night: "Good night! Welcome to our hospital. How can we assist you tonight?"
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let Token = {
    Count: 0,
};
const generateAIResponse = async (prompt) => {
    const genAI = new GoogleGenerativeAI(process.env.API_GEM);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let retries = 0;
    let result;

    while (retries < MAX_RETRIES) {
        try {
            result = await model.generateContent(prompt);
            if (result) {
                return result.response.text();
            }
        } catch (error) {
            if (error.status === 503 && retries < MAX_RETRIES - 1) {
                console.warn(`Retry ${retries + 1}: Model overloaded. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
                await delay(RETRY_DELAY_MS);
                retries++;
            } else {
                console.log("Failed to complete the request after max retries.", error.message);
            }
        }
    }
    throw new Error('AI model failed after maximum retries.');
};


let conversationHistory = []
let consultantDetails = {};
const trainingData = [
    {
        step: 1,
        action: "Greeting",
        response: [
            "Hi there! Welcome to our hospital. My name is Anjali. How can I assist you today?",
            "Hello! I'm here to help you with your appointment. May I know how I can help you?",
        ],
    },
    {
        step: 2,
        action: "Consultation Check",
        dataRequired: ["Regular Consultant or New Consultant"],
        response: [
            "May I know if you are a regular visitor or if this is your first time consulting with us?",
            "Are you a regular Consultant here, or is this your first consultation?",
        ],
    },
    {
        step: 3,
        action: "Regular Consultant",
        condition: "isRegular",
        dataRequired: ["Contact Number"],
        response: [
            "Since you’re a regular Consultant, may I have your contact number you’re consulting?",
        ],
        followUp: {
            missingFields: [
                "Could you please share your contact number so I can proceed?",
            ],
        },
        pattern: /\+?[0-9]{6,}/g,
        validation: {
            field: "Contact Number",
            rules: ["Must be a valid Current country number"],
            success: [
                "Thank you! Your contact number is valid. Let’s proceed.",
                {
                    action: "Store Regular Consultant Contact",
                    operation: (contactNumber) => {
                        const regularConsultantContacts = [];
                        regularConsultantContacts.push(contactNumber);
                        return regularConsultantContacts;
                    },
                },
            ],
            failure: "The contact number seems invalid. Could you confirm it again?",
        },
        conclusion: [
            "Confirming your details: Consultant name [RegularConseltentName], department [RegularConseltentDepartment], doctor name [RegularConseltentDoctor], date [RegularConseltentDate]. Let’s now proceed to check the doctor’s availability.",
        ],
    },
    {
        step: 4,
        action: "New Consultant",
        condition: "isNew",
        dataRequired: ["Name", "Age", "Contact Number", "Department"],
        response: [
            "Since this is your first consultation, could you please share your name, age, contact number, and the department you wish to consult?",
        ],
        followUp: {
            missingFields: [
                "I noticed I’m missing your name. Could you provide it?",
                "Could you share your age so I can complete the details?",
                "Can you confirm your contact number for accuracy?",
                "Which department would you like to consult?",
            ],
        },
        correction: {
            rule: "Update incorrect fields without resetting existing data",
            response: [
                "It seems the [field] provided is incorrect. Could you provide the correct [field]?",
                "I noticed an issue with [field]. Would you like to update it?",
            ],
        },
        validation: {
            field: "Contact Number",
            rules: ["Must be a valid current country number"],
            success: "Your contact number is valid. Thank you!",
            failure: "The contact number seems incorrect. Could you confirm it again?",
        },
        conclusion: [
            "Thank you for providing your details! Let’s now proceed to check the doctor’s availability.",
        ],
    },
    {
        step: 5,
        action: "Doctor Availability",
        dataRequired: ["Department", "Preferred Doctor (Optional)"],
        response: [
            "Let me check the token availability for the doctor you’ve selected in the [Department] department.",
            "I’ll now check token availability for all doctors in the [Department] department.",
        ],
        tokenCheck: true,
        conditions: {
            specificDoctor: {
                condition: "Preferred Doctor is specified",
                availabilityCheck: {
                    available: [
                        "Tokens are available for Dr. [DoctorName]. The next available token is [TokenNumber] on [NextAvailableDate]. Shall I book it for you?",
                    ],
                    unavailable: [
                        "I’m sorry, but tokens are not available for Dr. [DoctorName] in the [Department] department.",
                        "Would you like me to check token availability for other doctors in this department?",
                    ],
                },
            },
            allDoctors: {
                condition: "Preferred Doctor is not specified",
                availabilityCheck: {
                    available: [
                        "Dr. [AvailableDoctorName] in the [Department] department has tokens available. The next available token is [TokenNumber] on [NextAvailableDate]. Would you like me to book this for you?",
                    ],
                    unavailable: [
                        "Unfortunately, no tokens are available for any doctors in the [Department] department at this time.",
                        "Suggest visiting the hospital directly and conclude the conversation:Please visit at Hospital.",
                    ],
                },
            },
        },
        conclusion: [
            "Thank you for reaching out. Have a nice day!",
            "Here’s your confirmation: Your token number is [TokenNumber].",
        ],
    },
    {
        step: 6,
        action: "Missing Required Fields",
        condition: "missingFields",
        response: [
            "I noticed we are missing some required details. Let’s complete them before proceeding.",
            "It seems some information is incomplete. Let me help you fill in the missing fields.",
        ],
        followUp: {
            askAgain: [
                "Could you confirm your [missingField]?",
                "We still need your [missingField] to proceed.",
            ],
        },
    },
    {
        step: 7,
        action: "Out of Scope",
        response: [
            "For questions unrelated to appointments, please visit our hospital reception for assistance.",
            "I can help with appointment-related queries. For other concerns, please contact our hospital directly.",
        ],
        conclusion: [
            "Thank you for reaching out. Have a nice day!",
        ],
    },
    {
        step: 8,
        action: "Repetition Check",
        condition: "repeatedQuestion",
        response: [
            "You’ve already asked this question. Is there anything else I can assist you with?",
            "I’ve already provided details about this. Let me know if you have any new queries.",
        ],
        conclusion: [
            "Thank you for your time. If there’s nothing else, have a great day!",
        ],
    },
];

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return GREETING_RESPONSES.morning;
    if (hour < 18) return GREETING_RESPONSES.afternoon;
    if (hour < 22) return GREETING_RESPONSES.evening;
    return GREETING_RESPONSES.night;
};

const fetchFromDatabase = (contactNumber) => {
    return database[contactNumber] || { error: "No details found for this contact number." };
};

const generateDynamicPrompt = (conversationHistory, ConsultantMessage, doctorData,regularConseltentData) => {

    if (!doctorData || doctorData.length === 0) {
        doctorData = [
            {   
                dId:null,
                doctor: "No available doctors",
                department: "",
                date: "",
                totalToken: 0,
                currentToken: 0,
                tokenStatus: 0,
                drStatus: false,
            },
        ];
    }
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toLocaleTimeString();
    const doctorDetails = doctorData
        .map((doctor) => {
            const availabilityStatus =
                doctor.tokenStatus >= doctor.totalToken / 2
                    ? "Available"
                    : doctor.tokenStatus === 0
                    ? "Fully Booked"
                    : "Few Slots Left"; 

            const status = doctor.drStatus
                ? `Doctor is available: ${availabilityStatus}`
                : "Doctor is unavailable";

            return `
                <tr>
                    <td>${doctor._id || null}</td>
                    <td>${doctor.doctor || "N/A"}</td>
                    <td>${doctor.department || "N/A"}</td>
                    <td>${doctor.date || "N/A"}</td>
                    <td>${doctor.totalToken || 0}</td>
                    <td>${doctor.currentToken+1 || 0}</td>
                    <td>${availabilityStatus}</td>
                    <td>${status}</td>
                </tr>
            `;
        })
        .join("\n");

    const generateRegularConseltentTable = (data) => {
        if (!data) {
            return `
                <table border="1" cellpadding="10" cellspacing="0">
                <thead>
                    <tr>
                    <th colspan="8">No Regular Conseltent Data Found</th>
                    </tr>
                </thead>
                </table>
            `;
            }
            
            return `
            <table border="1" cellpadding="10" cellspacing="0">
                <thead>
                    <tr>
                        <th>RegularID</th>
                        <th>RegularConseltentName</th>
                        <th>RegularConseltentAige</th>
                        <th>RegularConseltentContact</th>
                        <th>RegularConseltentDoctor</th>
                        <th>RegularConseltentDate</th>
                        <th>RegularConseltentDepartment</th>
                        <th>RegularConseltentUser</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${data.dId || null}</td>
                        <td>${data.name || ''}</td>
                        <td>${data.age  || 0}</td>
                        <td>${data.contact || ''}</td>
                        <td>${data.doctor || ''}</td>
                        <td>${data.date || ''}</td>
                        <td>${data.token || 0}</td>
                        <td>${data.department || ''}</td>
                        <td>${data.user || null}</td>
                    </tr>
                </tbody>
            </table>
        `;
    };

    const RegularConseltentTable = generateRegularConseltentTable(regularConseltentData);

    const prompt = `
        **TrainingData**: **Should analyse DoctorAvilabilityData**:
        ${trainingData}

        **Key Features**:
            - Persistent Memory: Retain and dynamically update user-provided data throughout the conversation for consistent and efficient interaction.
            - Mandatory Consultant Type Check:Always confirm whether the user is a Regular Consultant or a New Consultant at the beginning of the interaction without fail. Tailor subsequent questions based on the consultant type.

            - Check if the consultant is regular: Proceed only if the consultant is marked as regular.
            - Request the contact number: If the consultant is regular, ask for their contact number.
            - Validate the regular contact number: Ensure the contact number matches the expected pattern.
            - Check RegularConseltentTable: Look up the consultant's data in the table.
            - Return the relevant details as specified: If the consultant's data is found, confirm name, department,doctor,date, next move on  to Doctor Availability step; if not, inform them and redirect.
        

            - Short and Meaningful Steps:Keep the process concise by asking only essential questions. Quickly finalize the booking once all required information is collected and confirmed.
            - Provide clear guidance: Recommend relevant departments based on consultants' symptoms to ensure accurate guidance and clarity.


            - Required Data Validation: Ensure mandatory details (e.g., name, aige,contact number, department) are provided and validated. For regular consultants, verify key details and proceed immediately to conclude.


            - Memorize and Accumulate Data: Progressively store user-provided information to avoid repetition. Use this data intelligently to streamline the conversation and reduce redundancy.
            - Clarity in Communication: Use short, simple, and conversational questions to collect information. Ensure users clearly understand what is needed at each step.
            - Handle Repeated and Out-of-Scope Queries: Avoid asking the same question twice by leveraging stored user data. Politely redirect out-of-scope queries to appropriate resources.
            - Polite and Efficient Closure: Maintain a courteous tone throughout the interaction. Conclude quickly once the user agrees to proceed with the booking. Provide the token number.
            
        
        **Include all previous messages for context**:  
        ${conversationHistory.join("\n")}
        

        **NewConsultantMessage The latest consultant message**:
        ${ConsultantMessage}"

  
        **Dynamically calculated CurrentDateAndTime**:
        ${currentDate} (${currentYear}) - ${currentTime} 


        **DoctorAvilabilityData**:
        <table border="1" cellpadding="5">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>DoctorName</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Total Tokens</th>
                    <th>TokenNumber</th>
                    <th>TokenAvailability</th>
                    <th>Doctor availability</th>
                </tr>
            </thead>
            <tbody>
                ${doctorDetails}
            </tbody>
        </table>


        **RegularConseltentTable**:
        ${RegularConseltentTable}
   

        **Availability Legend**:  
        - **Available**: Tokens available for appointments  
        - **Few Slots Left**: Limited availability, hurry up!  
        - **Fully Booked**: No slots available for this doctor.
        - **Doctor is unavailable**: no doctor available for this department.

        Should respond politely and naturally, focusing on the next necessary step. Follow the conversation steps in order, based on the numbers. ensure the Consultant type withou fail. Always ensure clarity, conciseness, and user convenience. If appointments or any other related details are not mentioned in the conversation history, should provide the available details or onsite visit, based on the situvation. Ensure that all table data is analyzed before proceeding anthing, without fail. Correct only the relevant part of the conversation without revising everything. Confirm only the specific date or day if appointments are available today, tomorrow, or on a specific date. Avoid repeating questions and ensure the response is relevant to the user's query. Provide dates in the format "month day," and validate the country code using AI-based knowledge as needed. Verify details before proceeding with any counseling information. Do not describe your internal steps or decisions during the conversation. Ensure an array object is created in conversationHistory after confirming the token number. The object must follow the format exactly as a string(Only use  JSON format not in JavaScript format, should not be assigned to a variable): {dId: consultingDoctorID, name: consultantName, age: consultantAge, contact: consultantContactNumber, doctor: consultingDoctor, date: consultingDate, token: consultantToken, department: consultantDepartment}. Implement this without fail and avoid using functions like push(). 
    `;

    return prompt;
};
``
const updateConversationHistory = (patientMessage, aiCleanedResponse) => {
    conversationHistory.push(`Consultant: ${patientMessage}`);
    conversationHistory.push(`AI: ${aiCleanedResponse}`);
};

const sendInitialResponse = () => {
    const greeting = getGreeting();
    return greeting;
};

const createAIResponse = async (aiData) => {
    try {
        const prompt = aiData.prompt;
        const ConseltentNumber = prompt.match(/\+?[0-9]{6,}/g)?.[0] || [];
        const doctorData = await DepartmentModal.find();
        const regularConseltentData = await AiModal.findOne({ contact: ConseltentNumber });
        const initialResponse = sendInitialResponse();
        const generatedPrompt = generateDynamicPrompt(conversationHistory, prompt, doctorData,regularConseltentData);
        const aiResponse = await generateAIResponse(generatedPrompt);
        const match = aiResponse.match(/{[\s\S]*}/)?.[0] || ''; 
        const jsonRegex =  /```json[\s\S]*?```/; 
        const extractedObjs = match && JSON.parse(match) || {};
        console.log(extractedObjs,'objjjjjjjjjjjj')
        const aiCleanedResponse = jsonRegex ? aiResponse.replace(jsonRegex, '').trim() : aiResponse.replace(match, '').trim() || ''
        const handleAiResponse = async () => {
            try {
                const expectedKeys = ['dId', 'name', 'age', 'contact', 'doctor', 'date', 'token', 'department'];
                const isAllKeys = expectedKeys.every((key) => Object.hasOwn(extractedObjs, key) && extractedObjs[key]);
                updateConversationHistory(prompt, aiCleanedResponse);
                if (isAllKeys) {
                    const newData = {
                        ...aiData,
                        ...extractedObjs,
                    };
                    const saved = await new AiModal(newData).save();
                    if (saved) {
                        const dIdArray = await AiModal.distinct('dId');
                        const batchSize = 50;
                        for (let i = 0; i < dIdArray.length; i += batchSize) {
                            const batch = dIdArray.slice(i, i + batchSize);
                            await Promise.all(
                                batch.map(async (elem) => {
                                    const department = await DepartmentModal.findById(elem);
                                    if (department) {
                                        const currentTokenCount = await AiModal.countDocuments({ dId: elem });
                                        const tokenStatus = department.totalToken - currentTokenCount;
                                        if (department.currentToken !== currentTokenCount) {
                                            const updatedDepartment = await DepartmentModal.findByIdAndUpdate(
                                                elem,
                                                {
                                                    $set: {
                                                        currentToken: currentTokenCount,
                                                        tokenStatus: tokenStatus,
                                                    },
                                                },
                                                { new: true, runValidators: true }
                                            );
                                            if (!updatedDepartment) {
                                                console.log('Department document was updated by someone else');
                                            }
                                        }
                                    }
                                })
                            );
                        }
                    }
                    //conversationHistory.length = 0;
                }
                console.log(conversationHistory);
            } catch (error) {
                console.error('Error in processing:', error);
            }
        };
        setTimeout(handleAiResponse, 500);
        return {
            message: 'AI processing in the background.',
            initialResponse,
        };
    } catch (error) {
        console.error('Error in processing:', error);
    }
};

const getAIResponseStatus = async (id,userId) => {

    try {
        const aiResponseData = await AiModal.findOne({ _id:id, user: userId });
        if (!aiResponseData) {
            throw new Error('Response not found');
        }
        return aiResponseData;
    } catch (error) {
        console.error('Error fetching AI Response status:', error);
        throw new Error(`Failed to retrieve AI response status: ${error}`);
    }
};

module.exports = {
   createAIResponse,
    getAIResponseStatus,
};




