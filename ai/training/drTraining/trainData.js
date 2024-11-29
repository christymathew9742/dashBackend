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
        conclusion: [
            "Confirming your details: Consultant name [RegularConseltentName], department [RegularConseltentDepartment], doctor name [RegularConseltentDoctor], date [RegularConseltentDate]. Let’s now proceed to check the doctor’s availability.",
        ],
    },
    {
        step: 4,
        action: "New Consultant",
        condition: "isNew",
        dataRequired: ["Name", "Age", "Department"],
        response: [
            "Since this is your first consultation, could you please share your name, age and the department you wish to consult?",
        ],
        followUp: {
            missingFields: [
                "I noticed I’m missing your name. Could you provide it?",
                "Could you share your age so I can complete the details?",
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

module.exports = trainingData;