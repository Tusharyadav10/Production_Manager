const express = require("express");
const path = require("path");
const supabase = require("../supabaseClient");
const router = express.Router();

// Add new batch
router.post("/log_batch", async (req, res) => {
  try {
      const {  batch_id, product_id, machine_id, shift, quantity, production_date } = req.body;

      const { data, error } = await supabase
          .from("production_batches")
          .insert([{
              batch_id,
              product_id,
              machine_id,
              shift,
              quantity: Number(quantity),
              production_date
          }])
          .select();

      if (error) throw error;

      res.status(201).json({ message: "Production batch logged successfully!", batch: data[0] });
      } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
      }
});

module.exports = router;