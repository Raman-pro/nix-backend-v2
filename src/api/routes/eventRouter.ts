import express from "express";

import {
  getEventsController,
  createEventsController,
  updateEventController,
  deleteEventController,
  createEventController,
} from "../controllers/eventController";
import { protect } from "../middlewares/authMiddleware";
import Permission from "@static/types/permissions";
import protected_route from "../middlewares/permsMiddlewareInit";

const router = express.Router();

const createUpdateProtect = protected_route([Permission.CreateUpdateEvent]);

router.route("/").get(protect, getEventsController);
router
  .route("/create-event")
  .post(protect, createUpdateProtect, createEventController);
router.route("/create-events").post(protect, createUpdateProtect, createEventsController)
router
  .route("/update-event/:id")
  .post(protect, createUpdateProtect, updateEventController);
router
  .route("/delete-event/:id")
  .delete(protect, createUpdateProtect, deleteEventController);

export default router;
