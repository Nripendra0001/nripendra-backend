const express = require("express");
const router = express.Router();
const controller = require("../controllers/resultController");

router.get("/", controller.getResults);
router.post("/", controller.addResult);
router.delete("/:id", controller.deleteResult);

module.exports = router;
