const express = require("express");
const path = require("path");
const supabase = require("../supabaseClient");
const router = express.Router();

router.post("/log_batch", async (req, res) => {
    try {
        console.log("=== LOG BATCH STARTED ===");
        console.log("Request body received:", req.body);

        const { batch_id, product_id, operator_id,
                shift, quantity, production_date } = req.body;

        // parse all ids as numbers
        const batchId = Number(batch_id);
        const productId = Number(product_id);
        const operatorId = Number(operator_id);
        const qty = Number(quantity);

        console.log("Parsed values:");
        console.log(" batchId :", batchId, typeof batchId);
        console.log(" productId :", productId, typeof productId);
        console.log(" operatorId :", operatorId, typeof operatorId);
        console.log(" qty :", qty, typeof qty);

        // insert batch
        console.log("\nInserting into production_batches");

        const { data, error } = await supabase
            .from("production_batches")
            .insert([{
                batch_id: batchId,
                product_id: productId,
                operator_id: operatorId,
                shift,
                quantity: qty,
                production_date
            }])
            .select();

        if (error) {
            console.error("Batch insert error:", error);
            throw error;
        }
    }
    catch (err) {
        console.error("=== FULL ERROR ===", err);
        return res.status(500).json({ message: "Server error logging batch", error: err.message });
    }
});

router.get("/get_batches", async (req, res) => {
    try {
        const operatorId = req.query.operator_id;

        let query = supabase
            .from("production_batches")
            .select("batch_id, product_id, quantity, production_date")
            .order("production_date", { ascending: false })
            .limit(20);

        // Filter by operator_id if provided
        if (operatorId) {
            query = query.eq("operator_id", Number(operatorId));
            console.log("Fetching batches for operator_id:", operatorId);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Fetch batches error:", error);
            return res.status(500).json({ message: "Database error fetching batches", error: error.message });
        }

        res.status(200).json({ batches: data });
    } catch (err) {
        console.error("=== FULL ERROR ===", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;