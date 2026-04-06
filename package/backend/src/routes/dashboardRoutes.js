import { Router } from "express";
import { dashboardRegistry } from "../config/dashboardRegistry.js";
import { getDashboardPayload } from "../services/dashboardService.js";

const router = Router();

router.get("/", (_request, response) => {
  response.json({ dashboards: dashboardRegistry });
});

router.get("/:dashboardId", async (request, response, next) => {
  try {
    const payload = await getDashboardPayload(
      request.params.dashboardId,
      request.query
    );
    response.json(payload);
  } catch (error) {
    next(error);
  }
});

export default router;

