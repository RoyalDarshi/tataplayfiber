import { Router } from "express";
import { getFilterOptions } from "../services/dashboardService.js";

const router = Router();

router.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "tata-play-fiber-dashboard-api",
    timestamp: new Date().toISOString()
  });
});

router.get("/filters", async (request, response, next) => {
  try {
    const filters = await getFilterOptions(request.query);
    response.json(filters);
  } catch (error) {
    next(error);
  }
});

export default router;
