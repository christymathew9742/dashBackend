const mongoose = require('mongoose');

// DepartmentModal Schema
const DepartmentSchema = new mongoose.Schema({
    doctor: { type: String, required: true },
    department: { type: String, required: true },
    date: { type: String, required: true },
    totalToken: { type: Number, required: true  },
    currentToken: { type: Number, required: true },
    tokenStatus: { type: Number, required: true },
    drStatus: { type: Boolean,required: true},
  }, { timestamps: true });
  
module.exports = {
  DepartmentModal: mongoose.model('DepartmentModal', DepartmentSchema)
};

