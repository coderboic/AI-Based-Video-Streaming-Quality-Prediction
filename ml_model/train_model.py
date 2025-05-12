#!/usr/bin/env python3
import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import OneHotEncoder, MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

print("Starting model training...")

# Check if dataset exists, otherwise create synthetic data
data_path = 'video_streaming_data.csv'
if not os.path.exists(data_path):
    print("Dataset not found. Creating synthetic data for demonstration...")
    
    # Generate synthetic data
    np.random.seed(42)
    n_samples = 1000
    
    # Features
    bandwidth = np.random.uniform(1, 100, n_samples)  # Mbps
    latency = np.random.uniform(5, 500, n_samples)    # ms
    packet_loss = np.random.uniform(0, 10, n_samples) # %
    
    # Categorical feature
    resolutions = ['480p', '720p', '1080p', '1440p', '4K']
    resolution = np.random.choice(resolutions, n_samples)
    
    bitrate = np.random.uniform(500, 15000, n_samples)  # kbps
    
    # Target: quality score (1-5)
    # Higher bandwidth/resolution/bitrate → better quality
    # Higher latency/packet loss → worse quality
    quality_score = (
        5 * (bandwidth / 100) + 
        3 * (np.where(resolution == '4K', 1.0, 
              np.where(resolution == '1440p', 0.8,
                np.where(resolution == '1080p', 0.6,
                  np.where(resolution == '720p', 0.4, 0.2))))) +
        2 * (bitrate / 15000) - 
        4 * (latency / 500) - 
        3 * (packet_loss / 10)
    )
    
    # Normalize to 1-5 range
    quality_score = 1 + 4 * (quality_score - quality_score.min()) / (quality_score.max() - quality_score.min())
    
    # Add some noise
    quality_score = np.clip(quality_score + np.random.normal(0, 0.2, n_samples), 1, 5)
    
    # Create DataFrame
    df = pd.DataFrame({
        'bandwidth': bandwidth,
        'latency': latency,
        'packet_loss': packet_loss,
        'resolution': resolution,
        'bitrate': bitrate,
        'quality_score': quality_score
    })
    
    # Save to CSV
    df.to_csv(data_path, index=False)
    print(f"Synthetic dataset created and saved to {data_path}")
else:
    # Load existing dataset
    print(f"Loading dataset from {data_path}")
    df = pd.read_csv(data_path)

print(f"Dataset shape: {df.shape}")

# Handle missing values
df.fillna(method='ffill', inplace=True)

# Explore data
print("\nData overview:")
print(df.describe())

print("\nData types:")
print(df.dtypes)

# Check for missing values
print("\nMissing values:")
print(df.isnull().sum())

# Separate features and target
X = df[['bandwidth', 'latency', 'packet_loss', 'resolution', 'bitrate']]
y = df['quality_score']  # Our target

print("\nEncoding categorical features...")
# Encode categorical feature - updated to use sparse_output instead of sparse
encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
X_encoded = encoder.fit_transform(X[['resolution']])
X_numeric = X.drop('resolution', axis=1)
X_final = pd.concat([X_numeric, pd.DataFrame(X_encoded, columns=[f"res_{i}" for i in encoder.categories_[0]])], axis=1)

print("\nScaling features...")
# Scale features
scaler = MinMaxScaler()
X_scaled = scaler.fit_transform(X_final)

print("\nSplitting data into train and test sets...")
# Split data
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

print("\nTraining XGBoost model with grid search...")
# Train model
model = xgb.XGBRegressor(objective='reg:squarederror')
params = {
    'n_estimators': [100, 200], 
    'max_depth': [3, 6], 
    'learning_rate': [0.1, 0.05]
}
grid = GridSearchCV(model, params, cv=5, scoring='neg_mean_squared_error', verbose=1)
grid.fit(X_train, y_train)

print(f"\nBest parameters: {grid.best_params_}")
print(f"Best CV score (neg MSE): {grid.best_score_}")

# Get the best model
best_model = grid.best_estimator_

print("\nEvaluating model on test set...")
# Evaluate
y_pred = best_model.predict(X_test)
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"MSE: {mse:.4f}")
print(f"RMSE: {rmse:.4f}")
print(f"MAE: {mae:.4f}")
print(f"R² Score: {r2:.4f}")

# Feature importance
feature_names = list(X_numeric.columns) + [f"res_{r}" for r in encoder.categories_[0]]
feature_importance = best_model.feature_importances_
sorted_idx = np.argsort(feature_importance)
plt.figure(figsize=(10, 6))
plt.barh(range(len(sorted_idx)), feature_importance[sorted_idx])
plt.yticks(range(len(sorted_idx)), [feature_names[i] for i in sorted_idx])
plt.title('XGBoost Feature Importance')
plt.tight_layout()
plt.savefig('feature_importance.png')
print("\nFeature importance plot saved as 'feature_importance.png'")

# Actual vs Predicted plot
plt.figure(figsize=(10, 6))
plt.scatter(y_test, y_pred, alpha=0.5)
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--')
plt.xlabel('Actual Quality Score')
plt.ylabel('Predicted Quality Score')
plt.title('Actual vs Predicted Quality Scores')
plt.tight_layout()
plt.savefig('prediction_plot.png')
print("Actual vs Predicted plot saved as 'prediction_plot.png'")

print("\nSaving model and transformers...")
# Save model and transformers
joblib.dump(best_model, 'xgboost_model.pkl')
joblib.dump(encoder, 'encoder.pkl')
joblib.dump(scaler, 'scaler.pkl')

print("\nTraining completed successfully!")
print("Model and transformers saved to:")
print("- xgboost_model.pkl")
print("- encoder.pkl")
print("- scaler.pkl")