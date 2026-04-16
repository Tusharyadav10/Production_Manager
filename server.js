const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const authRoutes = require("./routes/auth");
const { requireAuth, roleRedirects } = require("./middleware/authMiddleware");
const adminRoutes = require("./routes/admin");
const operatorRoutes = require("./routes/operator");
const inspectorRoutes = require("./routes/inspector");
const recallRoutes = require("./routes/recall");
const auditorRoutes = require("./routes/auditor");
const dashboardRoutes = require("./routes/dashboard");
const shipmentsRoutes = require("./routes/shipments");
require("dotenv").config();

const PORT = process.env.PORT;
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.static("dashboards"));

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 } // 1 hour
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/operator", operatorRoutes);
app.use("/api/inspector", inspectorRoutes);
app.use("/api/recall", recallRoutes);
app.use("/api/auditor", auditorRoutes);
app.use("/api/analytics", dashboardRoutes);
app.use("/api/shipments", shipmentsRoutes);

// Redirect based on user role
app.get("/:role/dashboard", requireAuth(), (req, res) => {
      const redirectUrl = roleRedirects[req.session.user.role];
      res.sendFile(path.join(__dirname, "/dashboards", redirectUrl));
});

// Default route
app.get("/", (req, res) => res.redirect("/index.html"));

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
