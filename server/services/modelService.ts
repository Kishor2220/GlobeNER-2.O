import { pipeline, env } from '@xenova/transformers';
import path from 'path';
import fs from 'fs';
import { logger } from '../logger';
import { CONFIG } from '../config';
import { healthService, ServiceStatus } from './healthService';

// Configure local model path
const CACHE_DIR = path.resolve(process.cwd(), CONFIG.MODEL.CACHE_DIR);

// Xenova/transformers environment configuration
env.localModelPath = CACHE_DIR;
env.allowRemoteModels = false; // Disable remote downloads
env.allowLocalModels = true;

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
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
    
    logger.info(`[ModelService] Loading model from local cache: ${CONFIG.MODEL.CACHE_DIR}`, 'ModelService');
    logger.info(`[ModelService] Offline mode enabled (local_files_only: true)`, 'ModelService');
    
    try {
      // Load model using local path and local_files_only: true
      const loadPromise = pipeline('token-classification', CONFIG.MODEL.NAME, {
        quantized: true,
        local_files_only: true,
        cache_dir: CACHE_DIR
      }).then(model => {
        this.instance = model;
        this.isLoading = false;
        healthService.updateStatus('model', ServiceStatus.OK);
        logger.info(`[ModelService] Model loaded successfully.`, 'ModelService');
        return model;
      }).catch(err => {
        this.isLoading = false;
        this.instance = null;
        healthService.updateStatus('model', ServiceStatus.FAIL);
        logger.error(`[ModelService] Model load failed (Local files only):`, 'ModelService', err);
        // Fallback: return null instead of throwing to keep server running
        return null;
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Model load timeout after ${CONFIG.MODEL.TIMEOUT_MS}ms`)), CONFIG.MODEL.TIMEOUT_MS)
      );
      
      const result = await Promise.race([loadPromise, timeoutPromise]);
      return result;
    } catch (error: any) {
      this.isLoading = false;
      if (error.message.includes("timeout")) {
        logger.warn(`[ModelService] Model load timed out, continuing in background...`, 'ModelService');
        // We don't throw here to allow the server to keep running, but subsequent calls will check isLoading
      } else {
        logger.error(`[ModelService] Failed to load model:`, 'ModelService', error);
        this.instance = null;
      }
      return null;
    }
  }

  static async preload() {
    try {
      await this.getInstance();
    } catch (err: any) {
      logger.warn(`Preload failed: ${err.message}. Model will load on first use.`, 'ModelService');
    }
  }
}
