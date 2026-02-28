import axios from 'axios';

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log("Testing Entity Extraction Pipeline...");
    const text = "Apple Inc. CEO Tim Cook announced new products in Cupertino on 2023-10-26. Contact him at tim@apple.com or +1-800-555-0199. The price is $999.";
    const extractRes = await axios.post(`${baseUrl}/api/analyze`, { text, confidenceThreshold: 0.1 });
    console.log("Extraction successful:", extractRes.data.entities.length, "entities found.");
    console.log(extractRes.data.entities);

    console.log("\nTesting second extraction to trigger memory updates and relationships...");
    const text2 = "Tim Cook was seen in Cupertino again. Apple Inc. is doing well.";
    await axios.post(`${baseUrl}/api/analyze`, { text: text2, confidenceThreshold: 0.1 });

    console.log("\nFetching Analytics Data...");
    const analyticsRes = await axios.get(`${baseUrl}/api/analytics`);
    console.log("Analytics data fetched successfully.");
    
    const data = analyticsRes.data;
    console.log("- Ranked Entities:", data.frequency?.length);
    console.log("- Relationships Graph Nodes:", data.relationships?.nodes?.length);
    console.log("- Relationship Evolution (New):", data.relationship_evolution?.new?.length);
    
    console.log("\nFetching Alerts...");
    const alertsRes = await axios.get(`${baseUrl}/api/alerts`);
    console.log("- Alerts:", alertsRes.data?.length);
    if (alertsRes.data?.length > 0) {
      console.log("  Sample Alert:", alertsRes.data[0].alert_type, alertsRes.data[0].severity);
    }
    
    console.log("\nFetching Behavior Data...");
    const behaviorRes = await axios.get(`${baseUrl}/api/behavior`);
    console.log("- Behavior Data:", behaviorRes.data?.length);
    if (behaviorRes.data?.length > 0) {
      console.log("  Sample Behavior:", behaviorRes.data[0].entity_name, behaviorRes.data[0].behavior_classification);
    }
    
    console.log("\nFetching Ranking Data...");
    const rankingRes = await axios.get(`${baseUrl}/api/ranking/top`);
    console.log("- Top Entities:", rankingRes.data?.length);
    
    console.log("\nFetching Activity Timeline...");
    const timelineRes = await axios.get(`${baseUrl}/api/activity/timeline`);
    console.log("- Timeline Days:", timelineRes.data?.length);

    
  } catch (e: any) {
    console.error("Test failed:", e.message);
    if (e.response) {
      console.error(e.response.data);
    }
  }
}

runTests();
