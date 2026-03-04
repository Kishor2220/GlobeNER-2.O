import { pipeline, env } from '@xenova/transformers';
import path from 'path';
import fs from 'fs';

/**
 * Helper script to download the NER model for offline use.
 * Run this while online to populate the models/ directory.
 */
async function downloadModel() {
  const MODEL_NAME = 'Xenova/bert-base-NER';
  const OUTPUT_DIR = path.resolve(process.cwd(), 'models/bert-base-NER');

  console.log(`[Download] Starting download for ${MODEL_NAME}...`);
  console.log(`[Download] Target directory: ${OUTPUT_DIR}`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Configure environment to use the specific directory
  env.localModelPath = path.resolve(process.cwd(), 'models');
  env.allowRemoteModels = true;

  try {
    // Pipeline will download the model if not found in cache
    // We specify cache_dir to ensure it goes where we want it
    await pipeline('token-classification', MODEL_NAME, {
      quantized: true,
      cache_dir: path.resolve(process.cwd(), 'models')
    });

    console.log(`[Download] Model ${MODEL_NAME} downloaded successfully.`);
    console.log(`[Download] You can now run the application in offline mode.`);
  } catch (error) {
    console.error(`[Download] Error downloading model:`, error);
    process.exit(1);
  }
}

downloadModel();
