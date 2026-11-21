import { Router } from "express";
import * as chatController from "../controllers/chat.controller.js";

const router = Router();

router.get("/health", chatController.health);
router.post("/chat", chatController.chat);

export default router;
