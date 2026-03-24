const roleRedirects = {
    //Admin: "/admin_dashboard.html",
    Admin: "/master_dashboard.html",
    Auditor: "/auditor_dashboard.html",
    Operator: "/operator_entry.html",
    QC_Inspector: "/qc_inspection.html",
    Supply_Manager: "/recall_dashboard.html",
    //Admin: "/analytics.html",       
    
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
