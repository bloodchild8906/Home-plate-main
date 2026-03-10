import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { authenticate, requireRole } from "./middleware/rbac";
import * as menusController from "./routes/menus";
import * as rewardsController from "./routes/rewards";
import * as membersController from "./routes/members";
import * as brandingController from "./routes/branding";
import * as analyticsController from "./routes/analytics";
import * as builderExportController from "./routes/builder-export";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Apply authentication to all /api routes
  app.use("/api", authenticate);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // ============ MENU ROUTES ============
  app.get("/api/menus", menusController.getMenus);
  app.get("/api/menus/:id", menusController.getMenuById);
  app.post("/api/menus", requireRole("admin", "manager"), menusController.createMenu);
  app.put("/api/menus/:id", requireRole("admin", "manager"), menusController.updateMenu);
  app.delete("/api/menus/:id", requireRole("admin"), menusController.deleteMenu);

  // ============ REWARD ROUTES ============
  app.get("/api/rewards", rewardsController.getRewardPrograms);
  app.get("/api/rewards/:id", rewardsController.getRewardProgramById);
  app.post("/api/rewards", requireRole("admin"), rewardsController.createRewardProgram);
  app.put("/api/rewards/:id", requireRole("admin"), rewardsController.updateRewardProgram);
  app.delete("/api/rewards/:id", requireRole("admin"), rewardsController.deleteRewardProgram);

  // ============ MEMBER ROUTES ============
  app.get("/api/members", requireRole("admin", "manager", "staff"), membersController.getMembers);
  app.get("/api/members/:id", requireRole("admin", "manager", "staff"), membersController.getMemberById);
  app.post("/api/members", requireRole("admin", "manager"), membersController.createMember);
  app.put("/api/members/:id", requireRole("admin", "manager"), membersController.updateMember);
  app.delete("/api/members/:id", requireRole("admin"), membersController.deleteMember);
  app.post("/api/members/:id/points", requireRole("admin", "manager", "staff"), membersController.addPoints);

  // ============ BRANDING ROUTES ============
  app.get("/api/branding", requireRole("admin", "manager"), brandingController.getBrandingConfigs);
  app.get("/api/branding/:id", requireRole("admin", "manager"), brandingController.getBrandingConfigById);
  app.post("/api/branding", requireRole("admin"), brandingController.createBrandingConfig);
  app.put("/api/branding/:id", requireRole("admin"), brandingController.updateBrandingConfig);
  app.delete("/api/branding/:id", requireRole("admin"), brandingController.deleteBrandingConfig);

  // ============ ANALYTICS ROUTES ============
  app.get("/api/analytics/summary", requireRole("admin", "manager"), analyticsController.getAnalyticsSummary);

  // ============ BUILDER EXPORT ROUTES ============
  app.post("/api/builder/export-maui", requireRole("admin"), builderExportController.exportMauiProject);

  return app;
}
