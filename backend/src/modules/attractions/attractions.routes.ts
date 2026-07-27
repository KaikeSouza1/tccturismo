import { Router } from "express";
import multer from "multer";
import {
  create,
  deleteGalleryImage,
  getOne,
  list,
  listImages,
  qrCodeImage,
  regenerateQrCode,
  remove,
  serveCoverImage,
  serveGalleryImage,
  setCover,
  update,
  uploadGalleryImage,
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
attractionsRouter.get("/:id/image", asyncHandler(serveCoverImage));
attractionsRouter.post("/", requireAuth, requireRole("admin"), asyncHandler(create));
attractionsRouter.put("/:id", requireAuth, requireRole("admin"), asyncHandler(update));
attractionsRouter.delete("/:id", requireAuth, requireRole("admin"), asyncHandler(remove));

attractionsRouter.get("/:id/images", asyncHandler(listImages));
attractionsRouter.get("/:id/images/:imageId", asyncHandler(serveGalleryImage));
attractionsRouter.post(
  "/:id/images",
  requireAuth,
  requireRole("admin"),
  upload.single("image"),
  asyncHandler(uploadGalleryImage)
);
attractionsRouter.delete(
  "/:id/images/:imageId",
  requireAuth,
  requireRole("admin"),
  asyncHandler(deleteGalleryImage)
);
attractionsRouter.put(
  "/:id/images/:imageId/cover",
  requireAuth,
  requireRole("admin"),
  asyncHandler(setCover)
);

attractionsRouter.get(
  "/:id/qrcode",
  requireAuth,
  requireRole("admin"),
  asyncHandler(qrCodeImage)
);
attractionsRouter.post(
  "/:id/qrcode/regenerate",
  requireAuth,
  requireRole("admin"),
  asyncHandler(regenerateQrCode)
);
