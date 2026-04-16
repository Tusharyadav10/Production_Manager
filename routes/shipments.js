const express = require("express");
const path = require("path");
const supabase = require("../supabaseClient");
const router = express.Router();

// Add new batch
router.post("/add", async (req, res) => {
  try {
      const {  shipment_id, batch_id, customer_name, delivery_date, status } = req.body;

      const { data, error } = await supabase
          .from("shipments")
          .insert([{
              shipment_id,
              batch_id,
              customer_name,
              delivery_date,
              status
          }])
          .select();

      if (error) throw error;

      res.status(201).json({ message: "Shipment added successfully!", shipment: data[0] });
      } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
      }
});

module.exports = router;