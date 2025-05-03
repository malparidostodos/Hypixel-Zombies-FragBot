const { loadUserLanguages } = require('../utils/userLanguageUtils'); // Importa la función para cargar los idiomas de usuario

module.exports = (bot, msg, args, sender, adminList, botsMuted, whitelist, translateOriginal, sendToWebhook, activeParties, fs, path, reloadConfigs, joinedGame, inLimbo, bots, invitationCounts, gameJoins) => {
    // Verificar si este bot es el 'helpBot'
    const isHelpBot = Array.isArray(bots) && bots.some(b => b.username === bot.username && b.helpBot);

    if (!isHelpBot) {
        return; // Si no es el helpBot, no ejecuta el comando
    }

    const userLanguages = loadUserLanguages();
    const userLanguage = userLanguages[sender] || bot.currentLanguage;
    const translate = (key, ...innerArgs) => translateOriginal(userLanguage, key, ...innerArgs);

    const botPartyLeader = Object.keys(activeParties).find(leader => activeParties[leader]?.bots?.some(b => b.username === bot.username));
    const isAllowedSender = botPartyLeader ? activeParties[botPartyLeader]?.bots?.some(b => b.username === sender) || botPartyLeader === sender : true; // Allow if leader or in the party

    // Opcional: Restringir el comando solo a miembros de la party
    // if (!isAllowedSender) {
    //     console.log(`[STATS] Command denied for ${sender} - not in the same party.`);
    //     bot.chat(`/party chat ${translate("no_permission")}`); // Asegúrate de tener esta traducción
    //     return;
    // }

    const totalInvites = invitationCounts ? Object.values(invitationCounts).reduce((sum, count) => sum + count, 0) : 0;
    const totalGames = gameJoins ? Object.values(gameJoins).reduce((sum, count) => sum + count, 0) : 0;
    const stayStatus = Array.isArray(bots) && bots.length > 0 ? (bots.find(b => b.username === bot.username)?.stayMode ? translate("enabled") : translate("disabled")) : translate("disabled");
    const glStatus = Array.isArray(bots) && bots.length > 0 ? (bots.find(b => b.username === bot.username)?.glEnabled ? translate("enabled") : translate("disabled")) : translate("disabled");

    // Log para depuración: verifica si esta línea se está ejecutando y los valores de las variables
    console.log(`[STATS] Sending stats message in party chat as ${bot.username}: Invites=${totalInvites}, Games=${totalGames}, Stay=${stayStatus}, GL=${glStatus}`);

    bot.chat(`/party chat ${translate("stats_message", totalInvites, totalGames, stayStatus, glStatus)}`);
};