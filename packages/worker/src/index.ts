import worker from "./app";

export const name = "worker";

void worker({
  pollInterval: 1000 * 5, // 5 seconds
  runs: 12 * 60, // 1 hour worth of runs
  userId: "XKhUyeVK4uylOcadYxmSF5RZs6ILI0wY",
});
