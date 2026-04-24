const express = require("express");
const path = require("path");
const supabase = require("../supabaseClient");
const router = express.Router();

router.post("/add_machines", async (req, res) => {
  try {
    const { user_id, machine_id, machine_name, machine_type, last_maintenance } = req.body;

    if (!user_id || !machine_id || !machine_name || !machine_type || !last_maintenance) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const { data, error } = await supabase
      .from("machines")
      .insert([{ user_id, machine_id, machine_name, machine_type, last_maintenance }])
      .select();

    if (error) throw error;

    res.status(201).json({ message: "Machine registered successfully", machine: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/add_products", async (req, res) => {
  try {
    const { user_id, product_id, product_name, product_sku } = req.body;

    if (!user_id || !product_id || !product_name || !product_sku) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const { data, error } = await supabase
      .from("products")
      .insert([{ user_id, product_id, product_name, product_sku }])
      .select();

    if (error) throw error;

    res.status(201).json({ message: "Product registered successfully", product: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/machines", async (req, res) => {
  try {
    const { data: machines, error } = await supabase
        .from("machines")
        .select("*")
        .eq("user_id", req.body.user_id);

    if (error) throw error;
    res.json({ machines });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", req.body.user_id);

    if (error) throw error;
    res.json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/production_batches", async (req, res) => {
  try {
    const { user_id } = req.body; // Pull from request body now

    if (!user_id) {
        return res.status(400).json({ message: "user_id is required" });
    }

    // 1. Fetch all machine IDs that belong to this user
    const { data: userMachines, error: machineErr } = await supabase
        .from("machines")
        .select("machine_id")
        .eq("user_id", user_id);

    if (machineErr) throw machineErr;
    const machineIds = userMachines.map(m => m.machine_id);

    // 2. Fetch all product IDs that belong to this user
    const { data: userProducts, error: productErr } = await supabase
        .from("products")
        .select("product_id")
        .eq("user_id", user_id);

    if (productErr) throw productErr;
    const productIds = userProducts.map(p => p.product_id);

    // 3. If the user has no machines or products, return empty array early
    if (machineIds.length === 0 || productIds.length === 0) {
         return res.json({ batches: [] });
    }

    // 4. Fetch batches where the machine AND product belong to the user
    const { data: batches, error } = await supabase
        .from("production_batches")
        .select("*")
        .in("machine_id", machineIds)
        .in("product_id", productIds)
        .order('production_date', { ascending: false });

    if (error) throw error;
    
    res.json({ batches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/batch_details", async (req, res) => {
  try {
    const { batch_id } = req.body;
    console.log("Received batch_id:", batch_id);

    if (!batch_id) {
        return res.status(400).json({ message: "Batch ID is required" });
    }

    // 1. Fetch the specific batch
    const { data: batches, error } = await supabase
        .from("production_batches")
        .select("*")
        .eq("batch_id", batch_id);

    if (error) throw error;

    // 2. If no batch is found, return an empty array
    if (!batches || batches.length === 0) {
        return res.json({ breakdown: [] });
    }

    const batch = batches[0];
    const breakdown = [];

    // 3. Generate individual products based on the batch's quantity
    // If quantity is 50, this loops 50 times.
    for (let i = 1; i <= batch.quantity; i++) {
        breakdown.push({
            type: "Individual Unit",
            identifier: `${batch.product_id}-${i}`, // e.g., "PROD001-1", "PROD001-2"
            quantity: 1 // Each individual row represents 1 unit
        });
    }

    // 4. Send the generated list back to the frontend
    console.log("Generated breakdown:", breakdown[0], "...", breakdown[breakdown.length - 1]); // Log first and last item for verification
    res.json({ breakdown });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;