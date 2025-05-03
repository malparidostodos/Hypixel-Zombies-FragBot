let activeParties = {};
const { createBot } = require('./utils/botManager');
const accounts = require('./bots/accounts.json');

accounts.forEach((account, i) => {
    setTimeout(() => {
        createBot(account, i + 1, activeParties);
    }, i * 5000);
});