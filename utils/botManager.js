const mineflayer = require("mineflayer");
const fs = require("fs");
const whitelist = require("../whitelist.json");

function createBot({ username }, index) {
  console.log(`[Bot ${index}] Autenticando con ${username}`);

  const bot = mineflayer.createBot({
    host: "mc.hypixel.net",
    username,
    auth: "microsoft",
    version: "1.8.9"
  });

  bot.once("spawn", () => {
    console.log(`[Bot ${index}] Conectado como ${bot.username}`);
    bot.chat("/lobby arcade");

    // Timeout por seguridad
    setTimeout(() => {
      console.log(`[Bot ${index}] Timeout: enviando a limbo.`);
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
    console.log(`[DEBUG] ${rawMsg}`);

    // Invitación directa
    if (
      msg.includes("has invited you to join their party!") ||
      (msg.includes("invited") && msg.includes("to the party!"))
    ) {
      const match = rawMsg.match(/(?:\[.*?\] )?(\w+) has invited you to join their party!/);
      if (match && whitelist.includes(match[1])) {
        console.log(`[Bot ${index}] Aceptando party de ${match[1]}`);
        bot.chat(`/party accept ${match[1]}`);
      }
    }

    // Invitación grupal (guild)
    if (msg.includes("has invited all members")) {
      const matchGuild = rawMsg.match(/(?:\[.*?\] )?(\w+) has invited all members/i);
      if (matchGuild && whitelist.includes(matchGuild[1])) {
        console.log(`[Bot ${index}] Aceptando party grupal de ${matchGuild[1]}`);
        bot.chat(`/party accept ${matchGuild[1]}`);
      }
    }

    if (msg.includes("the game starts in")) {
      const seconds = rawMsg.match(/starts in (\d+) seconds?/i);
      if (seconds) {
        const remaining = parseInt(seconds[1]);
        console.log(`[Bot ${index}] Empieza en ${remaining}s`);
        
        // Modificamos el texto de la cuenta regresiva
        const countdownMessage = remaining === 1 ? 'second' : 'seconds';
        bot.chat(`/pc ${remaining} ${countdownMessage} remaining...`);

        if (remaining === 1) {
          setTimeout(() => {
            console.log(`[Bot ${index}] Esperando 1 segundo antes de enviar "gl!"`);
            
            // Espera 1 segundo antes de enviar "gl!"
            bot.chat("/party chat GL! ^-^");
    
            // Luego espera 500ms para salir al limbo
            setTimeout(() => {
              console.log(`[Bot ${index}] Saliendo al limbo`);
              bot.chat("/party leave");
              bot.chat("/limbo");
            }, 1000); // 500ms después de enviar "gl!"
            
          }, 1000); // 1 segundo después de la cuenta regresiva
        }
      }
    }
  });

  bot.on("kicked", (reason) => {
    console.log(`[Bot ${index}] Expulsado: ${reason}`);
  });

  bot.on("error", (err) => {
    console.error(`[Bot ${index}] Error:`, err);
  });

  return bot;
}

module.exports = {
  createBot,
};
