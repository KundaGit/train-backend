import "dotenv/config";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const app = express();
app.use(cors());
app.use(express.json());


const BASE_URL = "https://freeapi.gerasim.in/api/TrainApp";

/* 1️⃣ Get All Stations */
app.get("/api/TrainApp/GetAllStations", async (req, res) => {
  try {
    const r = await fetch(`${BASE_URL}/GetAllStations`);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "GetAllStations failed" });
  }
});

/* 2️⃣ Train Search */
app.get("/api/TrainApp/GetTrainSearch", async (req, res) => {
  try {
    const { from, to, date } = req.query;
    const url = `${BASE_URL}/GetTrainSearch?from=${from}&to=${to}&date=${date}`;
    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "GetTrainSearch failed" });
  }
});

/* 3️⃣ Add / Update Passenger */
app.post("/api/TrainApp/AddUpdatePassengers", async (req, res) => {
  try {
    const r = await fetch(`${BASE_URL}/AddUpdatePassengers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "AddUpdatePassengers failed" });
  }
});

/* 4️⃣ Login */
app.post("/api/TrainApp/login", async (req, res) => {
  try {
    const r = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Login failed" });
  }
});
// Chatboat backend code

app.post("/api/chat", async (req, res) => {
  try {
    console.log("CHAT HIT");
    console.log("Message:", req.body.message);
    console.log("API KEY PRESENT:", !!process.env.OPENAI_API_KEY);
    const userMessage = req.body.message; // ✅ FIX
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY missing on server" });
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        
        // messages: [{ role: "user", content: req.body.message }],
        messages: [
          {
            role: "system",

            content: `
You are AskRail AI, a railway assistant.

Rules:
- Do NOT introduce yourself unless the user asks who you are or who created you.
- If the user asks about your creator, clearly say you were created by Kundan Rajak.
- For all other questions, provide railway-related help only.
`
 },
          { role: "user", content: userMessage },
        ]
      }),
    });

    const data = await r.json();

    console.log("OPENAI STATUS:", r.status);
    console.log("OPENAI RESPONSE:", data);

    res.status(r.status).json(data);
  } catch (err) {
    console.error("CHAT CRASH:", err);
    res.status(500).json({ error: err.message });
  }
});

// Order create API for Razorpay
app.post("/api/payment/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100, // ₹ → paise
      currency: "INR",
      receipt: "receipt_" + Date.now()
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order
    });
  } catch (err) {
    res.status(500).json({ error: "Order creation failed" });
  }
});

// Payment verify API for Razorpay
app.post("/api/payment/verify", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, message: "Payment verified" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Train backend running on port", PORT);
});