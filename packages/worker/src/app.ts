import { Worker } from "bullmq";

import { redis as connection } from "@cued/db";

import type { WorkerConfig } from "./lib/worker";
import worker from "./lib/worker";

export const name = "worker";

const queueWorker = new Worker<WorkerConfig>(
  "cued",
  async (job) => {
    console.log(`Job for ${job.data.userId} started.`);
    await worker(job.data);
  },
  {
    connection,
    concurrency: 5,
  },
);

queueWorker.on("ready", () => {
  console.log("Worker is listening for jobs.");
});

queueWorker.on("completed", ({ data }, result) => {
  console.log(`Job for ${data.userId} completed with result ${result}`);
});

queueWorker.on("failed", (job, error) => {
  console.log(`Job for ${job?.data.userId} failed with error ${error}`);
});
