const router = require("express").Router();
const ctrl = require("../controllers/webhookController");

router.get("/whatsapp", ctrl.verify);
router.post("/whatsapp", ctrl.receive);

module.exports = router;