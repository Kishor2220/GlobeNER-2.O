import { pipeline, env } from '@xenova/transformers';
import path from 'path';
import fs from 'fs';

// Configure local model path
const LOCAL_MODEL_DIR = process.env.LOCAL_MODEL_PATH 
  ? path.resolve(process.cwd(), process.env.LOCAL_MODEL_PATH)
  : path.resolve(process.cwd(), 'local_models');

env.localModelPath = LOCAL_MODEL_DIR;
env.allowRemoteModels = true; // Allow downloading on first run, then use local cache
env.allowLocalModels = true;

// Ensure local model directory exists
if (!fs.existsSync(LOCAL_MODEL_DIR)) {
  fs.mkdirSync(LOCAL_MODEL_DIR, { recursive: true });
}

export class ModelService {
  private static instance: any = null;
  private static modelName = 'Xenova/bert-base-multilingual-cased-ner-hrl';
  private static isLoading = false;

  static async getInstance() {
    if (this.instance) {
      return this.instance;
    }

    if (this.isLoading) {
      // Wait for loading to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.instance;
    }

    this.isLoading = true;
    console.log(`[ModelService] Loading model: ${this.modelName}...`);
    
    try {
      this.instance = await pipeline('token-classification', this.modelName, {
        quantized: true, // Use quantized model for performance
        cache_dir: LOCAL_MODEL_DIR
      });
      console.log(`[ModelService] Model loaded successfully.`);
    } catch (error) {
      console.error(`[ModelService] Failed to load model:`, error);
      throw error;
    } finally {
      this.isLoading = false;
    }

    return this.instance;
  }

  static async preload() {
    await this.getInstance();
  }
}
