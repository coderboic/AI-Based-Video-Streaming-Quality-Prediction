import React, { useState, useEffect } from 'react';
import './App.css';
import PredictionForm from './components/PredictionForm';
import ResultsDisplay from './components/ResultsDisplay';
import Header from './components/Header';
import Footer from './components/Footer';
import ModelInfo from './components/ModelInfo';

function App() {
  const [predictionResults, setPredictionResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('predict');

  const handlePrediction = async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Prediction request failed');
      }
      
      const data = await response.json();
      setPredictionResults(data);
    } catch (err) {
      setError('Failed to get prediction: ' + err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (feedbackData) => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...predictionResults,
          ...feedbackData,
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
      
      alert('Thank you for your feedback!');
    } catch (err) {
      alert('Error submitting feedback: ' + err.message);
      console.error('Error:', err);
    }
  };

  return (
    <div className="App">
      <Header />
      
      <div className="container mt-4">
        <div className="tab-navigation mb-4">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'predict' ? 'active' : ''}`}
                onClick={() => setActiveTab('predict')}
              >
                Predict Quality
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'model-info' ? 'active' : ''}`}
                onClick={() => setActiveTab('model-info')}
              >
                Model Information
              </button>
            </li>
          </ul>
        </div>
        
        {activeTab === 'predict' ? (
          <div className="row">
            <div className="col-md-6">
              <PredictionForm onSubmit={handlePrediction} isLoading={loading} />
              
              {error && (
                <div className="alert alert-danger mt-3">
                  {error}
                </div>
              )}
            </div>
            
            <div className="col-md-6">
              {predictionResults && !loading && (
                <ResultsDisplay 
                  results={predictionResults} 
                  onFeedbackSubmit={handleFeedback}
                />
              )}
            </div>
          </div>
        ) : (
          <ModelInfo />
        )}
      </div>
      
      <Footer />
    </div>
  );
}

export default App;