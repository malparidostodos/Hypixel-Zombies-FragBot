const fs = require("fs");
const path = require("path");
const { createBot } = require("./utils/botManager");

const accounts = require("./bots/accounts.json");

accounts.forEach((account, i) => {
  console.log(`Iniciando bot con la cuenta: ${account.email}`);
  setTimeout(() => {
    createBot(account, i + 1);
  }, i * 5000);
});
