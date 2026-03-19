import express from "express";
import { currentUser, updateUserDetails, updateUserAvatar, deleteUser } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/multer";

const router = express.Router();

router.get("/me", authMiddleware, currentUser);
router.put("/me", authMiddleware, updateUserDetails);
router.put("/me/avatar", authMiddleware, upload.single("avatar"), updateUserAvatar);
router.delete("/me", authMiddleware, deleteUser);

export default router;