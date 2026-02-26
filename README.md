# GlobeNER 2.0: Production-Grade Multilingual NER Platform

GlobeNER 2.0 is a scalable, API-first text intelligence system designed for high-precision Named Entity Recognition (NER) across multiple languages. It uses the state-of-the-art XLM-RoBERTa multilingual model via the Hugging Face Router API for inference.

## Core Architecture

- **Backend**: Node.js (Express) with Hugging Face-powered NER inference engine (XLM-RoBERTa via Router API).
- **Frontend**: React (Vite) with Tailwind CSS, ShadCN-inspired UI, and Recharts.
- **Database**: SQLite (Better-SQLite3) for analytics and history persistence.
- **Inference**: High-performance multilingual NER supporting standard entity labels (PER, LOC, ORG).

## Key Features

- **Multilingual Support**: High accuracy across Indic languages (Hindi, Tamil, Bengali, etc.) and English.
- **Real-time Analysis**: Interactive text input with live entity highlighting.
- **Batch Processing**: Scalable upload for large document sets (.txt, .csv, .json).
- **Analytics Dashboard**: Visual insights into entity distribution and language trends.
- **Developer API**: Robust REST API with full documentation and cURL examples.

## Setup Instructions

1. **Environment Variables**:
   Create a `.env` file with your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

2. **Installation**:
   ```bash
   npm install
   ```

3. **Development**:
   ```bash
   npm run dev
   ```

4. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

## API Usage

### Analyze Text
`POST /api/analyze`
```json
{
  "text": "Narendra Modi visited New Delhi.",
  "confidenceThreshold": 0.5
}
```

## Project Roadmap

- [ ] Support for custom fine-tuned model weights.
- [ ] Real-time streaming analysis for long documents.
- [ ] Advanced entity types (DATE, MONEY, PERCENT).
- [ ] Multi-user collaboration and team workspaces.

## License
Apache-2.0
