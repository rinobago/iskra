import { Hono } from "hono";
import contactRouter from "./routes/contact.js";

const app = new Hono();

app.get("/api/health", (c) => {
    return c.json({ status: "ok" });
});

app.route("/api/contact", contactRouter);

export default app;
