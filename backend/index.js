require('dotenv').config();
console.log("RUNNING CORRECT INDEX");

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Route imports
const authRoutes = require('./src/routes/auth');
const usersRoutes = require('./src/routes/users');
const campaignsRoutes = require('./src/routes/campaigns');
const messagesRoutes = require('./src/routes/messages');
const contactsRoutes = require('./src/routes/contacts');
const templatesRoutes = require('./src/routes/templates');
const analyticsRoutes = require('./src/routes/analytics');
const webhooksRoutes = require('./src/routes/webhooks');
const optOutsRoutes = require('./src/routes/opt-outs');
const optRoutes = require('./src/routes/opt');
const reportsRoutes = require('./src/routes/reports');
const organizationRoutes = require('./src/routes/organization');
const organizationsRoutes = require('./src/routes/organizations');

const app = express();


// ---------------- SECURITY ----------------

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(morgan('combined'));

const testRoute = require("./src/routes/testSend");

app.use("/api/test", testRoute);
console.log("TEST ROUTE INIT");




// ---------------- TEST ROUTE FIRST ----------------



// ---------------- RATE LIMIT ----------------

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);


// ---------------- MONGO ----------------

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/whatsapp";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });


// ---------------- API ROUTES ----------------

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/campaigns", campaignsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/templates", templatesRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/webhooks", webhooksRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/organizations", organizationsRoutes);
app.use("/api/opt-outs", optOutsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/opt", optRoutes);

// webhook for meta verify
app.use("/webhook", require("./src/routes/webhooks.js"));


// ---------------- HEALTH ----------------

app.get("/", (req, res) =>
  res.json({
    status: "ok",
    env: process.env.NODE_ENV || "development",
  })
);


// ---------------- 404 ----------------

app.use((req, res) =>
  res.status(404).json({ error: "Not Found" })
);


// ---------------- ERROR ----------------

app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});


// ---------------- START ----------------

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server listening on port ${PORT}`)
);


// ---------------- SHUTDOWN ----------------

process.on("SIGINT", async () => {
  console.log("SIGINT received — shutting down");
  await mongoose.disconnect();
  process.exit(0);
});

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection:", reason);
});

module.exports = app;