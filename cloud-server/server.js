// cloud-server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware (Allows the Python script to talk to this server)
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Allow large images

const MONGO_URI = "mongodb+srv://babapeer63012_db_user:YOUR_PASSWORD@babapg.zj6gpge.mongodb.net/?appName=babapg";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas Connected"))
  .catch(err => console.log("❌ DB Error:", err));

// 2. Define the Alert Schema
const AlertSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    objectDetected: String, 
    image: String // Stores the photo as a text string
});

const Alert = mongoose.model('Alert', AlertSchema);

// 3. API Route to Receive Alerts (Edge -> Cloud)
app.post('/api/alert', async (req, res) => {
    try {
        const { objectDetected, image } = req.body;
        console.log(`[CLOUD] 🚨 Alert Received: ${objectDetected} detected!`);

        const newAlert = new Alert({ objectDetected, image });
        await newAlert.save();

        res.status(200).json({ message: "Alert Logged" });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// 4. API Route to Show Alerts (Cloud -> Dashboard)
app.get('/api/alerts', async (req, res) => {
    try {
        const alerts = await Alert.find().sort({ timestamp: -1 });
        res.json(alerts);
    } catch (error) {
        res.status(500).send("Error fetching alerts");
    }
});

// Start the Server
app.listen(5000, () => {
    console.log("🚀 Cloud Server running on http://localhost:5000");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ready on port ${PORT}`));

module.exports = app;