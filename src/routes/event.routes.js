import express from "express";
import { createEvent, getEvent, userRegister, listUpcomingEvents, getEventStats, deletedata } from "../controller/event.controller.js";

const router = express.Router();

router.post("/createevent", createEvent);
router.get("/getevent/:id", getEvent);
router.post("/register", userRegister);
router.post("/deletedata",deletedata);
router.get("/upcoming", listUpcomingEvents);
router.get("/stats/:id", getEventStats);

export default router;
