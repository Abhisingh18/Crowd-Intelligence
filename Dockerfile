FROM python:3.9-slim

# Install system dependencies (ffmpeg and openh264 dependencies for OpenCV)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install python dependencies before copying code to cache layers
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create necessary directories
RUN mkdir -p data/uploads data/outputs

# Copy the source code
COPY . .

# Expose the API port
EXPOSE 8001

# Command to run the application (Render injects $PORT automatically)
CMD uvicorn api:app --host 0.0.0.0 --port ${PORT:-8001}
