const {DepartmentModal} = require('../../models/departmentModel/departmentModel');
const { errorResponse } = require('../../utils/errorResponse');

// Creating a new DepartmentModal
const createDepartmentResponse = async (departmentData) => {
    console.log(departmentData,'dpdataaaa')
    try {
        const departmentdb = await DepartmentModal.find();
        console.log(departmentdb,'department collection')

        const department = new DepartmentModal(departmentData);
        if (!department) {
            throw errorResponse('Department not found', 404);
        }
        return await department.save();
    } catch (error) {
        throw new Error('Error creating product');
    }
};

module.exports = {
    createDepartmentResponse,
};