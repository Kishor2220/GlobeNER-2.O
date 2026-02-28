import axios from "axios";

async function test() {
  try {
    console.log("Extracting entities...");
    const res1 = await axios.post("http://localhost:3000/api/extract-entities", {
      text: "Apple Inc. is looking at buying U.K. startup for $1 billion. Tim Cook is the CEO.",
      threshold: 0.5
    }, {
      headers: { 'x-session-id': 'test-session-1' }
    });
    console.log("Extraction:", res1.data.entities);
  } catch (e: any) {
    console.error("Error:", e.response?.data || e.message);
  }
}

test();
