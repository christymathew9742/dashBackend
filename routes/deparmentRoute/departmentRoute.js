const express = require('express');
const {createDepartmentData,} = require('../../controllers/department/departmentController');
const {validatedepartment, Validation} = require('../../middlewares/departmentMiddleware/departmentMiddleware')
const authMiddleware = require('../../middlewares/authMiddleware');
const router = express.Router();

router.post('/',authMiddleware,validatedepartment,Validation,createDepartmentData);

module.exports = router;