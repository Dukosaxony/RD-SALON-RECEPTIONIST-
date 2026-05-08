import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const VoiceResponse = twilio.twiml.VoiceResponse;

// In-memory session store (keyed by Twilio CallSid)
const sessions = {};

const SYSTEM_PROMPT = `You are Maya, the friendly and professional phone receptionist for RD Salon & BlowDry Bar — a sophisticated full-service salon and blowdry bar with three locations in Northeast Pennsylvania.

IMPORTANT RULES FOR VOICE:
- Keep every response SHORT — 1 to 3 sentences max. This is a phone call.
- Speak naturally, like a real receptionist would. No bullet points, no lists.
- Never say "hashtag", "asterisk", or any formatting words.
- Always sound warm, calm, and helpful.
- If you don't know something, say so honestly and offer to connect them with staff.

ABOUT THE SALON:
RD Salon & BlowDry Bar specializes in precision cuts, an extensive color bar, and total beauty care for both men and women.

THREE LOCATIONS:
1. Clarks Summit: 203 Greenwood Ave, Clarks Summit PA — phone (570) 587-8689
2. West Scranton: 924 South Main Ave, Scranton PA — phone (570) 342-5329
3. Downtown Scranton: 324 Penn Ave, Scranton PA — phone (570) 344-2570

SERVICES & STARTING PRICES:
- Blowouts start at $35, Updos at $75, Makeup at $65
- Lashes start at $20, Lash Lift $50, Lash Lift and Tint $60
- Waxing starts at $15, Spray Tan at $25
- Manicure starts at $25, Pedicure at $40
- Women's Haircut starts at $50, Men's Haircut at $30, Children's Haircut at $25
- Single Process Color starts at $85, Highlights at $175, Balayage at $200
- Keratin Treatment starts at $175
- Fashion Color, Brazilian Blowout, Hair Extensions, and Lash Extensions are priced by consultation
- New clients need a consultation before services. All prices are starting minimums.

HOURS: Hours are not currently available by this line. Direct the caller to call their preferred location directly for hours.

BOOKING: Callers should contact their preferred location by phone or visit rdsalonandblow.com to get in touch.

GIFT CARDS: Available at rdsalon.square.site

ESCALATION (IMPORTANT):
- If the caller asks to speak with a person, a manager, or staff — ask for their name and best callback number, then let them know someone will call them back shortly. Also offer the direct number for their preferred location.
- If the caller seems frustrated or upset, stay calm, empathize, and offer to have someone call them back.

STAFF CALLBACK CONTACT: [TO BE FILLED IN — add staff email or phone number here when available]`;

// ─── Incoming call: greet the caller ────────────────────────────────────────
app.post("/voice/incoming", (req, res) => {
  const callSid = req.body.CallSid;
  sessions[callSid] = { history: [] };

  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: "speech",
    action: "/voice/respond",
    method: "POST",
    speechTimeout: "auto",
    language: "en-US",
  });

  gather.say(
    { voice: "Polly.Joanna", language: "en-US" },
    "Thank you for calling RD Salon and Blowdry Bar! My name is Maya. How can I help you today?"
  );

  res.type("text/xml");
  res.send(twiml.toString());
});

// ─── Handle caller speech, call Claude, respond ──────────────────────────────
app.post("/voice/respond", async (req, res) => {
  const callSid = req.body.CallSid;
  const speechResult = req.body.SpeechResult || "";

  if (!sessions[callSid]) sessions[callSid] = { history: [] };
  const session = sessions[callSid];

  session.history.push({ role: "user", content: speechResult });

  let replyText = "I'm sorry, I didn't quite catch that. Could you repeat that?";

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: session.history,
    });

    replyText = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim();

    session.history.push({ role: "assistant", content: replyText });
  } catch (err) {
    console.error("Anthropic API error:", err.message);
  }

  const twiml = new VoiceResponse();

  // Check if caller wants to end
  const lowerReply = speechResult.toLowerCase();
  const endPhrases = ["bye", "goodbye", "that's all", "thank you bye", "no thanks", "i'm good"];
  const isEnding = endPhrases.some((p) => lowerReply.includes(p));

  if (isEnding) {
    twiml.say(
      { voice: "Polly.Joanna", language: "en-US" },
      replyText + " Have a wonderful day! Goodbye!"
    );
    twiml.hangup();
    delete sessions[callSid];
  } else {
    const gather = twiml.gather({
      input: "speech",
      action: "/voice/respond",
      method: "POST",
      speechTimeout: "auto",
      language: "en-US",
    });

    gather.say({ voice: "Polly.Joanna", language: "en-US" }, replyText);

    // If caller says nothing, prompt again
    twiml.say(
      { voice: "Polly.Joanna", language: "en-US" },
      "I didn't hear anything. Feel free to call back anytime. Goodbye!"
    );
    twiml.hangup();
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

// ─── Call status callback (cleanup) ─────────────────────────────────────────
app.post("/voice/status", (req, res) => {
  const callSid = req.body.CallSid;
  const status = req.body.CallStatus;
  if (status === "completed" || status === "failed") {
    delete sessions[callSid];
  }
  res.sendStatus(200);
});

// ─── Health check ────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "RD Salon Voice Receptionist" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`RD Salon receptionist running on port ${PORT}`);
});
