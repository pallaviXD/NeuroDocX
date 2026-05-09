FROM python:3.11-slim

# Install system dependencies including tesseract
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Create directories
RUN mkdir -p uploads vectorstore model_cache

# Expose port
EXPOSE 8080

# Start server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
