const express = require("express");
const router = express.Router();
const c = require("../controllers/noticeController");

router.get("/", c.getNotices);
router.post("/", c.addNotice);

module.exports = router;
