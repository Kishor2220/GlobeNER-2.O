import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import router from "./server/routes.ts";
import { logger } from "./server/logger.ts";
import { CONFIG } from "./server/config.ts";
import { healthService } from "./server/services/healthService.ts";
import { ModelService } from "./server/services/modelService.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. API Request Timeout Middleware
app.use((req, res, next) => {
  res.setTimeout(CONFIG.API.REQUEST_TIMEOUT_MS, () => {
    logger.warn(`Request timed out: ${req.method} ${req.url}`, 'Server');
    res.status(408).send('Request Timeout');
  });
  next();
});

app.use(express.json({ limit: `${CONFIG.API.MAX_FILE_SIZE_MB}mb` }));

async function start() {
  logger.info(`Starting GlobeNER ${CONFIG.VERSION} in ${CONFIG.NODE_ENV} mode...`, 'Startup');

  // 2. Vite Middleware (Handles frontend fully)
  if (CONFIG.NODE_ENV !== "production") {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
      logger.info("Vite middleware initialized", "Startup");
    } catch (err) {
      logger.error("Failed to initialize Vite server", "Startup", err);
    }
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
  }

  // 3. API Routes
  app.use("/api", router);

  // 4. Health Check
  app.get("/health", (req, res) => {
    res.json(healthService.getHealth());
  });

  // 5. Production Fallback
  if (CONFIG.NODE_ENV === "production") {
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  // 6. Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(`Unhandled error: ${req.method} ${req.url}`, 'GlobalErrorHandler', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  // 7. Start Listener
  app.listen(CONFIG.PORT, "0.0.0.0", () => {
    logger.info(`GlobeNER ${CONFIG.VERSION} running on http://localhost:${CONFIG.PORT}`, 'Startup');
  });

  // 8. Background Model Preloading (Non-blocking)
  ModelService.preload().catch(err => {
    logger.warn(`Background model preloading failed: ${err.message}`, 'Startup');
  });
}

// Startup with timeout protection
const startupTimeout = setTimeout(() => {
  logger.error(`Startup timed out after ${CONFIG.STARTUP.TIMEOUT_MS}ms`, 'Startup');
}, CONFIG.STARTUP.TIMEOUT_MS);

start().then(() => {
  clearTimeout(startupTimeout);
}).catch((err) => {
  logger.error("Startup failed critically", "Startup", err);
  process.exit(1);
});
