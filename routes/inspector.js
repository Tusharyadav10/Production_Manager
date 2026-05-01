const express = require("express");
const path = require("path");
const supabase = require("../supabaseClient");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
require("dotenv").config();

const router = express.Router();

// 1. Initialize AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Generate the secure S3 upload link
router.get("/get_s3_upload_url", async (req, res) => {
  try {
    const { filename, fileType } = req.query;

    // Create a unique file path (e.g., qc/167890_img_9904.jpg)
    const key = `qc/${Date.now()}_${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    // Generate a temporary upload URL valid for 60 seconds
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    // The permanent public link to save in Supabase
    const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    res.status(200).json({ uploadUrl, publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not generate S3 upload URL" });
  }
});

router.post("/evaluate_batch", async (req, res) => {
  try {
    const { batch_id, inspector_id, inspection_id, status, defect, evidence, inspection_date } = req.body; //

    // Convert batch_id to an Integer for int4 column
    const numericBatchId = parseInt(batch_id, 10);

    if (isNaN(numericBatchId)) {
      return res.status(400).json({ message: "Invalid Batch ID format. Must be a number." });
    }

    const { data, error } = await supabase
      .from("qc_inspections")
      .insert([{
        batch_id: numericBatchId,
        inspector_id,
        inspection_id,
        status,
        defect,
        evidence,
        inspection_date
      }])
      .select();

    if (error) throw error;

    res.status(201).json({ message: "Batch evaluation completed successfully!", batch: data[0] }); //
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get the image url for a specific batch_id
router.get('/get_batch_evidence', async (req, res) => {
    const { batch_id } = req.query;
    const numericBatchId = parseInt(batch_id, 10);

    console.log("--- Database Query Start ---");
    console.log("Received string batch_id:", batch_id);
    console.log("Parsed numericBatchId:", numericBatchId);

    try {
        if (isNaN(numericBatchId)) {
            return res.status(400).json({ message: "Batch ID must be a valid number" });
        }

        // Querying Supabase
        const { data, error } = await supabase
            .from('qc_inspections') // Ensure this matches exactly!
            .select('evidence')
            .eq('batch_id', numericBatchId) 
            .maybeSingle(); // maybeSingle returns null instead of an error if not found

        if (error) {
            console.error("Supabase Query Error:", error.message);
            return res.status(500).json({ message: "Database error", details: error.message });
        }

        if (!data) {
            console.warn(`No record found in Supabase for Batch ID: ${numericBatchId}`);
            return res.status(404).json({ message: `Batch ID ${numericBatchId} does not exist.` });
        }

        console.log("Record found! Evidence URL:", data.evidence);
        return res.status(200).json({ evidenceUrl: data.evidence });

    } catch (err) {
        console.error("Server Crash:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/get_inspections", async (req, res) => {
    try {
        const inspectorId = req.query.inspector_id;

        let query = supabase
            .from("qc_inspections")
            .select("batch_id, status, defect, inspection_date")
            .order("inspection_date", { ascending: false })
            .limit(20);

        if (inspectorId) {
            query = query.eq("inspector_id", Number(inspectorId));
        }

        const { data, error } = await query;

        if (error) {
            console.error("Fetch inspections error:", error);
            return res.status(500).json({ message: "Database error", error: error.message });
        }

        res.status(200).json({ inspections: data });
    } catch (err) {
        console.error("=== FULL ERROR ===", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router; 