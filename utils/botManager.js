const mineflayer = require("mineflayer");
const whitelist = require("./whitelist.json");
const { url: webhookUrl, dmUrl } = require("./webhook.json");
const https = require("https");
const fs = require("fs");
const path = require("path");
const glMessages = require("./glMessages.json");

const invitationCountsPath = path.join(__dirname, 'invitationCounts.json');

function loadInvitationCounts() {
  try {
    if (!fs.existsSync(invitationCountsPath)) {
      fs.writeFileSync(invitationCountsPath, JSON.stringify({}));
      console.log("Invitation counts file not found, creating a new one.");
    }
    const data = fs.readFileSync(invitationCountsPath);
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading the invitation counts file:", error);
    return {};
  }
}

function saveInvitationCounts(counts) {
  try {
    fs.writeFileSync(invitationCountsPath, JSON.stringify(counts, null, 2));
  } catch (error) {
    console.error("Error saving the invitation counts file:", error);
  }
}

function sendToDMWebhook(content) {
  const data = JSON.stringify({ content });

  const req = https.request(dmUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  }, (res) => {
    console.log(`[DM WEBHOOK] Status code: ${res.statusCode}`);
    res.on("data", d => process.stdout.write(d));
  });

  req.on("error", (error) => {
    console.error("[DM WEBHOOK] Error:", error);
  });

  req.write(data);
  req.end();
}

const inviteMessages = [
  "Thanks for the invite!",
  "Appreciate the invite!",
  "Glad to join!",
  "Let's go!",
  "Thanks for the party!",
  "Hyped to play!",
  "Party time!",
  "Excited to be here!",
  "Yay, thanks!",
  "Happy to join!"
];

function sendToWebhook(content) {
  const data = JSON.stringify({ content });

  const req = https.request(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  }, (res) => {
    console.log(`[WEBHOOK] Status code: ${res.statusCode}`);
    res.on("data", d => process.stdout.write(d));
  });

  req.on("error", (error) => {
    console.error("[WEBHOOK] Error:", error);
  });

  req.write(data);
  req.end();
}

const bots = [];

function assignHelpBot() {
  const availableBots = bots.filter(bot => bot.inParty);
  if (availableBots.length > 0 && !bots.some(bot => bot.helpBot)) {
    availableBots[0].helpBot = true;
    console.log(`[HELP BOT] ${availableBots[0].username} is now the help bot.`);
    availableBots[0].chat("/party chat 🎤 I'm now responding to commands.");
  }
}

// ... Mantén el resto de imports como estaban arriba

