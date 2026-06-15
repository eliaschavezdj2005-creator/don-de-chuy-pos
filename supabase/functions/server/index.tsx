import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

app.use('*', logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

app.get("/make-server-96525332/health", (c) => c.json({ status: "ok" }));

// Load all POS state
app.get("/make-server-96525332/state", async (c) => {
  const data = await kv.get("pos_state");
  return c.json(data || { orders: [], transactions: [] });
});

// Save all POS state
app.post("/make-server-96525332/state", async (c) => {
  const body = await c.req.json();
  await kv.set("pos_state", body);
  return c.json({ ok: true });
});

Deno.serve(app.fetch);
