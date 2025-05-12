const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  bandwidth: Number,
  latency: Number,
  packet_loss: Number,
  resolution: String,
  bitrate: Number,
  prediction: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Log', logSchema);