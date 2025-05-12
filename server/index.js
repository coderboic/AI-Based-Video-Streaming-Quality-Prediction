const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const Log = require('./models/Log');

const app = express();
app.use(cors());
app.use(express.json());

// Get the absolute path to the ml_model directory
const mlModelPath = path.resolve(__dirname, '..', 'ml_model');

mongoose.connect('mongodb://localhost:27017/video_quality', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

app.post('/predict', async (req, res) => {
  try {
    const { bandwidth, latency, packet_loss, resolution, bitrate } = req.body;

    console.log(`Received prediction request with parameters: 
      bandwidth=${bandwidth}, 
      latency=${latency}, 
      packet_loss=${packet_loss}, 
      resolution=${resolution}, 
      bitrate=${bitrate}`);

    // Use the absolute path to the Python script
    const pythonScriptPath = path.join(mlModelPath, 'predict.py');
    
    const python = spawn('python3', [
      pythonScriptPath, 
      bandwidth, 
      latency, 
      packet_loss, 
      resolution, 
      bitrate
    ]);

    let dataString = '';
    let errorString = '';
    
    python.stdout.on('data', (data) => {
      dataString += data.toString();
      console.log(`Python output: ${data}`);
    });

    python.stderr.on('data', (data) => {
      errorString += data.toString();
      // Only log actual errors (those starting with "ERROR:")
      if (data.toString().includes("ERROR:")) {
        console.error(`Python error: ${data}`);
      }
    });

    python.on('close', async (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        return res.status(500).json({ 
          error: 'Error processing prediction',
          details: errorString
        });
      }

      const prediction = dataString.trim();
      console.log(`Prediction result: ${prediction}`);
      
      try {
        await Log.create({ 
          bandwidth: parseFloat(bandwidth), 
          latency: parseFloat(latency), 
          packet_loss: parseFloat(packet_loss), 
          resolution, 
          bitrate: parseFloat(bitrate), 
          prediction,
          timestamp: new Date()
        });
        
        res.json({ 
          prediction,
          quality: getQualityLabel(parseFloat(prediction))
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        res.status(500).json({ error: 'Error saving to database', prediction });
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to convert prediction score to quality label
function getQualityLabel(score) {
  if (score >= 4.5) return 'Excellent';
  if (score >= 3.5) return 'Good';
  if (score >= 2.5) return 'Fair';
  if (score >= 1.5) return 'Poor';
  return 'Bad';
}

app.get('/logs', async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Error fetching logs' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));