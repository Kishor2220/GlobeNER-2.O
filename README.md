# GlobeNER 2.0: Enterprise-Grade Multilingual Intelligence Platform

GlobeNER 2.0 is a high-performance, privacy-focused text intelligence system designed for high-precision Named Entity Recognition (NER), relationship mapping, and knowledge graph visualization. It combines state-of-the-art local transformer models with a production-grade regex validation engine.

## 🚀 Core Architecture

- **Hybrid Intelligence Engine**:
  - **Contextual Model**: `Xenova/bert-base-NER` (Local Transformers) for PER, ORG, and LOC detection.
  - **Validation Layer**: Production-grade Regex Engine for global formats of MONEY, PHONE, DATE, TIME, and EMAIL.
- **Stability Architecture**:
  - **Non-Blocking Boot**: Instant server start with background model preloading.
  - **Health Monitoring**: Real-time service status tracking (Database, Model, Analytics, Memory).
  - **Centralized Governance**: Unified configuration and structured logging.
- **Backend**: Node.js (Express) with local inference (no external API calls for NER).
- **Frontend**: React (Vite) with a high-density "Technical Dashboard" aesthetic, Recharts, and Knowledge Graph visualization.
- **Database**: SQLite (Better-SQLite3) for persistent memory, analytics, and relationship tracking.

## ✨ Key Features

- **Global Entity Detection**:
  - **MONEY**: Supports 15+ currency symbols, ISO codes, and financial suffixes (Lakh, Crore, Million).
  - **PHONE**: Detects international and local formats with strict digit length validation (7-15 digits).
  - **DATE/TIME**: Supports ISO 8601, numeric formats, and multilingual numerals (Hindi, Kannada, Arabic-Indic, etc.).
- **Multilingual Support**: Unicode digit normalization and global format detection for high accuracy across Indic and international languages.
- **Knowledge Graph**: Real-time visualization of entity relationships and co-occurrence trends.
- **Reliability Dashboard**: Built-in monitoring for service health, memory usage, and extraction performance.
- **Batch & File Processing**: Scalable analysis for .txt, .csv, and .json documents.

## 🛠️ Setup Instructions

1. **Environment Variables**:
   Copy `.env.example` to `.env` and configure your settings:
   ```bash
   cp .env.example .env
   ```
   *Note: `GEMINI_API_KEY` is currently optional and reserved for future advanced reasoning features.*

2. **Installation**:
   ```bash
   npm install
   ```

3. **Pre-download Intelligence Model**:
   This step ensures the local transformer model is cached for offline use:
   ```bash
   npm run download:model
   ```

4. **Development**:
   ```bash
   npm run dev
   ```

5. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

## 📡 API Usage

### Health Check
`GET /health`
Returns the real-time status of all intelligence services.

### Analyze Text
`POST /api/analyze`
```json
{
  "text": "The transaction of ₹5,00,000 was processed on 15 Aug 2023.",
  "confidenceThreshold": 0.5
}
```

### Batch Extraction
`POST /api/batch-extract`
```json
{
  "texts": ["Text 1", "Text 2"],
  "threshold": 0.5
}
```

## 🛡️ Reliability & Security

- **Local Inference**: All NER processing happens on your infrastructure. No text data is sent to external APIs for extraction.
- **Request Timeouts**: 5-second API timeout protection.
- **Memory Safety**: Enforced batch limits and structured resource management.
- **Error Boundaries**: Multi-level React Error Boundaries to prevent UI crashes.

## 📜 License
Apache-2.0
