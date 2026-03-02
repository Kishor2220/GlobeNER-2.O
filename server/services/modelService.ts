import { pipeline, env } from '@xenova/transformers';
import path from 'path';
import fs from 'fs';
import { logger } from '../logger';
import { CONFIG } from '../config';
import { healthService, ServiceStatus } from './healthService';

// Configure local model path
const LOCAL_MODEL_DIR = path.resolve(process.cwd(), CONFIG.MODEL.LOCAL_PATH);

env.localModelPath = LOCAL_MODEL_DIR;
env.allowRemoteModels = true; 
env.allowLocalModels = true;

// Ensure local model directory exists
if (!fs.existsSync(LOCAL_MODEL_DIR)) {
  fs.mkdirSync(LOCAL_MODEL_DIR, { recursive: true });
}

export class ModelService {
  private static instance: any = null;
  private static isLoading = false;

  static async getInstance() {
    if (this.instance) {
      return this.instance;
    }

    if (this.isLoading) {
      // Wait for loading to complete with timeout
      let retries = 0;
      const maxRetries = (CONFIG.MODEL.TIMEOUT_MS / 100);
      while (this.isLoading && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      if (this.isLoading) {
        throw new Error("Model warming up. Please try again in a few moments.");
      }
      return this.instance;
    }

    this.isLoading = true;
    healthService.updateStatus('model', ServiceStatus.LOADING);
    logger.info(`Loading model: ${CONFIG.MODEL.NAME}...`, 'ModelService');
    
    try {
      const loadPromise = pipeline('token-classification', CONFIG.MODEL.NAME, {
        quantized: true,
        cache_dir: LOCAL_MODEL_DIR
      }).then(model => {
        this.instance = model;
        this.isLoading = false;
        healthService.updateStatus('model', ServiceStatus.OK);
        logger.info(`Model loaded successfully.`, 'ModelService');
        return model;
      }).catch(err => {
        this.isLoading = false;
        this.instance = null;
        healthService.updateStatus('model', ServiceStatus.FAIL);
        logger.error(`Model load failed:`, 'ModelService', err);
        throw err;
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Model load timeout after ${CONFIG.MODEL.TIMEOUT_MS}ms`)), CONFIG.MODEL.TIMEOUT_MS)
      );
      
      await Promise.race([loadPromise, timeoutPromise]);
    } catch (error: any) {
      this.isLoading = false;
      if (error.message.includes("timeout")) {
        logger.warn(`Model load timed out, continuing in background...`, 'ModelService');
        throw new Error("Model warming up. Please try again in a few moments.");
      } else {
        logger.error(`Failed to load model:`, 'ModelService', error);
        this.instance = null;
      }
      throw error;
    }

    return this.instance;
  }

  static async preload() {
    try {
      await this.getInstance();
    } catch (err: any) {
      logger.warn(`Preload failed: ${err.message}. Model will load on first use.`, 'ModelService');
    }
  }
}
