import { NERService } from "../server/services/nerService";
import { ModelService } from "../server/services/modelService";

async function test() {
  console.log("Starting Offline Inference Test...");
  
  try {
    // 1. Preload Model
    console.log("Loading model...");
    const startLoad = Date.now();
    await ModelService.preload();
    console.log(`Model loaded in ${(Date.now() - startLoad) / 1000}s`);

    // 2. Test Inference
    const text = "Apple Inc. is planning to open a new store in Mumbai, India next month. Contact support@apple.com for details.";
    console.log(`\nTesting with text: "${text}"`);
    
    const startInference = Date.now();
    const entities = await NERService.extract(text);
    const endInference = Date.now();
    
    console.log(`Inference time: ${(endInference - startInference) / 1000}s`);
    console.log("Extracted Entities:", JSON.stringify(entities, null, 2));

    // 3. Verify Results
    const hasApple = entities.some(e => e.text.includes("Apple") && e.label === "ORG");
    const hasMumbai = entities.some(e => e.text.includes("Mumbai") && e.label === "LOC");
    const hasEmail = entities.some(e => e.text.includes("support@apple.com") && e.label === "EMAIL");

    if (hasApple && hasMumbai && hasEmail) {
      console.log("\n✅ Test PASSED: All expected entities found.");
    } else {
      console.log("\n❌ Test FAILED: Missing expected entities.");
      process.exit(1);
    }

  } catch (error) {
    console.error("\n❌ Test FAILED with error:", error);
    process.exit(1);
  }
}

test();
