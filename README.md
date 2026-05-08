# RD Salon & BlowDry Bar — AI Voice Receptionist

An AI-powered phone receptionist built with Claude + Twilio. When customers call, "Maya" answers, understands their questions, and responds naturally using voice — just like a real receptionist.

---

## What It Does

- Answers incoming calls automatically
- Understands what the caller says (speech-to-text)
- Responds in a natural voice (text-to-speech via Amazon Polly)
- Handles FAQs: services, pricing, locations, booking info
- Escalates to human staff when needed — collects name & callback number
- Remembers context during the call (multi-turn conversation)

---

## Step 1 — Get Your API Keys

### Anthropic API Key
1. Go to https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Copy and save it somewhere safe

### Twilio Account
1. Go to https://www.twilio.com and create a free account
2. From the Twilio Console dashboard, copy your **Account SID** and **Auth Token**
3. Go to Phone Numbers → Buy a Number → search for a local PA area code (570)
4. Buy the number (~$1/month)

---

## Step 2 — Deploy to Railway (Free & Easy)

Railway is the easiest way to host this. No credit card needed for the free tier.

1. Go to https://railway.app and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Upload or push this folder to a GitHub repository first, then connect it
4. Once deployed, Railway gives you a public URL like: `https://your-app.railway.app`

### Set Environment Variables on Railway
In your Railway project settings → Variables, add:
```
ANTHROPIC_API_KEY=your_key_here
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
```

---

## Step 3 — Connect Twilio to Your Server

1. Go to your Twilio Console → Phone Numbers → Manage → Active Numbers
2. Click your phone number
3. Under "Voice Configuration", set:
   - **A call comes in:** Webhook → `https://your-app.railway.app/voice/incoming`
   - **Method:** HTTP POST
4. Save

That's it! The number is now live.

---

## Step 4 — Fill In Missing Details (When Ready)

Open `server.js` and find these two placeholders:

**Hours of operation** — search for:
```
HOURS: Hours are not currently available
```
Replace with actual hours for each location.

**Staff escalation contact** — search for:
```
STAFF CALLBACK CONTACT: [TO BE FILLED IN
```
Replace with the staff phone number or email.

---

## Testing

Call your Twilio number and say something like:
- "What services do you offer?"
- "How much is a haircut?"
- "Where are you located?"
- "I'd like to speak with someone"

---

## File Structure

```
rd-salon-receptionist/
├── server.js          ← Main application (all logic lives here)
├── package.json       ← Dependencies
├── .env.example       ← Environment variable template
├── .gitignore         ← Keeps secrets out of Git
└── README.md          ← This file
```

---

## Cost Estimate (Monthly)

| Service | Cost |
|---|---|
| Twilio phone number | ~$1/month |
| Twilio per-minute voice | ~$0.01–0.02/min |
| Anthropic API (Claude) | ~$0.50–2/month typical usage |
| Railway hosting | Free tier available |
| **Total** | **~$2–5/month** |

---

## Support

Built for RD Salon & BlowDry Bar, Scranton/Clarks Summit PA.
Questions? Reach out to whoever set this up for you!
