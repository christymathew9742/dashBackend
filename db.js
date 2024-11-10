// const { MongoClient } = require('mongodb');
// let dbConnection;

// const uri = 'mongodb://0.0.0.0:27017/Eshoppy';

// module.exports = {
//     connectToDb: (callback) => {
//         MongoClient.connect(uri)
//             .then((client) => {
//                 dbConnection = client.db();
//                 callback(null); 
//             })
//             .catch(err => {
//                 console.error('Failed to connect to MongoDB:', err);
//                 callback(err);
//             });
//     },
//     getDb: () => dbConnection,
// };

