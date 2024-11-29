const axios = require('axios');
const fs = require("fs");
const path = require('path');
const { Readable } = require("stream");
const { whatsappPhoneId, apiToken, webToken , baseUrl} = require('../../config/whatsappConfig');
const handleConversation = require('../../services/whatsappService/whatsappService'); 
const {processAudioWithAzureSTT, playTextToSpeech}  = require('../../ai/voiceAssistant/voiceAssistant');

const voicePath = path.resolve(__dirname, '../.././output.wav');
const voiceStream = fs.createReadStream(voicePath);

console.log(voicePath,'hhhhhhhhhhhhhhhhhhhhhhhhhhh')
audioUrl='https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=3792101994337493&ext=1732888380&hash=ATvjsqSRVI3HQL5NS5_rzSKqEEp7JbleK9v2DCSvFKgbuA';




const processAudioFromUrl = async (url, token,voiceStream) => {
    try {
        // Fetch the audio file as a stream from the URL with the access token
        const response = await axios({
            method: 'get',
            url: url,
            headers: {
                'Authorization': `Bearer ${token}`  // Pass the token in the Authorization header
            },
            responseType: 'stream', // Get the response as a stream
        });

        const filePath = path.join(__dirname, 'downloaded_audio.wav');  // Specify the file path
        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);

        writer.on('finish', () => {
            console.log('Audio file downloaded successfully!');
        });

        writer.on('error', (err) => {
            console.error('Error saving audio file:', err);
        });


       // const  data = fs.createReadStream(response.data);
        // Pass the audio stream to your STT function
       // processAudioWithAzureSTT(response.data); // response.data is the audio stream

    } catch (error) {
        console.log('error')
        //console.error('Error downloading or processing audio:', error);
    }
};

processAudioFromUrl(audioUrl, apiToken,voiceStream);




const verifyWebhook = (req, res) => {
    const challenge = req.query['hub.challenge'];
    const VERIFY_TOKEN = webToken;
    const token = req.query['hub.verify_token'];
    if (token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Error, invalid token');
    }
};

const handleIncomingMessage = async (req, res) => {
    try {
        const message = req?.body?.entry?.[0]?.changes?.[0]?.value;

        if (!message?.messages?.[0]) return;

        const whatsapData = message?.messages?.[0];
        const { from: userPhone, type } = whatsapData;
        let { userData , aiResponce, audioMessage } = {};

        switch (type) {
            case 'text':
                userData = {
                    userPhone,
                    userInput:whatsapData?.text?.body,
                }
                aiResponce = await handleConversation(userData || null);
                break;
            case 'audio':
                userData = whatsapData?.audio?.id;
                audioMessage = await processAudioMessage(userData || null)
                aiResponce = audioMessage
                break;
            default:
                return res.status(400).send('Unsupported message type.');
        }

        await sendMessageToWhatsApp(userPhone, aiResponce);
        res.status(200).send('Message received');
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Internal Server Error');
    } 
};

const sendMessageToWhatsApp = async (phoneNumber, message) => {
    try {
        data = JSON.stringify({
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'text',
            text:{
                body: message,
            }
        })

        const config = {
            headers: {
                Authorization: `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
        };
        const response = await axios.post(`${baseUrl}/${whatsappPhoneId}/messages`,data, config);

    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
    }
};

const getMediaData = async (audiId) => {
    console.log(audiId,'mediaId')
    try {
        const url = `${baseUrl}/${audiId}`;
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${apiToken}`,
            },
            //responseType: 'stream',
        });

        console.log( response?.data.url)
        return response?.data;
       
    } catch (error) {
        console.error('Error retrieving media file URL:', error.message);
        throw new Error('Failed to get media file URL.');
    }
};

const processAudioMessage = async (audiId) => {
    try {
        const audioFile = await getMediaData(audiId);

        function handleTextConversion(error, text) {
            if (error) {
                console.error("Error converting speech to text:", error);
            } else {
                console.log("Recognized Text:", text);
                return text;
            }
        }
        //playTextToSpeech('halo i hop you are doin well i love you umma umma ')
        //console.log(media,'mediamediamediamediamediamediamediamediamediamedia')
        //processAudioWithAzureSTT(voiceStream);

    } catch (error) {
        console.error('Error processing audio message:', error.message);
    }
};

