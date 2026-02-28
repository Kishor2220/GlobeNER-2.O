import { spawn } from "child_process";

const server = spawn("npx", ["tsx", "server.ts"]);

server.stdout.on("data", (data) => console.log(`stdout: ${data}`));
server.stderr.on("data", (data) => console.error(`stderr: ${data}`));

server.on("close", (code) => {
  console.log(`child process exited with code ${code}`);
});

setTimeout(() => {
  import("axios").then(async (axios) => {
    try {
      console.log("Extracting entities...");
      const res1 = await axios.default.post("http://localhost:3000/api/extract-entities", {
        text: "Apple Inc. is looking at buying U.K. startup for $1 billion. Tim Cook is the CEO.",
        threshold: 0.5
      }, {
        headers: { 'x-session-id': 'test-session-1' }
      });
      console.log("Extraction:", res1.data.entities);
    } catch (e: any) {
      console.error("Error:", e.response?.data || e.message);
    }
    server.kill();
  });
}, 10000);
