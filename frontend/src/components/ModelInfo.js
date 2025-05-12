import React, { useState, useEffect } from 'react';
import './ModelInfo.css';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function ModelInfo() {
  const [modelData, setModelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchModelInfo = async () => {
      try {
        const response = await fetch('/api/model-info');
        if (!response.ok) {
          throw new Error('Failed to fetch model information');
        }
        const data = await response.json();
        setModelData(data);
      } catch (err) {
        setError('Error loading model information: ' + err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchModelInfo();
  }, []);

  const prepareFeatureImportanceChart = () => {
    if (!modelData || !modelData.feature_importance) {
      return null;
    }

    const featureImportance = modelData.feature_importance;
    const labels = Object.keys(featureImportance);
    const data = Object.values(featureImportance);

    // Sort by importance (descending)
    const sortedIndices = data.map((_, i) => i).sort((a, b) => data[b] - data[a]);
    const sortedLabels = sortedIndices.map(i => labels[i]);
    const sortedData = sortedIndices.map(i => data[i]);

    const chartData = {
      labels: sortedLabels,
      datasets: [
        {
          label: 'Feature Importance',
          data: sortedData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Feature Importance',
        },
      },
      scales: {
        y: {
          title: {
            display: true,
            text: 'Importance',
          },
        },
        x: {
          title: {
            display: true,
            text: 'Feature',
          },
          ticks: {
            maxRotation: 90,
            minRotation: 45,
          },
        },
      },
    };

    return { chartData, chartOptions };
  };

  if (loading) {
    return (
      <div className="model-info-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading model information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="model-info-error alert alert-danger">
        <h4>Error Loading Model Information</h4>
        <p>{error}</p>
      </div>
    );
  }

  const featureImportanceChart = prepareFeatureImportanceChart();

  return (
    <div className="model-info">
      <div className="card mb-4">
        <div className="card-header bg-info text-white">
          <h3>Model Information</h3>
        </div>
        <div className="card-body">
          <table className="table">
            <tbody>
              <tr>
                <th scope="row">Model Type</th>
                <td>{modelData?.model_type || 'Not available'}</td>
              </tr>
              <tr>
                <th scope="row">Features Used</th>
                <td>
                  {modelData?.feature_importance ? (
                    <ul>
                      {Object.keys(modelData.feature_importance).map(feature => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  ) : (
                    'Not available'
                  )}
                </td>
              </tr>
              <tr>
                <th scope="row">Model Status</th>
                <td>
                  <span className="badge bg-success">Active</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {featureImportanceChart && (
        <div className="card">
          <div className="card-header bg-info text-white">
            <h3>Feature Importance</h3>
          </div>
          <div className="card-body">
            <p className="text-muted">
              This chart shows the relative importance of each feature in determining video quality predictions.
              Higher values indicate greater influence on the prediction results.
            </p>
            <div className="feature-importance-chart">
              <Bar data={featureImportanceChart.chartData} options={featureImportanceChart.chartOptions} />
            </div>
          </div>
        </div>
      )}
      
      <div className="card mt-4">
        <div className="card-header bg-info text-white">
          <h3>How Does It Work?</h3>
        </div>
        <div className="card-body">
          <p>
            The video quality prediction model analyzes several input parameters to predict 
            the expected video quality score on a 1-5 scale:
          </p>
          <ul>
            <li><strong>Bitrate</strong> - Higher bitrates generally produce higher quality video</li>
            <li><strong>Resolution</strong> - Higher resolution provides more detail but requires more bandwidth</li>
            <li><strong>Frame Rate</strong> - Higher frame rates produce smoother video, especially for motion</li>
            <li><strong>Network Conditions</strong> - Packet loss and delay negatively impact streaming quality</li>
            <li><strong>Device Type & Connection</strong> - Different devices and connections have varying capabilities</li>
          </ul>
          <p>
            The model was trained using XGBoost, an efficient implementation of gradient boosted decision trees,
            which is known for its performance and accuracy in regression tasks.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ModelInfo;