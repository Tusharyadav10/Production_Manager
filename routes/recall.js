
const express = require("express");
const path = require("path");
const supabase = require("../supabaseClient");

const router = express.Router();

// Defective batch trace
router.post("/trace", async (req, res) => {
    try {
        const { batch_id } = req.body;

        if (!batch_id) {
            return res.status(400).json({ message: "Batch ID is required" });
        }

        const { data, error } = await supabase
            .from("shipments")
            .select("*")
            .eq("batch_id", batch_id);

        if (error) throw error;
        
        if (!data || data.length === 0) {
            return res.json({ shipments: [] });
        }

        res.status(201).json({ message: "Shipments found", shipments: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;