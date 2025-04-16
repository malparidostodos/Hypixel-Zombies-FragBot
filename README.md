# Hypixel Zombies FragBot

A bot built with [Mineflayer](https://github.com/PrismarineJS/mineflayer) to automate the **Zombies** minigame on Hypixel using multiple Minecraft accounts simultaneously.

## 🚀 Features

- Automatically accepts party invites from a whitelisted user.
- Joins the "Zombies" minigame and leaves after the game starts.
- Tracks how many times each bot has been invited using a local JSON database.
- Sends countdown messages and a randomized "GL" (good luck) message in party chat.
- Automatically sends the bots to limbo after joining the party.
- Uses Microsoft authentication for login.
- Sends notifications to a Discord webhook for each party invitation.

## 📦 Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/malparidostodos/Hypixel-Zombies-FragBot.git
   cd Hypixel-Zombies-FragBot
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure the bot:

   - Add your Microsoft accounts in `accounts.json`:
     ```json
     [
       { "username": "example1@example.com" },
       { "username": "example2@example.com" }
     ]
     ```

   - Add allowed igns (in-game names) in `whitelist.json` (users the bot will accept party invites from):
     ```json
     [
       "IGN1",
       "IGN2"
     ]
     ```

   - Add your Discord webhook URL in `webhook.json`:
     ```json
     {
       "url": "https://discord.com/api/webhooks/..."
     }
     ```

   - (Optional) Edit the file `glMessages.json` to customize the random messages the bot will send when a match starts:
     ```json
     [
       "GL! ^-^",
       "Good luck!",
       "Let's gooo!",
       "GLHF!",
       "Have fun!",
       "We got this!",
       "Time to pop off!",
       "Good luck everyone!",
       "May RNG be with us!",
       "Sending gamer luck ✨"
     ]
     ```

   - Ensure you manually add your bot usernames (exact in-game names) to `invitationCounts.json` like this:
     ```json
     {
       "BotUsername1": 0,
       "BotUsername2": 0
     }
     ```

## ▶️ Usage

Start the bot with:

```bash
npm start
```

The bots will:

- Login to Hypixel.
- Accept party invites from users listed in `whitelist.json`.
- Join the party and the Zombies minigame.
- Send countdown and random GL messages.
- Automatically leave and go to limbo after the game starts.

## 🧠 Tech Stack

- [mineflayer](https://github.com/PrismarineJS/mineflayer) — Bot framework for Minecraft.
- Node.js (v16+ recommended).
- Local JSON-based state tracking.
- Microsoft authentication for bot accounts.

## 📄 License

MIT License.

---

Thanks to ChatGPT for this ReadMe haha
