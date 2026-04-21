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

// Recall defective shipment
router.post("/recall_shipment", async (req, res) => {
  try {
    const { shipment_id } = req.body;

    if (!shipment_id) {
        return res.status(400).json({ message: "Shipment ID is required" });
    }

    const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("shipment_id", shipment_id);

    if (error) throw error;

    if (!data || data.length === 0) {
        return res.status(400).json({ message: "Shipment not found" });
    }

    const shipmentStatus = data[0].status;
    const recallableStatuses = ["In Transit", "Shipped"];

    if (recallableStatuses.includes(shipmentStatus)) {
      const { data, error } = await supabase
          .from("shipments")
          .update({ status: "Recalled" })
          .eq("shipment_id", shipment_id);

      if (error) throw error;

      res.json({ message: `Shipment ID ${shipment_id} Recalled` });

    } else {
      if (shipmentStatus === "Recalled")
      res.json({ message: "Error: Shipment already recalled" });
      else
      res.json({ message: `Error: Shipment is ${shipmentStatus}` });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Defective shipments
router.get("/defective_shipments", async (req, res) => {
  try {
    const { data: batches } = await supabase
        .from("qc_inspections")
        .select("batch_id")
        .eq("status", "Fail");

    const batchIds = batches?.map(batch => batch.batch_id) || [];

    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .in("batch_id", batchIds);

    if (error) throw error;
    console.log("Defective shipments found:", data?.length || 0);
    res.json({ defective_shipments: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
