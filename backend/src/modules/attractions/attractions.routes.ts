import { Router } from "express";
import multer from "multer";
import {
  create,
  getOne,
  list,
  qrCodeImage,
  remove,
  removeImage,
  serveImage,
  update,
  uploadImage,
} from "./attractions.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

const upload = multer({
  storage: multer.memoryStorage(),
  // Hospedado na Vercel, o corpo da requisicao tem teto de ~4.5MB — o limite
  // fica um pouco abaixo disso pra sobrar espaco pro resto do payload.
  limits: { fileSize: 4 * 1024 * 1024 },
});

export const attractionsRouter = Router();

attractionsRouter.get("/", requireAuth, asyncHandler(list));
attractionsRouter.get("/:id", requireAuth, asyncHandler(getOne));
attractionsRouter.get("/:id/image", asyncHandler(serveImage));
attractionsRouter.post("/", requireAuth, requireRole("admin"), asyncHandler(create));
attractionsRouter.put("/:id", requireAuth, requireRole("admin"), asyncHandler(update));
attractionsRouter.delete("/:id", requireAuth, requireRole("admin"), asyncHandler(remove));
attractionsRouter.post(
  "/:id/image",
  requireAuth,
  requireRole("admin"),
  upload.single("image"),
  asyncHandler(uploadImage)
);
attractionsRouter.delete(
  "/:id/image",
  requireAuth,
  requireRole("admin"),
  asyncHandler(removeImage)
);
attractionsRouter.get(
  "/:id/qrcode",
  requireAuth,
  requireRole("admin"),
  asyncHandler(qrCodeImage)
);
