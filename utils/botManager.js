const mineflayer = require("mineflayer");
const whitelist = require("./whitelist.json");
const { url: webhookUrl } = require("./webhook.json");
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

function createBot({ username }, index) {
  const bot = mineflayer.createBot({
    host: "mc.hypixel.net",
    username,
    auth: "microsoft",
    version: "1.8.9"
  });

  const invitationCounts = loadInvitationCounts();

  bot.once("spawn", () => {
    console.log(`[BOT ${index}] Connected as ${bot.username}`);
    bot.chat("/lobby arcade");

    setTimeout(() => {
      console.log(`[BOT ${index}] Timeout: sending to limbo.`);
      bot.chat("/party leave");
      bot.chat("/limbo");
    }, 60000);
  });

  bot.on("chat", (username, message) => {
    if (username === bot.username) return;

    const isWhitelisted = whitelist.includes(username);
    if (!isWhitelisted) return;

    if (message.toLowerCase().includes("inv")) {
      bot.chat(`/party ${username}`);
      bot.whitelistedUser = username;
    }
  });

  bot.on("message", (jsonMsg) => {
    const rawMsg = jsonMsg.toString().replace(/\n/g, " ");
    const msg = rawMsg.toLowerCase();

    if (
      msg.includes("has invited you to join their party!") ||
      (msg.includes("invited") && msg.includes("to the party!"))
    ) {
      const match = rawMsg.match(/(?:\[.*?\] )?(\w+) has invited you to join their party!/);
      if (match && whitelist.includes(match[1])) {
        const inviter = match[1];
        console.log(`[BOT ${index}] Accepting party invite from ${inviter}`);
        bot.chat(`/party accept ${inviter}`);

        if (!invitationCounts[bot.username]) {
          invitationCounts[bot.username] = 0;
        }

        invitationCounts[bot.username]++;

        setTimeout(() => {
          bot.chat(`/party chat Thanks for inviting me! (${invitationCounts[bot.username]})`);
        }, 500);

        // Save the updated count
        saveInvitationCounts(invitationCounts);

        sendToWebhook(`✅ **${bot.username}** was invited to a party by **${inviter}** (direct invite). (${invitationCounts[bot.username]})`);
      }
    }

    if (msg.includes("has invited all members")) {
      const matchGuild = rawMsg.match(/(?:\[.*?\] )?(\w+) has invited all members/i);
      if (matchGuild && whitelist.includes(matchGuild[1])) {
        const inviter = matchGuild[1];
        console.log(`[BOT ${index}] Accepting group party invite from ${inviter}`);
        bot.chat(`/party accept ${inviter}`);

        // Ensure the bot has an invitation count
        if (!invitationCounts[bot.username]) {
          invitationCounts[bot.username] = 0;
        }

        invitationCounts[bot.username]++;

        setTimeout(() => {
          bot.chat(`/party chat Thanks for inviting me! (${invitationCounts[bot.username]})`);
        }, 500);

        saveInvitationCounts(invitationCounts);

        sendToWebhook(`📢 **${bot.username}** was invited to a group party by **${inviter}**. (${invitationCounts[bot.username]})`);
      }
    }

    // Countdown
    if (msg.includes("the game starts in")) {
      const seconds = rawMsg.match(/starts in (\d+) seconds?/i);
      if (seconds) {
        const remaining = parseInt(seconds[1]);
        console.log(`[BOT ${index}] Starts in ${remaining}s`);

        const countdownMessage = remaining === 1 ? 'second' : 'seconds';
        bot.chat(`/pc ${remaining} ${countdownMessage} remaining...`);

        if (remaining === 1) {
          setTimeout(() => {
            console.log(`[BOT ${index}] Sending GL message`);
            const randomMessage = glMessages[Math.floor(Math.random() * glMessages.length)];
            bot.chat(`/party chat ${randomMessage}`);

            setTimeout(() => {
              console.log(`[BOT ${index}] Leaving to limbo`);
              bot.chat("/party leave");
              bot.chat("/limbo");
            }, 1000);
          }, 1000);
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
