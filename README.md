# FragBot Multiclient

A bot built with [Mineflayer](https://github.com/PrismarineJS/mineflayer) to automate the **Zombiesm** minigame on Hypixel, using multiple Minecraft accounts simultaneously.

## Features

- Automatically accepts party invites from a whitelisted user
- Joins the "Zombies" minigame and leaves after the game starts
- Sends messages like countdown and "Good luck" in chat
- Automatically sends the bots to limbo after joining
- Uses Microsoft authentication for account management

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/malparidostodos/Hypixel-Zombies-FragBot.git
   cd hypixel-zombies-fragbot
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Add your account credentials and configuration to `accounts.json`.

4. Start the bot:

   ```bash
   npm start
   ```

## Configuration

Make sure your `accounts.json` file includes the required information for each account:

```json
[
  {
    "email": "example@example.com",
  }
]
```

## License

This project is licensed under the MIT License.