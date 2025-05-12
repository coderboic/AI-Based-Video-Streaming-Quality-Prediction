import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function App() {
  const [formData, setFormData] = useState({
    bandwidth: '50',  // Default: 50 Mbps
    latency: '30',    // Default: 30 ms
    packet_loss: '0.5', // Default: 0.5%
    resolution: '1080p', // Default: 1080p
    bitrate: '5000'   // Default: 5000 kbps
  });
  const [prediction, setPrediction] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('predict'); // 'predict' or 'logs'

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Helper function to ensure score is capped at 5
  const capScore = (score) => {
    return Math.min(5, parseFloat(score));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`${API_URL}/predict`, formData);
      // Cap the prediction value at 5
      const capped = { 
        ...res.data, 
        prediction: capScore(res.data.prediction).toString() 
      };
      setPrediction(capped);
      fetchLogs(); // Refresh logs after new prediction
    } catch (err) {
      console.error('Prediction error:', err);
      setError('Failed to get prediction. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/logs`);
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Get a color based on prediction score
  const getQualityColor = (score) => {
    score = capScore(score);
    if (score >= 4.5) return '#28a745'; // Excellent - Green
    if (score >= 3.5) return '#4dabf7'; // Good - Blue
    if (score >= 2.5) return '#ffc107'; // Fair - Yellow
    if (score >= 1.5) return '#fd7e14'; // Poor - Orange
    return '#dc3545'; // Bad - Red
  };

  // Doughnut chart data for quality score visualization
  const chartData = prediction ? {
    datasets: [
      {
        data: [capScore(prediction.prediction), 5 - capScore(prediction.prediction)],
        backgroundColor: [getQualityColor(prediction.prediction), '#e9ecef'],
        borderWidth: 0,
      },
    ],
  } : null;

  const chartOptions = {
    cutout: '70%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1><span className="icon">🎬</span> Video Quality Predictor</h1>
        <p>Predict streaming video quality based on network and video parameters</p>
      </header>

      <main className="main-content">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'predict' ? 'active' : ''}`} 
            onClick={() => setActiveTab('predict')}
          >
            Predict Quality
          </button>
          <button 
            className={`tab ${activeTab === 'logs' ? 'active' : ''}`} 
            onClick={() => setActiveTab('logs')}
          >
            History Logs
          </button>
        </div>

        {activeTab === 'predict' && (
          <div className="content-area">
            <div className="prediction-form-container">
              <h2>Enter Parameters</h2>
              <form onSubmit={handleSubmit} className="prediction-form">
                <div className="form-group">
                  <label htmlFor="bandwidth">
                    Bandwidth (Mbps)
                    <span className="value-display">{formData.bandwidth} Mbps</span>
                  </label>
                  <input 
                    type="range" 
                    id="bandwidth"
                    name="bandwidth" 
                    min="1" 
                    max="100" 
                    value={formData.bandwidth} 
                    onChange={handleChange} 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="latency">
                    Latency (ms)
                    <span className="value-display">{formData.latency} ms</span>
                  </label>
                  <input 
                    type="range" 
                    id="latency"
                    name="latency" 
                    min="5" 
                    max="500" 
                    value={formData.latency} 
                    onChange={handleChange} 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="packet_loss">
                    Packet Loss (%)
                    <span className="value-display">{formData.packet_loss}%</span>
                  </label>
                  <input 
                    type="range" 
                    id="packet_loss"
                    name="packet_loss" 
                    min="0" 
                    max="10" 
                    step="0.1"
                    value={formData.packet_loss} 
                    onChange={handleChange} 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="resolution">Resolution</label>
                  <select 
                    name="resolution" 
                    id="resolution"
                    value={formData.resolution} 
                    onChange={handleChange}
                  >
                    <option value="480p">480p</option>
                    <option value="720p">720p (HD)</option>
                    <option value="1080p">1080p (Full HD)</option>
                    <option value="1440p">1440p (2K)</option>
                    <option value="4K">4K (UHD)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="bitrate">
                    Bitrate (kbps)
                    <span className="value-display">{formData.bitrate} kbps</span>
                  </label>
                  <input 
                    type="range" 
                    id="bitrate"
                    name="bitrate" 
                    min="500" 
                    max="15000" 
                    step="500"
                    value={formData.bitrate} 
                    onChange={handleChange} 
                  />
                </div>

                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Predict Quality'}
                </button>
              </form>
              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="prediction-result-container">
              {prediction ? (
                <div className="prediction-result">
                  <h2>Prediction Result</h2>
                  
                  <div className="quality-display">
                    <div className="chart-container">
                      <Doughnut data={chartData} options={chartOptions} />
                      <div className="chart-center">
                        <div className="score">{capScore(prediction.prediction).toFixed(2)}</div>
                        <div className="max-score">out of 5</div>
                      </div>
                    </div>
                    
                    <div 
                      className="quality-category"
                      style={{ color: getQualityColor(prediction.prediction) }}
                    >
                      <h3>{prediction.quality}</h3>
                      <p>Video Quality</p>
                    </div>
                  </div>
                  
                  <div className="parameters-summary">
                    <h3>Input Parameters</h3>
                    <table>
                      <tbody>
                        <tr>
                          <td>Bandwidth:</td>
                          <td>{formData.bandwidth} Mbps</td>
                        </tr>
                        <tr>
                          <td>Latency:</td>
                          <td>{formData.latency} ms</td>
                        </tr>
                        <tr>
                          <td>Packet Loss:</td>
                          <td>{formData.packet_loss}%</td>
                        </tr>
                        <tr>
                          <td>Resolution:</td>
                          <td>{formData.resolution}</td>
                        </tr>
                        <tr>
                          <td>Bitrate:</td>
                          <td>{formData.bitrate} kbps</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="no-prediction">
                  <p>Enter parameters and click "Predict Quality" to see results</p>
                  <div className="placeholder-image">
                    <img src="https://via.placeholder.com/400x300?text=Video+Quality+Analysis" alt="Placeholder" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="logs-container">
            <h2>Prediction History</h2>
            {logs.length > 0 ? (
              <div className="logs-table-container">
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Bandwidth</th>
                      <th>Latency</th>
                      <th>Packet Loss</th>
                      <th>Resolution</th>
                      <th>Bitrate</th>
                      <th>Prediction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log._id}>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                        <td>{log.bandwidth} Mbps</td>
                        <td>{log.latency} ms</td>
                        <td>{log.packet_loss}%</td>
                        <td>{log.resolution}</td>
                        <td>{log.bitrate} kbps</td>
                        <td>
                          <span 
                            className="prediction-score" 
                            style={{ backgroundColor: getQualityColor(log.prediction) }}
                          >
                            {capScore(log.prediction).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No prediction logs available yet.</p>
            )}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Video Quality Prediction Project</p>
      </footer>
    </div>
  );
}