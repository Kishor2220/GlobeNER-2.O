/**
 * Centralized Configuration for GlobeNER 2.0
 */
import path from 'path';

export const CONFIG = {
  PORT: 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  VERSION: '2.0.0',
  DATABASE: {
    PATH: 'globerner_v2.db'
  },
  MODEL: {
    NAME: 'Xenova/bert-base-NER',
    CACHE_DIR: 'models',
    TIMEOUT_MS: 30000,
    INFERENCE_TIMEOUT_MS: 10000
  },
  API: {
    REQUEST_TIMEOUT_MS: 30000,
    BATCH_LIMIT: 50,
    MAX_FILE_SIZE_MB: 50
  },
  STARTUP: {
    TIMEOUT_MS: 30000
  }
};
