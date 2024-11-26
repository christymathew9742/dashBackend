const express = require('express');
const productRoutes = require('./routes/productRoutes'); 
const authRoutes = require('./routes/authRoutes');
const gemiAiroute = require('./routes/gemiAiroute/gemiAiroute')
const departmentRoute = require('./routes/deparmentRoute/departmentRoute')
const errorHandler = require('./middlewares/errorHandler');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const cors = require('cors');

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST',],
    credentials: true,
}));

connectDB();

app.use(express.json());
app.use('/api/auth', authRoutes);   
app.use('/api/products', productRoutes);
app.use('/api/aimodals', gemiAiroute),
app.use('/api/department', departmentRoute),
app.use(errorHandler);

module.exports = app; 
