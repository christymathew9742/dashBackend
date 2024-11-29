const trainingData = require('./trainData')

const generateDynamicPrompt = async (conversationHistory, ConsultantMessage, doctorData,regularConseltentData) => {

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

    const RegularConseltentTable = regularConseltentData &&  generateRegularConseltentTable(regularConseltentData) || ''

    const prompt = `
        **TrainingData**: **Should analyse DoctorAvilabilityData**:
        ${trainingData}

        **Key Features**:
            - Persistent Memory: Retain and dynamically update user-provided data throughout the conversation for consistent and efficient interaction.
            - Mandatory Consultant Type Check:Always confirm whether the user is a Regular Consultant or a New Consultant at the beginning of the interaction without fail. Tailor subsequent questions based on the consultant type.

            - Check if the consultant is regular: Proceed only if the consultant is marked as regular.
            - Request the contact number: If the consultant is regular, ask for their contact number.
            - Check RegularConseltentTable: Look up the consultant's data in the table.
            - Return the relevant details as specified: If the consultant's data is found, confirm name, department,doctor,date, next move on  to Doctor Availability step; if not, inform them and redirect.
        

            - Short and Meaningful Steps:Keep the process concise by asking only essential questions. Quickly finalize the booking once all required information is collected and confirmed.
            - Provide clear guidance: Recommend relevant departments based on consultants' symptoms to ensure accurate guidance and clarity.


            - Required Data Validation: Ensure mandatory details (e.g., name, aige, department) are provided and validated. For regular consultants, verify key details and proceed immediately to conclude. 


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

        Should respond politely and naturally, focusing on the next necessary step. Follow the conversation steps in order, based on the numbers. ensure the Consultant type withou fail. Always ensure clarity, conciseness, and user convenience. If appointments or any other related details are not mentioned in the conversation history, should provide the available details or onsite visit, based on the situvation. Ensure that all table data is analyzed before proceeding anthing, without fail. Correct only the relevant part of the conversation without revising everything. Confirm only the specific date or day if appointments are available today, tomorrow, or on a specific date. Avoid repeating questions and ensure the response is relevant to the user's query. Provide dates in the format "month, day". Verify details before proceeding with any counseling information. Do not describe your internal steps or decisions during the conversation. Ensure an array object is created in conversationHistory after confirming the token number. The object must follow the format exactly as a string(Only use  JSON format not in JavaScript format, should not be assigned to a variable): {dId: consultingDoctorID, name: consultantName, age: consultantAge, doctor: consultingDoctor, date: consultingDate, token: consultantToken, department: consultantDepartment}. Implement this without fail and avoid using functions like push(). 
    `;

    return prompt;
};

module.exports = generateDynamicPrompt;