const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dtrRoutes = require('./routes/dtrRoutes');
const userRoutes = require('./routes/userRoutes');

require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dtr', dtrRoutes); 
app.use('/api/users', userRoutes);

// Function to create a default admin
async function createDefaultAdmin() {
    try {
        const admin = await User.findOne({ username: "Rhu admin" });
        if (!admin) {
            const hashedPassword = await bcrypt.hash('Rhu321', 10);
            await User.create({
                username: "Rhu admin",
                email: "admin@rhu.com", // <--- Add a dummy email here
                password: hashedPassword,
                role: "admin"
            });
            console.log('Default admin created');
        } else {
            console.log('Default admin already exists');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(5000, () => console.log('Server running on port 5000'));
        createDefaultAdmin(); // Call after successful DB connection
    })
    .catch(err => console.log(err));
