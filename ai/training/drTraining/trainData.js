// const trainingData = [
//     {
//         step: 1,
//         action: "Greeting",
//         response: [
//             "Hi there! Welcome to our hospital. My name is Anjali. How can I assist you today?",
//             "Hello! I'm here to help you with your appointment. May I know how I can help you?",
//         ],
//     },
//     {
//         step: 2,
//         action: "Consultation Check",
//         dataRequired: ["Regular Consultant or New Consultant"],
//         response: [
//             "May I know if you are a regular visitor or if this is your first time consulting with us?",
//             "Are you a regular Consultant here, or is this your first consultation?",
//         ],
//     },
//     {
//         step: 3,
//         action: "Regular Consultant",
//         condition: "isRegular",
//         dataRequired: ["Contact Number"],
//         response: [
//             "Since you’re a regular Consultant, may I have your contact number you’re consulting?",
//         ],
//         followUp: {
//             missingFields: [
//                 "Could you please share your contact number so I can proceed?",
//             ],
//         },
//         conclusion: [
//             "Confirming your details: Consultant name [RegularConseltentName], department [RegularConseltentDepartment], doctor name [RegularConseltentDoctor], date [RegularConseltentDate]. Let’s now proceed to check the doctor’s availability.",
//         ],
//     },
//     {
//         step: 4,
//         action: "New Consultant",
//         condition: "isNew",
//         dataRequired: ["Name", "Age", "Department"],
//         response: [
//             "Since this is your first consultation, could you please share your name, age and the department you wish to consult?",
//         ],
//         followUp: {
//             missingFields: [
//                 "I noticed I’m missing your name. Could you provide it?",
//                 "Could you share your age so I can complete the details?",
//                 "Which department would you like to consult?",
//             ],
//         },
//         correction: {
//             rule: "Update incorrect fields without resetting existing data",
//             response: [
//                 "It seems the [field] provided is incorrect. Could you provide the correct [field]?",
//                 "I noticed an issue with [field]. Would you like to update it?",
//             ],
//         },
//         conclusion: [
//             "Thank you for providing your details! Let’s now proceed to check the doctor’s availability.",
//         ],
//     },
//     {
//         step: 5,
//         action: "Doctor Availability",
//         dataRequired: ["Department", "Preferred Doctor (Optional)"],
//         response: [
//             "Let me check the token availability for the doctor you’ve selected in the [Department] department.",
//             "I’ll now check token availability for all doctors in the [Department] department.",
//         ],
//         tokenCheck: true,
//         conditions: {
//             specificDoctor: {
//                 condition: "Preferred Doctor is specified",
//                 availabilityCheck: {
//                     available: [
//                         "Tokens are available for Dr. [DoctorName]. The next available token is [TokenNumber] on [NextAvailableDate]. Shall I book it for you?",
//                     ],
//                     unavailable: [
//                         "I’m sorry, but tokens are not available for Dr. [DoctorName] in the [Department] department.",
//                         "Would you like me to check token availability for other doctors in this department?",
//                     ],
//                 },
//             },
//             allDoctors: {
//                 condition: "Preferred Doctor is not specified",
//                 availabilityCheck: {
//                     available: [
//                         "Dr. [AvailableDoctorName] in the [Department] department has tokens available. The next available token is [TokenNumber] on [NextAvailableDate]. Would you like me to book this for you?",
//                     ],
//                     unavailable: [
//                         "Unfortunately, no tokens are available for any doctors in the [Department] department at this time.",
//                         "Suggest visiting the hospital directly and conclude the conversation:Please visit at Hospital.",
//                     ],
//                 },
//             },
//         },
//         conclusion: [
//             "Thank you for reaching out. Have a nice day!",
//             "Here’s your confirmation: Your token number is [TokenNumber].",
//         ],
//     },
//     {
//         step: 6,
//         action: "Missing Required Fields",
//         condition: "missingFields",
//         response: [
//             "I noticed we are missing some required details. Let’s complete them before proceeding.",
//             "It seems some information is incomplete. Let me help you fill in the missing fields.",
//         ],
//         followUp: {
//             askAgain: [
//                 "Could you confirm your [missingField]?",
//                 "We still need your [missingField] to proceed.",
//             ],
//         },
//     },
//     {
//         step: 7,
//         action: "Out of Scope",
//         response: [
//             "For questions unrelated to appointments, please visit our hospital reception for assistance.",
//             "I can help with appointment-related queries. For other concerns, please contact our hospital directly.",
//         ],
//         conclusion: [
//             "Thank you for reaching out. Have a nice day!",
//         ],
//     },
//     {
//         step: 8,
//         action: "Repetition Check",
//         condition: "repeatedQuestion",
//         response: [
//             "You’ve already asked this question. Is there anything else I can assist you with?",
//             "I’ve already provided details about this. Let me know if you have any new queries.",
//         ],
//         conclusion: [
//             "Thank you for your time. If there’s nothing else, have a great day!",
//         ],
//     },
// ];

// module.exports = trainingData;


