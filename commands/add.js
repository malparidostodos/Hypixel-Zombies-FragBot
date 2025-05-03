const fs = require('fs');
const path = require('path');

const { loadUserLanguages } = require('../utils/userLanguageUtils'); // Importa la función para cargar los idiomas de usuario

module.exports = (bot, msg, args, sender, adminList, botsMuted, whitelist, translateOriginal, sendToWebhook, activeParties, currentFs, currentPath, reload, bots) => {
    // Verificar si este bot es el 'helpBot'
    const isHelpBot = bots.some(b => b.username === bot.username && b.helpBot);

    if (!isHelpBot) {
        return; // Si no es el helpBot, no ejecuta el comando
    }

    const userLanguages = loadUserLanguages();
    const userLanguage = userLanguages[sender] || bot.currentLanguage;
    const translate = (key, ...innerArgs) => translateOriginal(userLanguage, key, ...innerArgs);

    // **VERIFICACIÓN DE PARTY (AÑADIDA)**
    const botPartyLeader = Object.keys(activeParties).find(leader => activeParties[leader]?.bots?.some(b => b.username === bot.username));
    const isAllowedSender = botPartyLeader ? activeParties[botPartyLeader]?.bots?.some(b => b.username === sender) || botPartyLeader === sender : true; // Allow if leader or in the party
    // **FIN DE LA VERIFICACIÓN DE PARTY**

    if (!adminList.includes(sender)) {
        bot.chat(`/party chat ${translate("no_permission")}`);
        return;
    }

    if (!args) {
        bot.chat(`/party chat ${translate("add_whitelist_usage")}`);
        return;
    }

    const usernameToAdd = args.trim();
    if (whitelist.includes(usernameToAdd)) {
        bot.chat(`/party chat ${translate("add_whitelist_exists", usernameToAdd)}`);
        return;
    }

    whitelist.push(usernameToAdd);
    try {
        fs.writeFileSync(path.join(__dirname, '../admin/whitelist.json'), JSON.stringify(whitelist, null, 2));
        reload(); // Usamos la función reload pasada como argumento
        bot.chat(`/party chat ${translate("add_whitelist_success", usernameToAdd)}`);
        sendToWebhook(translate("add_whitelist_webhook", sender, usernameToAdd));
    } catch (error) {
        console.error("Error writing to whitelist.json:", error);
        bot.chat(`/party chat ${translate("add_error", error.message)}`);
        sendToWebhook(translate("remove_whitelist_error_webhook", error.message));
    }
};