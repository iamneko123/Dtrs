const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get all users
router.get('/', async (_req, res) => {  // Changed req to _req to indicate it's unused
  try {
    const users = await User.find({}, '-password'); // Exclude passwords
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add New Employee
router.post('/add', async (req, res) => {
  try {
    const { username, role, password } = req.body;

    // Check if username exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const newEmployee = new User({
      username,
      role: role || 'employee', // Default to 'employee' if not specified
      password: bcrypt.hashSync(password, 10),
    });

    await newEmployee.save();
    res.status(201).json({ 
      message: 'Employee added successfully', 
      employee: {
        _id: newEmployee._id,
        username: newEmployee.username,
        role: newEmployee.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding employee' });
  }
});

// Edit Employee
router.put('/edit/:id', async (req, res) => {
  try {
    const { username, role, password } = req.body;
    const updateData = { username, role };

    if (password) {
      updateData.password = bcrypt.hashSync(password, 10);
    }

    const updatedEmployee = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password'); // Exclude password from the returned data

    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ 
      message: 'Employee updated successfully', 
      employee: updatedEmployee 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating employee' });
  }
});

// Delete Employee
router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

module.exports = router;