function createBot({ username }, index) {
  const bot = mineflayer.createBot({
    host: "mc.hypixel.net",
    username,
    auth: "microsoft",
    version: "1.8.9"
  });

  bots.push(bot);

  const invitationCounts = loadInvitationCounts();
  bot.stayMode = false;
  let joinedGame = false;
  let inLimbo = false;
  bot.inParty = false;
  bot.helpBot = false;
  bot.glEnabled = true;

  bot.once("spawn", () => {
    console.log(`[BOT ${index}] Connected as ${bot.username}`);
    bot.chat("/lobby arcade");

    setTimeout(() => {
      if (!bot.stayMode && !joinedGame) {
        console.log(`[BOT ${index}] Timeout reached, sending to limbo.`);
        bot.chat("/party leave");
        bot.chat("/limbo");
        inLimbo = true;
      }
    }, 60000);
  });

  bot.on("message", (jsonMsg) => {
    const raw = jsonMsg.toString().replace(/\n/g, " ");
    const msg = raw.toLowerCase();

    // Detect guild invites
    if (msg.includes("has invited all members")) {
      const matchGuild = raw.match(/(?:\[.*?\] )?(\w+) has invited all members/i);
      if (matchGuild && whitelist.includes(matchGuild[1])) {
        const inviter = matchGuild[1];
        console.log(`[BOT ${index}] Accepting guild party invite from ${inviter}`);
        bot.chat(`/party accept ${inviter}`);
        bot.inParty = true;
        joinedGame = false;
        inLimbo = false;

        invitationCounts[bot.username] = (invitationCounts[bot.username] || 0) + 1;
        saveInvitationCounts(invitationCounts);

        const delay = Math.floor(Math.random() * 1000) + 500; // 500ms - 1500ms
        setTimeout(() => {
          if (bot.inParty) {
            const randomMessage = inviteMessages[Math.floor(Math.random() * inviteMessages.length)];
            bot.chat(`/party chat ${randomMessage} (${invitationCounts[bot.username]})`);
          }
        }, delay);

        sendToWebhook(`✅ **${bot.username}** accepted guild party invite from **${inviter}**. (${invitationCounts[bot.username]})`);
        assignHelpBot();
      } else {
        console.log(`[BOT ${index}] Ignored guild invite from non-whitelisted user`);
      }
    }

    if (msg.includes("you left the party.") || msg.includes("has disbanded the party!")) {
      bot.inParty = false;
      if (bot.helpBot) {
        bot.helpBot = false;
        console.log(`[BOT ${index}] Help bot removed, reassigning...`);
        assignHelpBot();
      }
    }

    if (msg.includes("has joined") && msg.includes(bot.username.toLowerCase())) {
      joinedGame = true;
      inLimbo = false;
      console.log(`[BOT ${index}] Joined game confirmed by message.`);
    }

    if (msg.includes("you have joined") && msg.includes("party")) {
      bot.inParty = true;
      assignHelpBot();
    }

    if (msg.includes("summoned you to their server")) {
      joinedGame = true;
      inLimbo = false;
    }

    if (msg.includes("we couldn't find a server")) {
      joinedGame = false;
      inLimbo = true;
    }

    // GAME STARTS
    if (msg.includes("the game starts in")) {
      const match = raw.match(/starts in (\d+) seconds?/i);
      if (match) {
        const seconds = parseInt(match[1]);
    
        if (bot.helpBot) {
          // Verifica si quedan 1 segundo o más
          const timeMessage = seconds === 1 ? `${seconds} second remaining...` : `${seconds} seconds remaining...`;
          bot.chat(`/pc ${timeMessage}`);
        }

        if (seconds === 1) {
          setTimeout(() => {
            if (bot.glEnabled) {
              const delay = Math.floor(Math.random() * 500); // hasta 500ms de diferencia
              setTimeout(() => {
                const randomMessage = glMessages[Math.floor(Math.random() * glMessages.length)];
                bot.chat(`/party chat ${randomMessage}`);
              }, delay);
            }
        
            setTimeout(() => {
              if (!bot.stayMode) {
                bot.chat("/party leave");
                bot.chat("/limbo");
                bot.inParty = false;
                inLimbo = true;
              } else {
                bot.chat("/lobby");
                joinedGame = false;
              }
            }, 1000);
          }, 1000);
        }        
      }
    }

    // Direct invite
    const inviteMatch = raw.match(/(?:\[.*?\] )?(\w+) has invited you to join their party!/);
    if (inviteMatch) {
      const inviter = inviteMatch[1];
      if (!whitelist.includes(inviter)) return;

      if (bot.inParty) {
        let location = "lobby";
        if (joinedGame) location = "in a game";
        else if (inLimbo) location = "limbo";

        let message = joinedGame
          ? "I'm currently in a game waiting to start. Please try again later."
          : `I'm already in a party in the ${location}, waiting to start a game. Please try again later.`;

        bot.chat(`/msg ${inviter} ${message}`);
        return;
      }

      console.log(`[BOT ${index}] Accepting invite from ${inviter}`);
      bot.chat(`/party accept ${inviter}`);
      bot.inParty = true;
      joinedGame = false;
      inLimbo = false;

      invitationCounts[bot.username] = (invitationCounts[bot.username] || 0) + 1;
      saveInvitationCounts(invitationCounts);

      const delay = Math.floor(Math.random() * 1000) + 500; // 500ms - 1500ms
      setTimeout(() => {
        if (bot.inParty) {
          const randomMessage = inviteMessages[Math.floor(Math.random() * inviteMessages.length)];
          bot.chat(`/party chat ${randomMessage} (${invitationCounts[bot.username]})`);
        }
      }, delay);

      sendToWebhook(`✅ **${bot.username}** was invited by **${inviter}**. (${invitationCounts[bot.username]})`);
      assignHelpBot();
    }

    // Private message
    const dmMatch = raw.match(/^From (?:\[.*?\] )?(\w+): (.+)/);
    if (dmMatch) {
      const sender = dmMatch[1];
      const content = dmMatch[2].trim();

      if (whitelist.includes(sender) && ["status", "!status"].includes(content.toLowerCase())) {
        let locationStatus = "🟢 In lobby";
        if (joinedGame) locationStatus = "🎮 In a game";
        else if (inLimbo) locationStatus = "💤 In limbo";

        const partyStatus = bot.inParty ? "In party" : "Not in party";
        bot.chat(`/msg ${sender} ${locationStatus} (${partyStatus})`);
      }

      sendToDMWebhook(`📨 **${sender} ➜ ${bot.username}**: ${content}`);
    }

    // Party chat commands
    const partyChatMatch = raw.match(/Party > (?:\[.*?\] )?(\w+): (.+)/);
    if (partyChatMatch) {
      const sender = partyChatMatch[1];
      const content = partyChatMatch[2].trim();

      if (content.startsWith("!")) {
        const command = content.toLowerCase();
        if (!bot.helpBot) return;

        switch (command) {
          case "!help":
            bot.chat("/party chat Commands: !help - !status - !stay - !gl");
            break;

          case "!status":
            let location = "Lobby";
            if (inLimbo) location = "Limbo";
            else if (joinedGame) location = "In game";

            const partyInfo = bot.inParty ? "(In party)" : "(No party)";
            bot.chat(`/party chat Status: ${location} ${partyInfo}`);
            break;

          case "!stay":
            const newStay = !bot.stayMode;
            bots.forEach(b => b.stayMode = newStay);
            bot.chat(`/party chat 🧷 Stay mode: ${newStay ? "Enabled" : "Disabled"}`);
            break;

          case "!gl":
            const newStatus = !bot.glEnabled;
            bots.forEach(b => b.glEnabled = newStatus);
            bot.chat(`/party chat 🍀 Good luck messages: ${newStatus ? "Enabled" : "Disabled"}`);
            break;

          default:
            bot.chat("/party chat ❓ Unknown command. Type !help");
        }
      }
    }
  });

  bot.on("kicked", (reason) => {
    console.log(`[BOT ${index}] Kicked: ${reason}`);
  });

  bot.on("error", (err) => {
    console.error(`[BOT ${index}] Error:`, err);
  });

  return bot;
}

module.exports = {
  createBot,
};
