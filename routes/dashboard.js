const express = require('express');
const router = require('express').Router();
const supabase = require('../supabaseClient');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/stats', async (req, res) => {
    try {
        // 1. Fetch Failed Inspections
        // FIXED: Column names changed to match your database ('status' and 'defect')
        const { data: inspections, error: inspError } = await supabase
            .from('qc_inspections')
            .select(`
                batch_id,
                status,
                defect,
                production_batches (
                    machine_id,
                    operator_id
                )
            `)
            .eq('status', 'Fail'); // FIXED: Capitalized 'Fail' to match database

        if (inspError) throw inspError;

        // 2. Fetch Impacted Shipments
        const { data: shipments, error: shipError } = await supabase
            .from('shipments')
            .select('batch_id, customer_name');

        if (shipError) throw shipError;

        // --- Aggregation Logic ---
        const machineStats = {};
        const operatorStats = {};
        const reasonStats = {};
        const impactStats = {};

        inspections.forEach(insp => {
            const batch = insp.production_batches;
            if (batch) {
                // We'll add a prefix so the charts look like "MCH-1" or "Op-2"
                const mchName = `MCH-0${batch.machine_id}`; 
                const opName = `Operator ${batch.operator_id}`;
                
                machineStats[mchName] = (machineStats[mchName] || 0) + 1;
                operatorStats[opName] = (operatorStats[opName] || 0) + 1;
            }
            // FIXED: Changed insp.defect_type to insp.defect
            if (insp.defect) {
                reasonStats[insp.defect] = (reasonStats[insp.defect] || 0) + 1;
            }
        });

        // Calculate Customer AND Shipment Impact
        shipments.forEach(ship => {
            const isFailed = inspections.some(i => i.batch_id === ship.batch_id);
            if (isFailed) {
                const batchStr = `BAT-0${ship.batch_id}`;
                if (!impactStats[batchStr]) {
                    impactStats[batchStr] = { customers: new Set(), shipments: 0 };
                }
                impactStats[batchStr].customers.add(ship.customer_name);
                impactStats[batchStr].shipments += 1;
            }
        });

        // --- Summary Card Calculations ---
        const getTop = (stats) => Object.entries(stats).sort((a, b) => b[1] - a[1])[0] || ['None', 0];
        
        const topMachine = getTop(machineStats);
        const topOperator = getTop(operatorStats);
        const topReason = getTop(reasonStats);
        
        const topImpact = Object.entries(impactStats)
            .sort((a, b) => b[1].customers.size - a[1].customers.size)[0] 
            || ['None', { customers: new Set(), shipments: 0 }];

        // --- Response Formatting ---
        res.json({
            success: true,
            summary: {
                mostDefectiveMachine: { id: topMachine[0], count: topMachine[1] },
                highestDefectOp: { id: topOperator[0], count: topOperator[1] },
                topFailureReason: { reason: topReason[0], count: topReason[1] },
                highestImpactBatch: {
                    batch_id: topImpact[0],
                    customer_count: topImpact[0] !== 'None' ? topImpact[1].customers.size : 0,
                    shipment_count: topImpact[0] !== 'None' ? topImpact[1].shipments : 0
                }
            },
            charts: {
                machines: Object.entries(machineStats).map(([id, count]) => ({ name: id, count })),
                operators: Object.entries(operatorStats).map(([id, count]) => ({ name: id, count })),
                reasons: Object.entries(reasonStats).map(([type, count]) => ({ reason: type, count })),
                impact: Object.entries(impactStats).map(([id, stats]) => ({
                    batch_id: id,
                    customer_count: stats.customers.size,
                    shipment_count: stats.shipments
                }))
            }
        });

    } catch (err) {
        console.error("Backend Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;