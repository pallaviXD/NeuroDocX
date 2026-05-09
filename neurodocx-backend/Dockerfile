FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the embedding model into the image at build time
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2', cache_folder='/app/model_cache')"

COPY . .

RUN mkdir -p uploads vectorstore

ENV PORT=8080
ENV TRANSFORMERS_OFFLINE=1
ENV HF_HUB_OFFLINE=1
ENV SENTENCE_TRANSFORMERS_HOME=/app/model_cache

EXPOSE 8080

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
