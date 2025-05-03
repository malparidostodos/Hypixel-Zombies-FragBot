const { loadUserLanguages } = require('../utils/userLanguageUtils'); // Importa la función para cargar los idiomas de usuario

module.exports = (bot, msg, args, sender, adminList, botsMuted, whitelist, translateOriginal, sendToWebhook, activeParties, fs, path, reloadConfigs, bots) => {
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

    if (!bots || bots.length === 0) {
        bot.chat(`/party chat ${translate("no_bots_online")}`);
        return;
    }

    let newStay;

    if (args === 'on') {
        newStay = true;
        bots.forEach(b => b.stayMode = true);
        bot.chat(`/party chat ${translate("stay_enabled_all")}`);
    } else if (args === 'off') {
        newStay = false;
        bots.forEach(b => b.stayMode = false);
        bot.chat(`/party chat ${translate("stay_disabled_all")}`);
    } else {
        // Si no se especifica 'on' u 'off', simplemente toggle el estado del primer bot (y lo aplica a todos)
        newStay = !bots[0]?.stayMode;
        bots.forEach(b => b.stayMode = newStay);
        bot.chat(`/party chat ${translate("stay_mode_command", newStay ? translate("enabled") : translate("disabled"))}`);
    }
};