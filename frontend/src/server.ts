
import cors from "cors";
import express from "express";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://cs2-skintracker-arrijrs-projects.vercel.app/",
    "https://deine-prod-domain.tld"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false, // true nur bei Cookies
}));
