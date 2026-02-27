import { ModelService } from "../server/services/modelService";

async function download() {
  console.log("Downloading model for offline use...");
  try {
    await ModelService.preload();
    console.log("Model downloaded successfully to ./local_models");
  } catch (error) {
    console.error("Failed to download model:", error);
    process.exit(1);
  }
}

download();
