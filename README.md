# AI-Based Video Streaming Quality Prediction

## 📊 Project Overview

This project implements an AI-powered video streaming quality prediction system that uses machine learning to accurately forecast video quality based on network conditions and video parameters. By analyzing factors such as bandwidth, latency, packet loss, resolution, and bitrate, our system predicts the user experience on a scale from 1-5.

## ✨ Key Features

- **Real-time Quality Prediction**: Predicts video streaming quality scores (1-5) based on network parameters
- **Interactive UI**: Modern, responsive interface for parameter input and result visualization
- **Quality Visualization**: Visual representation of prediction results using Chart.js
- **Historical Data Tracking**: Logs and displays previous predictions for analysis
- **Machine Learning Model**: Trained XGBoost regression model for accurate predictions
- **Feature Importance Analysis**: Visual breakdown of which factors most affect streaming quality

## 🛠️ Technology Stack

### Frontend
- **React** with Vite for fast development
- **Chart.js** for data visualization
- **Tailwind CSS** for responsive styling
- **Axios** for API requests

### Backend
- **Node.js** with Express
- **MongoDB** for storing prediction logs
- **Child Process** for Python script execution

### Machine Learning
- **Python** with scikit-learn and XGBoost
- **Pandas** for data processing
- **Matplotlib/Seaborn** for visualization
- **Joblib** for model serialization

## 🔍 How It Works

1. **User Input**: Users provide network parameters (bandwidth, latency, packet loss) and video parameters (resolution, bitrate)
2. **API Request**: Frontend sends these parameters to the backend server
3. **Model Execution**: Server calls the Python prediction script with the parameters
4. **Quality Prediction**: ML model predicts the video quality score
5. **Result Display**: Prediction is visualized in the UI with quality category and score
6. **Data Logging**: Prediction and parameters are stored in MongoDB for future reference

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14+)
- Python 3.8+
- MongoDB

