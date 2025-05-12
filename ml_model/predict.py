#!/usr/bin/env python3
import sys
import os
import traceback
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder, MinMaxScaler

# Make sure the script can find the model files
script_dir = os.path.dirname(os.path.realpath(__file__))
model_path = os.path.join(script_dir, 'xgboost_model.pkl')
encoder_path = os.path.join(script_dir, 'encoder.pkl')
scaler_path = os.path.join(script_dir, 'scaler.pkl')

# Only output debug info if a debug flag is set
DEBUG = False

if DEBUG:
    sys.stderr.write(f"Script directory: {script_dir}\n")
    sys.stderr.write(f"Model path: {model_path}\n")
    sys.stderr.write(f"Encoder path: {encoder_path}\n")
    sys.stderr.write(f"Scaler path: {scaler_path}\n")

try:
    # Check if files exist
    for file_path in [model_path, encoder_path, scaler_path]:
        if not os.path.exists(file_path):
            sys.stderr.write(f"ERROR: File not found: {file_path}\n")
            sys.exit(1)
    
    # Load the model and preprocessing components
    model = joblib.load(model_path)
    encoder = joblib.load(encoder_path)
    scaler = joblib.load(scaler_path)
    
    # Get command line arguments
    if len(sys.argv) < 6:
        sys.stderr.write(f"ERROR: Not enough arguments. Expected 5, got {len(sys.argv) - 1}\n")
        sys.exit(1) #indicating failure
    bandwidth, latency, packet_loss, resolution, bitrate = sys.argv[1:]
    
    if DEBUG:
        sys.stderr.write(f"Received parameters: bandwidth={bandwidth}, latency={latency}, packet_loss={packet_loss}, resolution={resolution}, bitrate={bitrate}\n")
    
    # Create a DataFrame from the input
    input_df = pd.DataFrame([[float(bandwidth), float(latency), float(packet_loss), resolution, float(bitrate)]],
                            columns=['bandwidth', 'latency', 'packet_loss', 'resolution', 'bitrate'])
    
    # Transform the data as required by the model
    encoded_res = encoder.transform(input_df[['resolution']])
    
    # Check if encoded_res is sparse and convert if needed
    if hasattr(encoded_res, "toarray"):
        encoded_res_array = encoded_res.toarray()
    else:
        encoded_res_array = encoded_res
    
    # Use the same feature names that were used during training
    resolution_categories = encoder.categories_[0]
    encoded_columns = [f"res_{cat}" for cat in resolution_categories]
    
    if DEBUG:
        sys.stderr.write(f"Using encoded feature names: {encoded_columns}\n")
    
    encoded_res_df = pd.DataFrame(encoded_res_array, columns=encoded_columns)
    
    # Drop the original resolution column and add the encoded columns
    input_numeric = input_df.drop('resolution', axis=1)
    
    # Concatenate the DataFrames
    encoded_df = pd.concat([input_numeric, encoded_res_df], axis=1)
    
    if DEBUG:
        sys.stderr.write(f"Final DataFrame columns: {encoded_df.columns.tolist()}\n")
    
    # Scale the features
    scaled_input = scaler.transform(encoded_df)
    
    # Make prediction
    prediction = model.predict(scaled_input)
    
    # Print the prediction (this will be captured by the Node.js script)
    clipped_prediction = min(max(float(prediction[0]), 1.0), 5.0)
    print(round(clipped_prediction, 2))

except Exception as e:
    sys.stderr.write(f"ERROR: {str(e)}\n")
    if DEBUG:
        sys.stderr.write(f"Traceback: {traceback.format_exc()}\n")
    sys.exit(1)