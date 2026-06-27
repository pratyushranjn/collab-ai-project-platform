const router = require("express").Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { getAnalytics } = require("../controllers/analyticsController");

router.use(protect, authorize("admin"));

router.get("/", getAnalytics);

module.exports = router;