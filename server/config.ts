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
    LOCAL_PATH: process.env.LOCAL_MODEL_PATH || 'local_models',
    TIMEOUT_MS: 10000,
    INFERENCE_TIMEOUT_MS: 1800
  },
  API: {
    REQUEST_TIMEOUT_MS: 5000,
    BATCH_LIMIT: 50,
    MAX_FILE_SIZE_MB: 50
  },
  STARTUP: {
    TIMEOUT_MS: 10000
  }
};
