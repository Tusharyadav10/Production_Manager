const roleRedirects = {
    Admin: "/admin_dashboard.html",
    Auditor: "/auditor_dashboard.html",
    Operator: "/operator_entry.html",
    qc_inspector: "/qc_inspection.html",
    supply_manager: "/recall_dashboard.html"
};

function requireAuth() {
    return (req, res, next) => {
        if (!req.session.user){
          res.redirect("/index.html");
        }
        else if (req.params.role != req.session.user.role) {
          res.json({ message: "Access denied." });
        }
        else{
          next();
        }
    };
}

module.exports = { requireAuth, roleRedirects };
