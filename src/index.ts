import express from "express";
import { env } from "./config/env.js";

const app = express();

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
    });
});

app.listen(env.PORT, () => {
    console.log(`Fake Early Bird running on port ${env.PORT}`);
});
