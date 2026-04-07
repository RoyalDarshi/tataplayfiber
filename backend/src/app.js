import cors from "cors";
import express from "express";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import metaRoutes from "./routes/metaRoutes.js";

const app = express();
const currentDir = dirname(fileURLToPath(import.meta.url));
const frontendDistPath = resolve(currentDir, "../../frontend/dist");
const hasBuiltFrontend = existsSync(frontendDistPath);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  }),
);
app.use(express.json());

app.get("/api", (_request, response) => {
  response.json({
    name: "Tata Play Fiber Dashboard API",
    version: "1.0.0",
  });
});

app.use("/api", metaRoutes);
app.use("/api/dashboards", dashboardRoutes);

if (hasBuiltFrontend) {
  app.use(express.static(frontendDistPath));

  app.get("*", (request, response, next) => {
    if (request.path.startsWith("/api")) {
      next();
      return;
    }

    response.sendFile(resolve(frontendDistPath, "index.html"));
  });
}

app.use((error, _request, response, _next) => {
  response.status(500).json({
    message:
      error.code === "42P01"
        ? "Database table not found. Run the seed command first."
        : error.message || "Unexpected server error",
  });
});

export default app;
