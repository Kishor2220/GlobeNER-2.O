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
  private static modelName = 'Xenova/bert-base-NER';
  private static isLoading = false;

  static async getInstance() {
    if (this.instance) {
      return this.instance;
    }

    if (this.isLoading) {
      // Wait for loading to complete with timeout
      let retries = 0;
      while (this.isLoading && retries < 100) { // 10 seconds max wait
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      if (this.isLoading) {
        throw new Error("Model warming up. Please try again in a few moments.");
      }
      return this.instance;
    }

    this.isLoading = true;
    console.log(`[ModelService] Loading model: ${this.modelName}...`);
    
    try {
      // Use a smaller, faster model for testing/dev to prevent OOM and timeouts
      const modelToLoad = process.env.NODE_ENV === 'production' 
        ? this.modelName 
        : 'Xenova/bert-base-NER';
        
      const loadPromise = pipeline('token-classification', modelToLoad, {
        quantized: true, // Use quantized model for performance
        cache_dir: LOCAL_MODEL_DIR
      }).then(model => {
        this.instance = model;
        this.isLoading = false;
        console.log(`[ModelService] Model loaded successfully.`);
        return model;
      }).catch(err => {
        this.isLoading = false;
        this.instance = null;
        console.error(`[ModelService] Background model load failed:`, err);
        throw err;
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Model download/load timeout after 10s")), 10000)
      );
      
      await Promise.race([loadPromise, timeoutPromise]);
    } catch (error: any) {
      if (error.message.includes("timeout")) {
        console.warn(`[ModelService] Model load timed out, continuing in background...`);
        throw new Error("Model warming up. Please try again in a few moments.");
      } else {
        console.error(`[ModelService] Failed to load model:`, error);
        this.instance = null; // Reset instance on failure
        this.isLoading = false;
      }
      throw error;
    }

    return this.instance;
  }

  static async preload() {
    await this.getInstance();
  }
}