module.exports = {
    verifyWebhook,
    handleIncomingMessage,
};



















// const axios = require('axios');
// const fs = require('fs');
// const FormData = require('form-data');
// const { whatsappAPIUrl, apiToken, webToken } = require('../../config/whatsappConfig');
// const handleConversation = require('../../services/whatsappService/whatsappService');
// const { convertVoiceToText, convertTextToVoice } = require('../../ai/voiceAssistant/voiceAssistant');

// const verifyWebhook = (req, res) => {
//     const challenge = req.query['hub.challenge'];
//     const token = req.query['hub.verify_token'];
//     if (token === webToken) {
//         res.status(200).send(challenge);
//     } else {
//         res.status(403).send('Error, invalid token');
//     }
// };

// const sendTypingIndicator = async (phoneNumber, isTyping) => {
//     try {
//         const data = {
//             messaging_product: 'whatsapp',
//             to: phoneNumber,
//             type: isTyping ? 'typing_on' : 'typing_off',
//         };

//         const config = {
//             headers: {
//                 Authorization: `Bearer ${apiToken}`,
//                 'Content-Type': 'application/json',
//             },
//         };

//         await axios.post(`${whatsappAPIUrl}/messages`, data, config);
//     } catch (error) {
//         console.error('Error sending typing indicator:', error.message);
//     }
// };

// const sendMessageToWhatsApp = async (phoneNumber, message) => {
//     try {
//         const data = {
//             messaging_product: 'whatsapp',
//             to: phoneNumber,
//             type: 'text',
//             text: { body: message },
//         };

//         const config = {
//             headers: {
//                 Authorization: `Bearer ${apiToken}`,
//                 'Content-Type': 'application/json',
//             },
//         };

//         await axios.post(`${whatsappAPIUrl}/messages`, data, config);
//     } catch (error) {
//         console.error('Error sending WhatsApp message:', error.message);
//     }
// };

// const sendAudioToWhatsApp = async (phoneNumber, filePath) => {
//     try {
//         const formData = new FormData();
//         formData.append('file', fs.createReadStream(filePath));

//         const config = {
//             headers: {
//                 Authorization: `Bearer ${apiToken}`,
//                 ...formData.getHeaders(),
//             },
//         };

//         const mediaResponse = await axios.post(`${whatsappAPIUrl}/media`, formData, config);

//         const mediaId = mediaResponse.data.id;
//         const data = {
//             messaging_product: 'whatsapp',
//             to: phoneNumber,
//             type: 'audio',
//             audio: { id: mediaId },
//         };

//         await axios.post(`${whatsappAPIUrl}/messages`, data, config);
//     } catch (error) {
//         console.error('Error sending WhatsApp audio message:', error.message);
//     } finally {
//         if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Clean up
//     }
// };

// const handleIncomingMessage = async (req, res) => {
//     try {
//         const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
//         if (!message) return res.status(400).send('Invalid or missing message.');

//         const { from: userPhone, text, type, voice } = message;
//         let userInput = text?.body || '';

//         if (type === 'voice') {
//             const voiceUrl = voice?.media_url;
//             if (!voiceUrl) return res.status(400).send('Invalid voice message URL.');
//             userInput = await convertVoiceToText(voiceUrl);
//         }

//         await sendTypingIndicator(userPhone, true);
//         userData= {
//             userInput,
//             userPhone,
//         }

//         const aiResponse = await handleConversation(userData);

//         if (type === 'voice') {
//             const audioPath = './temp/responseAudio.wav';
//             await convertTextToVoice(aiResponse, audioPath);
//             await sendAudioToWhatsApp(userPhone, audioPath);
//         } else {
//             await sendMessageToWhatsApp(userPhone, aiResponse);
//         }

//         await sendTypingIndicator(userPhone, false);

//         res.status(200).send('Message processed successfully.');
//     } catch (error) {
//         console.error('Error handling incoming message:', error.message);
//         res.status(500).send('Internal Server Error');
//     }
// };

// module.exports = {
//     verifyWebhook,
//     handleIncomingMessage,
// };



