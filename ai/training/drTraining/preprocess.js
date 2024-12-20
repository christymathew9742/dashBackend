const trainingData = require('./trainData')

const generateDynamicPrompt = async (
    conversationHistory, 
    ConsultantMessage, 
    doctorData,
    regularConseltentData
) =>{

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
                        <th>RegularConseltentAge</th>
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
                        <td>${data.startTime || ''}</td>
                        <td>${data.endTime || ''}</td>
                        <td>${data.token || 0}</td>
                        <td>${data.department || ''}</td>
                        <td>${data.user || null}</td>
                    </tr>
                </tbody>
            </table>
        `;
    };

    const RegularConseltentTable = regularConseltentData &&  generateRegularConseltentTable(regularConseltentData) || ''

    const prompt = `
        **TrainingData**: **Should analyse DoctorAvilabilityData**:
      


        **Key Features**:
            ${
                regularConseltentData && Object.keys(regularConseltentData).length
                ? `
                    - Greeting and Confirmation:|Start with a personalized greeting (e.g., "Hello [Name]!"). Confirm consultant's name, department, and age.
                    - Same Doctor Preference: Ask if they prefer the same doctor. If the same doctor is available, confirm the token and conclude. If the same doctor is unavailable, 
                    - provide options: Check other doctors in the same department. Inform them if no doctors are available.
                    - Alternative Doctor Recommendation: Suggest a different doctor if requested. Confirm availability and proceed with booking.
                    - Unavailable Scenario: If no tokens or doctors are available, express regret and offer to notify them when a slot opens.
                    - Conclusion: If a token is confirmed, provide details and close the conversation. If no appointment can be made, end by ensuring follow-up notifications.
                    - Efficiency and Clarity: Ensure all responses are concise and direct to streamline the booking process.
                `
                : `
                    - Introduction and Welcome:
                        Start with: "Welcome! My name is Christy Mathew, and I’ll assist you today. Let’s get started with your appointment."
                    - Collect Name and Age:
                        - Ask: "May I have your name and age, please?"
                        - Follow up if missing: 
                            - "I noticed I’m missing your name. Could you please provide it?"
                            - "I noticed I’m missing your Aige. Could you please provide it?"
                    - Ask for Department:
                        - Query: "Which department would you like to consult?"
                        - Follow up if missing: 
                            - "I noticed I’m missing your department. Could you please provide it?"
                        - Uncertain Department:
                            - If unsure, ask for symptoms: "Could you describe your symptoms so I can recommend the appropriate department?"
                            - Suggest department or inform unavailability: "Based on your symptoms, I suggest consulting the [Department] department."
                    - Check Doctor Availability:
                        - Multiple Doctors Available:
                            - Inform available DoctorName: "Dr. [DoctorName] are available in the [Department] department. Which doctor would you like to consult?"
                        - Single Doctor Available:
                            - Inform: "Dr. [DoctorName] is available. Shall I book your appointment with them?"
                        - No Doctors Available:
                            - Notify: "Unfortunately, no doctors are available in the [Department] department. Please visit the hospital directly, or we’ll notify you when slots become available."
                    - Address Medical Questions:
                        - Reassure: "Feel free to ask any medical-related questions while I assist with your appointment."
                        - Redirect non-medical questions: "I’m here to assist with your appointment. Could you please provide the necessary details for booking?"
                    - Token Confirmation and Conclusion:
                        - Confirm token number: "Thank you for sharing your details! Your token number is [TokenNumber]."
                        - Conclude politely: "Have a great day!"
                `
            }
            - Provide the token number immediately after booking.
            
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
                    <th>Start Time</th>
                    <th>End Time</th>
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
       
        ${RegularConseltentTable ?
            `**RegularConseltentTable**: 
            ${RegularConseltentTable}` 
            : ''
        }
   
        **Availability Legend**:  
            - **Available**: Tokens available for appointments  
            - **Few Slots Left**: Limited availability, hurry up!  
            - **Fully Booked**: No slots available for this doctor.
            - **Doctor is unavailable**: no doctor available for this department.

        Should respond politely and naturally, focusing on the next necessary step. Follow the conversation steps in order, based on the numbers. Ensure all responses are concise, with each answer limited to 20 words or fewer, focusing on clarity,conciseness and precision. If appointments or any other related details are not mentioned in the conversation history, should provide the available details or onsite visit, based on the situvation. Ensure that all table data is analyzed before proceeding anthing, without fail. Correct only the relevant part of the conversation without revising everything. Confirm only the specific date or day if appointments are available today, tomorrow, or on a specific date. Avoid repeating questions and ensure the response is relevant to the user's query. Provide dates in the format "month, day". Verify details before proceeding with any counseling information. Do not describe your internal steps or decisions during the conversation. Ensure an array object is created in conversationHistory after confirming the token number. The object must follow the format exactly as a string(Only use  JSON format not in JavaScript format, should not be assigned to a variable): {dId: consultingDoctorID, name: consultantName, age: consultantAge, doctor: consultingDoctor, date: consultingDate, token: consultantToken, department: consultantDepartment}. Implement this without fail and avoid using functions like push(). Analyze the emotions conveyed by images sent by the user and respond appropriately based on the image's meaning and mood. 
    `;

    return prompt;
};

module.exports = generateDynamicPrompt;