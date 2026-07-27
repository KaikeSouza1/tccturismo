import { Router } from "express";
import multer from "multer";
import { create, listAll, listMine, servePhoto, uploadPhoto } from "./visits.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
});

export const visitsRouter = Router();

visitsRouter.post("/", requireAuth, asyncHandler(create));
visitsRouter.get("/me", requireAuth, asyncHandler(listMine));
visitsRouter.get("/", requireAuth, requireRole("admin"), asyncHandler(listAll));
visitsRouter.post("/:id/photo", requireAuth, upload.single("photo"), asyncHandler(uploadPhoto));
visitsRouter.get("/:id/photo", requireAuth, asyncHandler(servePhoto));
