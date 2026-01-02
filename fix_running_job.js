// Script per aggiornare manualmente i job rimasti in "running"
// Esegui con: node fix_running_job.js

const { ConvexHttpClient } = require("convex/browser");

const client = new ConvexHttpClient("https://clever-porcupine-404.convex.cloud");

async function fixRunningJobs() {
  try {
    // Ottieni tutti i job in running
    const runningJobs = await client.query("queries:listSyncJobs", {
      status: "running"
    });
    
    console.log(`Found ${runningJobs.length} running jobs`);
    
    for (const job of runningJobs) {
      console.log(`Updating job ${job._id} to failed status`);
      
      await client.mutation("mutations:updateSyncJob", {
        id: job._id,
        status: "failed",
        completed_at: Date.now(),
        error_message: "Job manually terminated - deploy key issue"
      });
      
      console.log(`✓ Job ${job._id} updated to failed`);
    }
    
    console.log("All running jobs have been updated");
  } catch (error) {
    console.error("Error:", error);
  }
}

fixRunningJobs();