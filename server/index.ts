import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { authenticate, requireAuthenticated, requirePermission } from "./middleware/rbac";
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
import * as accessControlController from "./routes/access-control";
import { initializeDatabase } from "./lib/database";
import { PERMISSIONS } from "../shared/access-control";

export function createServer() {
  void initializeDatabase().catch((error) => {
    console.error("Failed to initialize database:", error);
  });
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
  app.get("/api/menus", requirePermission(PERMISSIONS.menusManage), menusController.getMenus);
  app.get("/api/menus/:id", requirePermission(PERMISSIONS.menusManage), menusController.getMenuById);
  app.post("/api/menus", requirePermission(PERMISSIONS.menusManage), menusController.createMenu);
  app.put("/api/menus/:id", requirePermission(PERMISSIONS.menusManage), menusController.updateMenu);
  app.delete("/api/menus/:id", requirePermission(PERMISSIONS.menusManage), menusController.deleteMenu);

  // ============ REWARD ROUTES ============
  app.get("/api/rewards", requirePermission(PERMISSIONS.rewardsManage), rewardsController.getRewardPrograms);
  app.get("/api/rewards/:id", requirePermission(PERMISSIONS.rewardsManage), rewardsController.getRewardProgramById);
  app.post("/api/rewards", requirePermission(PERMISSIONS.rewardsManage), rewardsController.createRewardProgram);
  app.put("/api/rewards/:id", requirePermission(PERMISSIONS.rewardsManage), rewardsController.updateRewardProgram);
  app.delete("/api/rewards/:id", requirePermission(PERMISSIONS.rewardsManage), rewardsController.deleteRewardProgram);
  app.post(
    "/api/rewards/:id/point-generators",
    requirePermission(PERMISSIONS.rewardCodesGenerate),
    rewardsController.createPointGenerator,
  );

  // ============ MEMBER ROUTES ============
  app.get("/api/members", requirePermission(PERMISSIONS.membersManage), membersController.getMembers);
  app.get("/api/members/tags", requirePermission(PERMISSIONS.membersManage), membersController.getMemberTags);
  app.get("/api/members/:id", requirePermission(PERMISSIONS.membersManage), membersController.getMemberById);
  app.post("/api/members", requirePermission(PERMISSIONS.membersManage), membersController.createMember);
  app.put("/api/members/tags", requirePermission(PERMISSIONS.membersManage), membersController.updateMemberTags);
  app.put("/api/members/:id", requirePermission(PERMISSIONS.membersManage), membersController.updateMember);
  app.delete("/api/members/:id", requirePermission(PERMISSIONS.membersManage), membersController.deleteMember);
  app.post("/api/members/:id/points", requirePermission(PERMISSIONS.membersManage), membersController.addPoints);

  // ============ BRANDING ROUTES ============
  app.get("/api/branding", requirePermission(PERMISSIONS.brandingManage), brandingController.getBrandingConfigs);
  app.get("/api/branding/:id", requirePermission(PERMISSIONS.brandingManage), brandingController.getBrandingConfigById);
  app.post("/api/branding", requirePermission(PERMISSIONS.brandingManage), brandingController.createBrandingConfig);
  app.put("/api/branding/:id", requirePermission(PERMISSIONS.brandingManage), brandingController.updateBrandingConfig);
  app.delete("/api/branding/:id", requirePermission(PERMISSIONS.brandingManage), brandingController.deleteBrandingConfig);
  app.get("/api/users", requirePermission(PERMISSIONS.usersManage), usersController.getUsers);
  app.get("/api/users/:id", requirePermission(PERMISSIONS.usersManage), usersController.getUser);
  app.post("/api/users", requirePermission(PERMISSIONS.usersManage), usersController.createUser);
  app.put("/api/users/:id", requirePermission(PERMISSIONS.usersManage), usersController.updateUser);
  app.delete("/api/users/:id", requirePermission(PERMISSIONS.usersManage), usersController.deleteUser);
  app.get("/api/access-control/roles", requirePermission(PERMISSIONS.accessManage), accessControlController.getRoles);
  app.get("/api/access-control/module-requirements", requirePermission(PERMISSIONS.accessManage), accessControlController.getModuleRequirements);
  app.post("/api/access-control/roles", requirePermission(PERMISSIONS.accessManage), accessControlController.createRole);
  app.put("/api/access-control/module-requirements", requirePermission(PERMISSIONS.accessManage), accessControlController.updateModuleRequirements);
  app.put("/api/access-control/roles/:id", requirePermission(PERMISSIONS.accessManage), accessControlController.updateRole);
  app.delete("/api/access-control/roles/:id", requirePermission(PERMISSIONS.accessManage), accessControlController.removeRole);
  app.get("/api/site-config/brand", siteConfigController.getSiteBrand);
  app.put("/api/site-config/brand", requirePermission(PERMISSIONS.brandingManage), siteConfigController.updateSiteBrand);
  app.get("/api/site-config/dashboard/:userKey", requireAuthenticated, siteConfigController.getDashboardConfig);
  app.put("/api/site-config/dashboard/:userKey", requireAuthenticated, siteConfigController.updateDashboardConfig);

  // ============ ANALYTICS ROUTES ============
  app.get("/api/analytics/summary", requirePermission(PERMISSIONS.analyticsView), analyticsController.getAnalyticsSummary);

  // ============ BUILDER APP ROUTES ============
  app.get("/api/builder/api-endpoints", requirePermission(PERMISSIONS.builderManage), builderApiCatalogController.getBuilderApiEndpoints);
  app.get("/api/builder/apps", requirePermission(PERMISSIONS.builderManage), builderAppsController.getBuilderApps);
  app.put("/api/builder/apps", requirePermission(PERMISSIONS.builderManage), builderAppsController.replaceBuilderApps);

  // ============ BUILDER EXPORT ROUTES ============
  app.post("/api/builder/export-maui", requirePermission(PERMISSIONS.builderManage), builderExportController.exportMauiProject);

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
