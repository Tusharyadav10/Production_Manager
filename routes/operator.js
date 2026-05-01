const express = require("express");
const path = require("path");
const supabase = require("../supabaseClient");
const router = express.Router();

router.post("/log_batch", async (req, res) => {
    try {
        console.log("=== LOG BATCH STARTED ===");
        console.log("Request body received:", req.body);

        const { batch_id, product_id, machine_id, operator_id,
                shift, quantity, production_date } = req.body;

        // parse all ids as numbers
        const batchId = Number(batch_id);
        const productId = Number(product_id);
        const machineId = Number(machine_id);
        const operatorId = Number(operator_id);
        const qty = Number(quantity);

        console.log("Parsed values:");
        console.log(" batchId :", batchId, typeof batchId);
        console.log(" productId :", productId, typeof productId);
        console.log(" machineId :", machineId, typeof machineId);
        console.log(" operatorId :", operatorId, typeof operatorId);
        console.log(" qty :", qty, typeof qty);

        // insert batch
        console.log("\nInserting into production_batches");

        const { data, error } = await supabase
            .from("production_batches")
            .insert([{
                batch_id: batchId,
                product_id: productId,
                machine_id: machineId,
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

        console.log("Batch inserted successfully:", data[0]);
        console.log("Saved batch_id from DB:", data[0].batch_id, typeof data[0].batch_id);

        
        console.log("\nGenerating item IDs");

        const savedBatchId = data[0].batch_id; // use batch_id returned from DB

        const items = [];
        for (let i = 1; i <= qty; i++) {
            const serial = String(i).padStart(3, '0');
            items.push({
                item_id: `${savedBatchId}-${serial}`,
                batch_id: savedBatchId,
                serial_number: i,
                
            });
        }

        console.log("Items generated:", items);

        //insert items

        console.log("\nInserting into batch_items");

        const { data: itemData, error: itemError } = await supabase
            .from("batch_items")
            .insert(items)
            .select();

        if (itemError) {
            console.error("Item insert error:", itemError);
            throw itemError;
        }

        console.log("Items inserted successfully:", itemData);
        console.log("=== LOG BATCH COMPLETED ===");

        res.status(201).json({
            message: "Production batch logged successfully!",
            batch: data[0],
            items_created: items.length
        });

    } catch (err) {
        console.error("=== FULL ERROR ===", err);
        res.status(500).json({ message: "Server error", error: err.message });
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