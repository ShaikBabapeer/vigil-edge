const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const MONGO_URI = "mongodb+srv://babapeer63012_db_user:Babapeer9@babapg.zj6gpge.mongodb.net/?retryWrites=true&w=majority&appName=babapg";

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Atlas Connected"))
  .catch(err => console.log("DB Error:", err));

const AlertSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    objectDetected: String, 
    image: String
});

const Alert = mongoose.model('Alert', AlertSchema);

app.get('/', (req, res) => {
    res.send("Vigil-Edge Backend is Live and Running!");
});

app.post('/api/alert', async (req, res) => {
    try {
        const { objectDetected, image } = req.body;
        const newAlert = new Alert({ objectDetected, image });
        await newAlert.save();
        res.status(200).json({ message: "Alert Logged" });
    } catch (error) {
        res.status(500).send("Server Error");
    }
});

app.get('/api/alerts', async (req, res) => {
    try {
        const alerts = await Alert.find().sort({ timestamp: -1 });
        res.json(alerts);
    } catch (error) {
        res.status(500).send("Error fetching alerts");
    }
});

if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;