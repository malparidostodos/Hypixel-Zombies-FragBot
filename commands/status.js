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

    let location = translate("status_lobby");
    if (bot.inLimbo) location = translate("status_limbo");
    else if (bot.joinedGame) location = translate("status_ingame");

    const partyInfo = bot.inParty ? translate("party_in") : translate("party_out");
    bot.chat(`/party chat ${translate("status_command", location, partyInfo)}`);
};