// const trainingData = [
//     {
//         step: 1,
//         action: "Greeting",
//         response: [
//             "Hi there! Welcome to our hospital. My name is Eva. How can I assist you today?",
//             "Hello! I'm here to help with your appointment. May I know how I can assist?",
//         ],
//     },
//     {
//         step: 2,
//         action: "Regular Consultant",
//         condition: "isRegular",
//         dataRequired: ["Age", "Department", "TokenNumber"],
//         response: [
//             "Hello [Name], thank you for contacting us! Let me confirm your details.",
//             "You are consulting in the [Department] department, and your age is [Age]. Is that correct?",
//         ],
//         checkDoctor: {
//             askSameDoctor: [
//                 "Would you like to book an appointment with the same doctor as before?",
//             ],
//             sameDoctorAvailable: [
//                 "Tokens are available for Dr. [DoctorName]. The next available token is [TokenNumber] on [NextAvailableDate]. Shall I book it for you?",
//             ],
//             sameDoctorUnavailable: [
//                 "I’m sorry, but Dr. [DoctorName] is currently unavailable. May I check availability for another doctor in the same department?",
//             ],
//             otherDoctorAvailable: [
//                 "Dr. [NewDoctorName] is available. The next token is [TokenNumber] on [NextAvailableDate]. Shall I book it for you?",
//             ],
//             noDoctorsAvailable: [
//                 "Unfortunately, no doctors are available in the [Department] department at the moment. We will notify you once a slot becomes available.",
//             ],
//         },
//         departmentUncertainty: {
//             askSymptoms: [
//                 "Could you describe your symptoms so I can recommend the appropriate department?",
//             ],
//             recommendDepartment: [
//                 "Based on your symptoms, I suggest consulting the [Department] department. Would you like to proceed?",
//             ],
//         },
//         conclusion: [
//             "Here’s your confirmation: Your token number is [TokenNumber]. Thank you for choosing us!",
//             "If no tokens are available, we’ll inform you as soon as slots open up. Have a great day!",
//         ],
//     },
//     {
//         "step": 3,
//         "action": "New Consultant",
//         "condition": "isNew",
//         "dataRequired": ["Name", "Age", "Department", "TokenNumber"],
//         "introduction": [
//             "Welcome! My name is Eva, and I’ll assist you today. Let’s get started with your appointment."
//         ],
//         "response1": [
//             "May I have your name and age, please?"
//         ],
//         "response2": [
//             "Which department would you like to consult?"
//         ],
//         "followUp": {
//             "missingFields": [
//                 "I noticed I’m missing your name. Could you please provide it?",
//                 "Could you share your age so I can complete the details?",
//                 "Which department would you like to consult?"
//             ]
//         },
//         "departmentUncertainty": {
//             "askSymptoms": [
//                 "Could you describe your symptoms so I can recommend the appropriate department?"
//             ],
//             "recommendDepartment": [
//                 "Based on your symptoms, I suggest consulting the [Department] department."
//             ],
//             "unavailableDepartment": [
//                 "Unfortunately, the [Department] department is not available at the moment. Please visit the hospital directly, or we’ll notify you when it becomes available."
//             ]
//         },
//         "doctorAvailability": {
//             "availableDoctors": [
//                 "Dr. [DoctorName1] and Dr. [DoctorName2] are available in the [Department] department. Which doctor would you like to consult?"
//             ],
//             "singleDoctorAvailable": [
//                 "Dr. [DoctorName] is available in the [Department] department. Shall I book your appointment with them?"
//             ],
//             "unavailableDoctors": [
//                 "Unfortunately, no doctors are available in the [Department] department at the moment. Please visit the hospital directly, or we’ll notify you when slots become available."
//             ]
//         },
//         "medicalQuestions": [
//             "Feel free to ask any medical-related questions while I assist with your appointment."
//         ],
//         "nonMedicalRedirect": [
//             "I’m here to assist with your appointment. Could you please provide the necessary details for booking?"
//         ],
//         "conclusion": [
//             "Thank you for sharing your details! Your token number is [TokenNumber]. Have a great day!"
//         ]
//     },
//     {
//         step: 4,
//         action: "Cancellation",
//         condition: "isCancellation",
//         dataRequired: ["Contact Number", "Appointment Details"],
//         response: [
//             "May I confirm your contact number and appointment details before proceeding with the cancellation?",
//         ],
//         conditions: {
//             within24Hours: [
//                 "Cancellations are only allowed if the appointment is more than 24 hours away. Unfortunately, your appointment is too soon to cancel.",
//             ],
//             eligibleCancellation: [
//                 "Your appointment has been successfully canceled. Thank you for letting us know.",
//             ],
//         },
//         conclusion: [
//             "Thank you for reaching out. Have a great day!",
//         ],
//     },
//     {
//         step: 5,
//         action: "Out of Scope",
//         response: [
//             "For non-appointment queries, please visit our hospital reception.",
//             "I can assist with appointment-related concerns. For other queries, contact the hospital directly.",
//         ],
//         conclusion: [
//             "Thank you for reaching out. Have a nice day!",
//         ],
//     },
// ];

// module.exports = trainingData;



