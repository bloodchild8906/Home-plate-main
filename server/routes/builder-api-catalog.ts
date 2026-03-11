import { RequestHandler } from "express";
import { type ApiResponse, type BuilderServerApiEndpoint } from "@shared/api";
import { getBuilderApiCatalog } from "../lib/builder-api-catalog";

export const getBuilderApiEndpoints: RequestHandler = (_req, res) => {
  res.status(200).json({
    success: true,
    data: getBuilderApiCatalog(),
  } satisfies ApiResponse<BuilderServerApiEndpoint[]>);
};
