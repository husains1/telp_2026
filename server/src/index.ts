import express from "express";
import cors from "cors";
import { api } from "./routes/api.js";
import { record } from "./audit.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());
app.use("/api", api);

app.get("/health", (_req, res) => res.json({ status: "ok", service: "fortress" }));

// Seed the audit trail with a boot marker so the chain always has a genesis row.
record("system", "service.started", { service: "fortress-server" });

app.listen(PORT, () => {
  console.log(`🏰  Fortress server listening on http://localhost:${PORT}`);
});
