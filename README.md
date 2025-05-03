# Hypixel Bot Manager for Zombies Fragging

This project is a robust multi-account Minecraft bot management system built with [Mineflayer](https://github.com/PrismarineJS/mineflayer) to automate participation in the **Zombies** minigame on Hypixel. Its primary goal is to facilitate efficient "fragging" by allowing bots to quickly join and leave games upon starting.

# IMPORTANT

 At this point the bot has some bugs but it fully complies with its functions and is able to work simultaneously in several parties and its configurations are saved locally in each party.

## 🚀 Key Features

* **Zombies Automation:** Specifically designed for the Zombies minigame on Hypixel.
* **Multi-Bot Management:** Control and coordinate multiple Minecraft bots simultaneously.
* **Smart Invitations:** Automatically accepts party invites from whitelisted users (`whitelist.json`).
* **Automatic Join and Leave:** Bots join the party, enter the Zombies minigame, and automatically leave once the game starts.
* **Invitation Tracking:** Locally records the number of times each bot has been invited in a JSON file (`invitationCounts.json`).
* **Countdown and GL Messages:** Sends countdown messages and a randomized "Good Luck" (GL) message in the party chat before the game begins.
* **Automatic Limbo Sending:** After joining the party, bots are automatically sent to `/limbo`.
* **Microsoft Authentication:** Uses Microsoft authentication to log in to Minecraft accounts.
* **Discord Webhook Notifications:** Sends notifications to a Discord webhook whenever a bot is invited to a party.
* **Language Support:** Text interface with support for multiple languages via translation files (`translations.json`).
* **"Stay" Mode:** Option for bots to remain in the party after a game (configurable via command).
* **Persistent State:** Bot configurations (stay mode, GL enabled/disabled, language) are saved and restored between restarts (`botStates.json`).
* **Command System:** Authorized users can execute commands in the party chat to interact with the bots (see the Commands section).
* **Automatic Responses:** Bots can automatically respond to predefined messages (`autoResponses.json`).
* **Real-time Configuration Reload:** Configuration files (whitelist, admins, messages, translations) can be reloaded without restarting the bot.
* **Designated "Help Bot":** The first bot to join a party is designated as the "help bot" and handles command responses.
* **Basic Spam Detection:** Bots can warn about repetitive messages in the party chat.

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/malparidostodos/Hypixel-Zombies-FragBot.git](https://github.com/malparidostodos/Hypixel-Zombies-FragBot.git)
    cd Hypixel-Zombies-FragBot
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure the bot:**

    Let's dive into the configuration treasure map! 🛠️

    ```
    Hypixel-Zombies-Fragbot/
    ├── admin/
    │   ├── admin.json             # Admin list - Used for admin commands, example: Add, remove, stay...
    │   └── whitelist.json         # Allowed users to invite your bots.
    │                              # Add their Minecraft usernames here, they are the chosen ones!
    │                              # Example: ["ProGamer", "BotMaster"].
    ├── bots/
    │   ├── accounts.json          # Your bots' secret identities! (Microsoft account info).
    │   │                          # Enter your bot usernames here. They're like their passports!
    │   │                          # Example: [{"username": "bot_frag1@outlook.com"}, {"username": "zombie_slayer@live.com"}].
    │   ├── botStates.json         # Bots' memory bank! (Persistent state: stayMode, GL, language...).
    │   │                          # This file updates automatically, don't touch it initially! It saves their preferences.
    │   └── invitationCounts.json  # Popularity contest! (How many times each bot was invited).
    │                              # You don't need to add your bots manually, they will be added automatically.
    │                              # Example: {"BotNinja1": 0, "FragMaster2000": 0}.
    ├── commands/
    │   ├── unused/                # The graveyard of ideas! (I didn't add them because they are half-finished yk...).
    │   │                          #
    │   │                          # Default prefix is ! and u can edit manually in botmanager.js
    │   ├── add.js (Admin)         # !add - Add a player to the whitelist.
    │   ├── bots.js                # !bots - Shows bot statuses.
    │   ├── help.js                # !help - List of available commands and their desc.
    │   ├── lang.js                # !lang <en|es> - Changes bot's language and saves the preferences in local database (BETA).
    │   ├── reload.js (Admin)      # !reload - Emergency reload! (Re-reads config without restarting).
    │   ├── remove.js (Admin)      # !remove - Remove an existing player from the whitelist.
    │   ├── resetinvites.js (Admin)# !resetinvites - Resets the invitation counter.
    │   ├── say.js                 # !say - Makes the leader bot say something.
    │   ├── stats.js               # !stats - Shows bot statistics.
    │   ├── status.js              # !status - Shows location and party status).
    │   └── stay.js (Admin)        # !stay <on|off> - Toggles whether the bots stay in game or leave after it starts).
    ├── data/
    │   ├── autoResponses.json     # Auto-reply system (NOT WORKING).
    │   ├── glMessages.json        # Customizable "Good Luck" messages at the start.
    │   │                          # Edit these phrases to add your flair. Let the good vibes roll!
    │   │                          # Example: ["Let's rock!", "May luck be with you!", "GG WP!"].
    │   ├── translations.json      # Polyglot bot! (Translations for different languages).
    │   │                          # Here are all the phrases in various languages. Expand the vocabulary!
    │   ├── userLanguages.json     # Language preferences database.
    │   └── webhook.json           # The Discord megaphone (URLs to send notifications).
    │                              # Paste your webhook URLs here so Discord knows everything.
    │                              # Example: {"url": "https://discord.com/api/webhooks/...", "dmUrl": "https://discord.com/api/webhooks/..."}.
    ├── utils/
    │   ├──botManager.js           # The main brain (Core logic for bot management).
    │   └── userLanguageUtils.js   # Linguistic tools! (Functions to handle languages).
    │ 
    ├── index.js                   # The power button! (Main entry point of the application).
    └── package.json               # Project inventory! (Dependencies and scripts).
    ```

    All you need to modify is in the files `admin/` and `data/` folders to configure permissions, your bot accounts, messages, and Discord connections. 
    DON'T forget to check out `bots/accounts.json` to get everything started in order!

## ▶️ Usage

Start the bot with the following command:

```bash
npm start
```

The bots will:

* Log in to Hypixel.
* Accept party invites from users listed in `whitelist.json`.
* Join the party and the Zombies minigame.
* Send countdown and random GL messages.
* Automatically leave the party and go to limbo after the game starts (unless "stay" mode is enabled).

## ⚙️ Commands

The following commands can be used in the party chat by authorized users (and the bot designated as the command leader):

* `!help`: Shows the list of available commands.
* `!add <bot name>`: Attempts to invite the specified bot to the party.
* `!remove <bot name>`: Attempts to kick the specified bot from the party.
* `!bots`: Lists the bots currently in the party.
* `!say <message>`: Makes the leader bot say the specified message in the party chat.
* `!resetinvites <bot name>`: Resets the invitation counter for the specified bot.
* `!reload`: Reloads the configuration files (whitelist, admins, messages, translations).
* `!stats <bot name>`: Shows statistics for the specified bot (if implemented in the command).
* `!lang <language code>`: Changes the leader bot's language to the specified code (e.g., `en`, `es`).
* `!stay <on|off>`: Toggles the "stay" mode for the leader bot.
* `!status`: (Private DM command) Shows the current status of the bot receiving the message.

## 🧠 Tech Stack

* [mineflayer](https://github.com/PrismarineJS/mineflayer) — Bot framework for Minecraft.
* Node.js (v16+ recommended).
* Local JSON-based state tracking.
* Microsoft authentication for bot accounts.

## 📄 License

MIT License.

---

Thanks to Gemini AI for this ReadMe help and many other features haha
```