import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { authenticate, requireAuthenticated, requireRole } from "./middleware/rbac";
import * as authController from "./routes/auth";
import * as menusController from "./routes/menus";
import * as rewardsController from "./routes/rewards";
import * as membersController from "./routes/members";
import * as brandingController from "./routes/branding";
import * as analyticsController from "./routes/analytics";
import * as builderExportController from "./routes/builder-export";
import * as builderApiCatalogController from "./routes/builder-api-catalog";
import * as siteConfigController from "./routes/site-config";
import * as builderAppsController from "./routes/builder-apps";
import * as usersController from "./routes/users";
import { initializeDatabase } from "./lib/database";

export function createServer() {
  initializeDatabase();
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Apply authentication to all /api routes
  app.use("/api", authenticate);

  // ============ AUTH ROUTES ============
  app.post("/api/auth/login", authController.login);
  app.get("/api/auth/me", authController.getSessionUser);
  app.post("/api/auth/logout", authController.logout);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // ============ MENU ROUTES ============
  app.get("/api/menus", requireRole("admin", "operator"), menusController.getMenus);
  app.get("/api/menus/:id", requireRole("admin", "operator"), menusController.getMenuById);
  app.post("/api/menus", requireRole("admin", "operator"), menusController.createMenu);
  app.put("/api/menus/:id", requireRole("admin", "operator"), menusController.updateMenu);
  app.delete("/api/menus/:id", requireRole("admin"), menusController.deleteMenu);

  // ============ REWARD ROUTES ============
  app.get("/api/rewards", requireRole("admin", "operator"), rewardsController.getRewardPrograms);
  app.get("/api/rewards/:id", requireRole("admin", "operator"), rewardsController.getRewardProgramById);
  app.post("/api/rewards", requireRole("admin", "operator"), rewardsController.createRewardProgram);
  app.put("/api/rewards/:id", requireRole("admin", "operator"), rewardsController.updateRewardProgram);
  app.delete("/api/rewards/:id", requireRole("admin", "operator"), rewardsController.deleteRewardProgram);

  // ============ MEMBER ROUTES ============
  app.get("/api/members", requireRole("admin", "operator"), membersController.getMembers);
  app.get("/api/members/:id", requireRole("admin", "operator"), membersController.getMemberById);
  app.post("/api/members", requireRole("admin", "operator"), membersController.createMember);
  app.put("/api/members/:id", requireRole("admin", "operator"), membersController.updateMember);
  app.delete("/api/members/:id", requireRole("admin"), membersController.deleteMember);
  app.post("/api/members/:id/points", requireRole("admin", "operator"), membersController.addPoints);

  // ============ BRANDING ROUTES ============
  app.get("/api/branding", requireRole("admin", "designer"), brandingController.getBrandingConfigs);
  app.get("/api/branding/:id", requireRole("admin", "designer"), brandingController.getBrandingConfigById);
  app.post("/api/branding", requireRole("admin", "designer"), brandingController.createBrandingConfig);
  app.put("/api/branding/:id", requireRole("admin", "designer"), brandingController.updateBrandingConfig);
  app.delete("/api/branding/:id", requireRole("admin", "designer"), brandingController.deleteBrandingConfig);
  app.get("/api/users", requireRole("admin"), usersController.getUsers);
  app.get("/api/site-config/brand", siteConfigController.getSiteBrand);
  app.put("/api/site-config/brand", requireRole("admin", "designer"), siteConfigController.updateSiteBrand);
  app.get("/api/site-config/dashboard/:userKey", requireAuthenticated, siteConfigController.getDashboardConfig);
  app.put("/api/site-config/dashboard/:userKey", requireAuthenticated, siteConfigController.updateDashboardConfig);

  // ============ ANALYTICS ROUTES ============
  app.get("/api/analytics/summary", requireRole("admin", "analyst"), analyticsController.getAnalyticsSummary);

  // ============ BUILDER APP ROUTES ============
  app.get("/api/builder/api-endpoints", requireRole("admin", "designer"), builderApiCatalogController.getBuilderApiEndpoints);
  app.get("/api/builder/apps", requireRole("admin", "designer"), builderAppsController.getBuilderApps);
  app.put("/api/builder/apps", requireRole("admin", "designer"), builderAppsController.replaceBuilderApps);

  // ============ BUILDER EXPORT ROUTES ============
  app.post("/api/builder/export-maui", requireRole("admin", "designer"), builderExportController.exportMauiProject);

  app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (
      error &&
      typeof error === "object" &&
      "type" in error &&
      "status" in error &&
      error.type === "entity.too.large"
    ) {
      return res.status(413).json({
        success: false,
        error: "Request payload is too large. Try a smaller upload or image.",
      });
    }

    return next(error);
  });

  return app;
}
