# Hypixel Zombies FragBot

<p align="center">
  Need help? Add me on Discord: 123johan
</p>

A bot built with [Mineflayer](https://github.com/PrismarineJS/mineflayer) to automate the **Zombies** minigame on Hypixel using multiple Minecraft accounts simultaneously.

## 🚀 Features

- Automatically accepts party invites from a whitelisted user.
- Joins the "Zombies" minigame and leaves after the game starts.
- Tracks how many times each bot has been invited using a local JSON database.
- Sends countdown messages and a randomized "GL" (good luck) message in party chat.
- Automatically sends the bots to limbo after joining the party.
- Uses Microsoft authentication for login.
- Sends notifications to a Discord webhook for each party invitation.

<div align="center">
  <img src="https://cdn.discordapp.com/attachments/844689737410281484/1361961123984965812/image.png?ex=6800a8a3&is=67ff5723&hm=525608550a8bd70a1d8308d1ff52b6cd37bc73cd60b56ef1dcde94c69f6d2761&" alt="Preview 1" width="45%" style="margin: 10px; border-radius: 12px;" />
  <img src="https://cdn.discordapp.com/attachments/844689737410281484/1361964214419197963/image.png?ex=6800ab84&is=67ff5a04&hm=7fc462ff507edfeb5e192218503382ddbe472c5264bc3466afe26dc06aa833d5&" alt="Preview 2" width="45%" style="margin: 10px; border-radius: 12px;" />
  <img src="https://cdn.discordapp.com/attachments/844689737410281484/1361968245187411978/dc2.png?ex=6800af45&is=67ff5dc5&hm=8bf06fb24ccb3291bfa1e8fb989a497d17875bcadaa3eabc18a6a3c0338f54c3&" alt="Preview 2" width="45%" style="margin: 10px; border-radius: 12px;" />
  <img src="https://cdn.discordapp.com/attachments/844689737410281484/1361968433612460143/image.png?ex=6800af72&is=67ff5df2&hm=253b7f944c0b9f0f27560704931973754a982d07d29bf2a1781aae9a20c14360&" alt="Preview 2" width="45%" style="margin: 10px; border-radius: 12px;" />
</div>

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

   - Add your Microsoft accounts in `utils/accounts.json`:
     ```json
     [
       { 
         "username": "example1@example.com" 
       },
       { 
         "username": "example2@example.com" 
       }
     ]
     ```

   - Add allowed igns (in-game names) in `utils/whitelist.json` (users the bot will accept party invites from):
     ```json
     [
       "IGN1",
       "IGN2"
     ]
     ```

   - Add your Discord webhook URL in `utils/webhook.json`:
     ```json
     {
       "url": "https://discord.com/api/webhooks/..."
     }
     ```

   - (Optional) Edit the file `utils/glMessages.json` to customize the random messages the bot will send when a match starts:
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

   - Ensure you manually add your bot usernames (exact in-game names) to `utils/invitationCounts.json` like this:
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

> ℹ️ The first time you run the bot, each account will prompt you to log in with a Microsoft authentication code. Open the link provided in the console and enter the code to authorize the account. The bot won't work until this step is completed.

At this points you can play.

## 📄 License

MIT License.

---

Thanks to ChatGPT for this ReadMe haha
