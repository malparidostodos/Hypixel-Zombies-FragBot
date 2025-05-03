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

    const botPartyLeader = Object.keys(activeParties).find(leader => activeParties[leader]?.bots?.some(b => b.username === bot.username));
    const isAllowedSender = botPartyLeader ? activeParties[botPartyLeader]?.bots?.some(b => b.username === sender) || botPartyLeader === sender : true; // Allow if leader or in the party

    if (!adminList.includes(sender)) {
        bot.chat(`/party chat ${translate("no_permission")}`);
        return;
    }

    const nameToRemove = args ? args.trim() : null;
    if (nameToRemove) {
        const index = whitelist.indexOf(nameToRemove);
        if (index > -1) {
            whitelist.splice(index, 1);
            try {
                fs.writeFileSync(path.join(__dirname, '../admin/whitelist.json'), JSON.stringify(whitelist, null, 2));
                reload(); // Usamos la función reload pasada como argumento
                bot.chat(`/party chat ${translate("remove_whitelist_success", nameToRemove)}`);
                sendToWebhook(translate("remove_whitelist_webhook", sender, nameToRemove));
            } catch (error) {
                console.error("Error writing to whitelist.json:", error);
                bot.chat(`/party chat ${translate("remove_whitelist_error", nameToRemove, error.message)}`);
                sendToWebhook(translate("remove_whitelist_error_webhook", error.message)); // More specific webhook message
            }
        } else {
            bot.chat(`/party chat ${translate("remove_whitelist_not_exists", nameToRemove)}`);
        }
    } else {
        bot.chat(`/party chat ${translate("remove_whitelist_usage")}`);
    }
};