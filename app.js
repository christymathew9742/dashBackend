const express = require('express');
const productRoutes = require('./routes/productRoutes'); 
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middlewares/errorHandler');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

connectDB();

app.use(express.json());
app.use('/api/auth', authRoutes);  
app.use('/api/user', userRoutes);  
app.use('/api/products', productRoutes);
app.use(errorHandler);

module.exports = app; 
