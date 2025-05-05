const mineflayer = require("mineflayer");
const whitelist = require("../admin/whitelist.json");
const adminList = require("../admin/admin.json");
const { url: webhookUrl, dmUrl } = require("../data/webhook.json");
const https = require("https");
const fs = require("fs");
const path = require("path");
const glMessages = require("../data/glMessages.json");
const autoResponses = require("../data/autoResponses.json");
const translations = require("../data/translations.json");
const { loadUserLanguages, saveUserLanguages } = require('../utils/userLanguageUtils');
const userLanguages = loadUserLanguages();

const invitationCountsPath = path.join(__dirname, '../bots/invitationCounts.json');
const botStatesPath = path.join(__dirname, '../bots/botStates.json');

const commandLeaders = {};
const commandLeaderTimeout = 2000;

let bots = [];
let gameJoins = {};
const botInviters = {};
let botsMuted = false;
const activeParties = {};

const commandHandlers = {
    "!help": { module: require('../commands/help'), needsLeader: true },
    "!add": { module: require('../commands/add'), needsLeader: true },
    "!remove": { module: require('../commands/remove'), needsLeader: true },
    "!bots": { module: require('../commands/bots'), needsLeader: true },
    "!say": { module: require('../commands/say'), needsLeader: true },
    "!resetinvites": { module: require('../commands/resetinvites'), needsLeader: true },
    "!reload": { module: require('../commands/reload'), needsLeader: true },
    "!stats": { module: require('../commands/stats'), needsLeader: true },
    "!lang": { module: require('../commands/lang'), needsLeader: true },
    "!stay": { module: require('../commands/stay'), needsLeader: true },
    "!status": { module: require('../commands/status'), needsLeader: false },
};

const inviteCooldowns = {};
const inviteCooldownDuration = 60000;

function loadBotStates() {
    try {
        if (fs.existsSync(botStatesPath)) {
            const data = fs.readFileSync(botStatesPath);
            return JSON.parse(data);
        }
        return {};
    } catch (error) {
        console.error("Error reading bot states file:", error);
        return {};
    }
}

function saveBotStates(states) {
    try {
        const statesToSave = {};
        bots.forEach(bot => {
            statesToSave[bot.username] = {
                stayMode: bot.stayMode,
                glEnabled: bot.glEnabled,
                language: bot.currentLanguage,
                helpBot: bot.helpBot
            };
        });
        fs.writeFileSync(botStatesPath, JSON.stringify(statesToSave, null, 2));
    } catch (error) {
        console.error("Error saving bot states file:", error);
    }
}

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

function reloadConfigs() {
    try {
        delete require.cache[require.resolve('../admin/whitelist.json')];
        delete require.cache[require.resolve('../admin/admin.json')];
        delete require.cache[require.resolve('../data/glMessages.json')];
        delete require.cache[require.resolve('../data/translations.json')];
        const newWhitelist = require('../admin/whitelist.json');
        const newAdminList = require('../admin/admin.json');
        const newGlMessages = require('../data/glMessages.json');
        const newTranslations = require('../data/translations.json');

        whitelist.length = 0;
        whitelist.push(...newWhitelist);
        adminList.length = 0;
        adminList.push(...newAdminList);
        glMessages.length = 0;
        glMessages.push(...newGlMessages);

        for (const key in translations) {
            delete translations[key];
        }
        Object.assign(translations, newTranslations);

        console.log("[CONFIG] Reloaded whitelist, admin list, GL messages, and translations.");
        return true;
    } catch (error) {
        console.error("[CONFIG] Error reloading configurations:", error);
        return false;
    }
}

function translate(lang, key, ...args) {
    const languageData = translations[lang] || translations['en'];
    let translated = languageData[key] || key;
    args.forEach((arg, index) => {
        translated = translated.replace(new RegExp(`%${index + 1}`, 'g'), arg);
    });
    return translated;
}

function canInviteBot(botUsername, invitingUser) {
    if (inviteCooldowns[botUsername] &&
        inviteCooldowns[botUsername].lastInviter !== invitingUser &&
        Date.now() - inviteCooldowns[botUsername].timestamp < inviteCooldownDuration) {
        return false;
    }
    return true;
}

function createBot({ username, language = 'en' }, index, activePartiesRef) {
    const bot = mineflayer.createBot({
        host: "mc.hypixel.net",
        username,
        auth: "microsoft",
        version: "1.8.9"
    });

    bots.push(bot);
    gameJoins[username] = 0;

    const invitationCounts = loadInvitationCounts();
    const botStates = loadBotStates();

    bot.activeParties = activePartiesRef;
    bot.stayMode = botStates[username]?.stayMode || false;
    bot.glEnabled = botStates[username]?.glEnabled || true;
    bot.inParty = false;
    bot.helpBot = botStates[username]?.helpBot || false;
    bot.currentLanguage = language;
    bot.invitedBy = null;
    bot.muted = false;
    bot.joinedGame = false;
    bot.inLimbo = false;
    bot.isDesignatedHelpBot = false;

    let initialLimboTimeout;
    let lastInviteTime = Date.now();
    const inactivityThreshold = 300000;

    bot.once("spawn", () => {
        console.log(`[BOT ${index}] Connected as ${bot.username}`);
        bot.chat("/lobby arcade");

        initialLimboTimeout = setTimeout(() => {
            if (!bot.stayMode && !bot.joinedGame) {
                console.log(`[BOT ${index}] Timeout reached, sending to limbo.`);
                bot.chat("/party leave");
                bot.chat("/limbo");
                bot.inLimbo = true;
            }
        }, 60000);
    });

    setInterval(() => {
        if (bot.inParty && Date.now() - lastInviteTime > inactivityThreshold) {
            sendToWebhook(`⚠️ **${bot.username}** hasn't received an invite in a while. Possible inactivity.`);
        }
    }, 300000);

    bot.on("message", (jsonMsg) => {
        const raw = jsonMsg.toString().replace(/\n/g, " ");
        const msg = raw.toLowerCase();
        const partyChatMatch = raw.match(/^Party > (?:\[.*?\] )?(\w+): (.+)/);
        let sender = null;
        if (partyChatMatch) {
            sender = partyChatMatch[1];
        } else {
            const directMatch = raw.match(/^(?:\[.*?\] )?(\w+):/);
            sender = directMatch ? directMatch[1] : null;
        }

        if (msg.includes("has disbanded the party!") || msg.includes("you have been kicked from the party by")) {
            console.log(`[BOT ${index}] Party ended (disbanded or kicked), resetting inParty state.`);
            bot.inParty = false;
            if (bot.invitedBy && activeParties[bot.invitedBy]) {
                delete activeParties[bot.invitedBy];
            }
            bot.invitedBy = null;
        }

        if (msg.includes("has invited all members")) {
            const matchGuild = raw.match(/(?:\[.*?\] )?(\w+) has invited all members/i);
            if (matchGuild && whitelist.includes(matchGuild[1])) {
                const inviter = matchGuild[1];
                bot.invitedBy = inviter;
                console.log(`[BOT ${index}] Accepting guild party invite from ${inviter}`);
                bot.chat(`/party accept ${inviter}`);
                bot.inParty = true;
                bot.joinedGame = false;
                bot.inLimbo = false;
                lastInviteTime = Date.now();

                if (!activeParties[inviter]) {
                    activeParties[inviter] = { bots: [], helpBotAssigned: false };
                }
                if (!activeParties[inviter].bots.some(b => b.username === bot.username)) {
                    activeParties[inviter].bots.push({ username: bot.username, joinedAt: Date.now() });
                }

                invitationCounts[bot.username] = (invitationCounts[bot.username] || 0) + 1;
                saveInvitationCounts(invitationCounts);

                const delay = Math.floor(Math.random() * 1000) + 500;
                setTimeout(() => {
                    if (bot.inParty && !bot.muted) {
                        const totalInvites = invitationCounts[bot.username] || 0;
                        const stayStatus = bot.stayMode ? translate(bot.currentLanguage, "enabled") : translate(bot.currentLanguage, "disabled");
                        const glStatus = bot.glEnabled ? translate(bot.currentLanguage, "enabled") : translate(bot.currentLanguage, "disabled");
                        const partyJoinMessage = translate(bot.currentLanguage, "party_join_message", totalInvites, Object.values(gameJoins).reduce((sum, count) => sum + count, 0), stayStatus, glStatus);
                        bot.chat(`/party chat ${partyJoinMessage}`);
                        sendToWebhook(`🎉 **${bot.username}** joined the party of **${inviter}**. INFO: Invites: ${totalInvites} - Games: ${Object.values(gameJoins).reduce((sum, count) => sum + count, 0)} - Stay: ${stayStatus} - GL: ${glStatus}`);
                    } else if (bot.inParty && bot.muted) {
                        sendToWebhook(`🎉 **${bot.username}** joined the party of **${inviter}** (bots muted). INFO: Invites: ${invitationCounts[bot.username] || 0} - Games: ${Object.values(gameJoins).reduce((sum, count) => sum + count, 0)} - Stay: ${bot.stayMode ? translate(bot.currentLanguage, "enabled") : translate(bot.currentLanguage, "disabled")} - GL: ${bot.glEnabled ? translate(bot.currentLanguage, "enabled") : translate(bot.currentLanguage, "disabled")}`);
                    }
                    setTimeout(() => {
                        if (bot.inParty && bot.invitedBy === inviter && !activeParties[inviter].helpBotAssigned) {
                            const partyBots = activeParties[inviter].bots;
                            partyBots.sort((a, b) => a.joinedAt - b.joinedAt);
                            if (partyBots.length > 0 && partyBots[0].username === bot.username && !bot.isDesignatedHelpBot) {
                                bot.helpBot = true;
                                bot.isDesignatedHelpBot = true;
                                activeParties[inviter].helpBotAssigned = true;
                                activeParties[inviter].helpBot = bot.username;
                                console.log(`[HELP BOT] (TIMEOUT) ${bot.username} is now the help bot for party of ${inviter}.`);
                                bot.chat("/party chat 🎤 I'm now responding to commands.");
                            } else if (bot.inParty && !bot.isDesignatedHelpBot && !activeParties[inviter].helpBotAssigned) {
                                bot.helpBot = false;
                            }
                        }
                    }, 2000);
                }, delay);
            }
        }

        if (msg.includes("you have joined") && msg.includes("party")) {
            const joinedMatch = raw.match(/You have joined (\w+)'s party!/);
            if (joinedMatch) {
                const inviter = joinedMatch[1];
                bot.invitedBy = inviter;
                bot.inParty = true;
                bot.joinedGame = false;
                bot.inLimbo = false;
                const totalInvites = invitationCounts[bot.username] || 0;
                const stayStatus = bot.stayMode ? translate(bot.currentLanguage, "enabled") : translate(bot.currentLanguage, "disabled");
                const glStatus = bot.glEnabled ? translate(bot.currentLanguage, "enabled") : translate(bot.currentLanguage, "disabled");
                if (!bot.muted) {
                    const partyJoinMessage = translate(bot.currentLanguage, "party_join_message", totalInvites, Object.values(gameJoins).reduce((sum, count) => sum + count, 0), stayStatus, glStatus);
                    bot.chat(`/party chat ${partyJoinMessage}`);
                    sendToWebhook(`🎉 **${bot.username}** joined the party of **${inviter}**. INFO: Invites: ${totalInvites} - Games: ${Object.values(gameJoins).reduce((sum, count) => sum + count, 0)} - Stay: ${stayStatus} - GL: ${glStatus}`);
                } else {
                    sendToWebhook(`🎉 **${bot.username}** joined the party of **${inviter}** (bots muted). INFO: Invites: ${totalInvites} - Games: ${Object.values(gameJoins).reduce((sum, count) => sum + count, 0)} - Stay: ${stayStatus} - GL: ${glStatus}`);
                }

                if (!activeParties[inviter]) {
                    activeParties[inviter] = { bots: [], helpBotAssigned: false };
                }
                if (!activeParties[inviter].bots.some(b => b.username === bot.username)) {
                    activeParties[inviter].bots.push({ username: bot.username, joinedAt: Date.now() });
                }

                setTimeout(() => {
                    if (bot.inParty && bot.invitedBy === inviter && !activeParties[inviter].helpBotAssigned) {
                        const partyBots = activeParties[inviter].bots;
                        partyBots.sort((a, b) => a.joinedAt - b.joinedAt);
                        if (partyBots.length > 0 && partyBots[0].username === bot.username && !bot.isDesignatedHelpBot) {
                            bot.helpBot = true;
                            bot.isDesignatedHelpBot = true;
                            activeParties[inviter].helpBotAssigned = true;
                            activeParties[inviter].helpBot = bot.username;
                            console.log(`[HELP BOT] (TIMEOUT) ${bot.username} is now the help bot for party of ${inviter}.`);
                            bot.chat("/party chat 🎤 I'm now responding to commands.");
                        } else if (bot.inParty && !bot.isDesignatedHelpBot && !activeParties[inviter].helpBotAssigned) {
                            bot.helpBot = false;
                        }
                    }
                }, 2000);
            }
            lastInviteTime = Date.now();
            clearTimeout(initialLimboTimeout);
        }

        if (msg.includes("summoned you to their server")) {
            bot.joinedGame = true;
            bot.inLimbo = false;
        }

        if (msg.includes("we couldn't find a server")) {
            bot.joinedGame = false;
            bot.inLimbo = true;
        }

        // GAME STARTS
        if (msg.includes("the game starts in")) {
            const match = raw.match(/starts in (\d+) seconds?/i);
            if (match) {
                const seconds = parseInt(match[1]);

                if (bot.helpBot && !bot.muted) {
                    const timeMessage = seconds === 1
                        ? translate(bot.currentLanguage, "game_start_countdown_one")
                        : translate(bot.currentLanguage, "game_start_countdown_multiple", seconds);
                    bot.chat(`/pc ${timeMessage}`);
                }

                if (seconds === 1) {
                    setTimeout(() => {
                        if (bot.glEnabled && !bot.muted) {
                            const randomMessage = glMessages[Math.floor(Math.random() * glMessages.length)];
                            bot.chat(`/party chat ${randomMessage}`);
                        }
                
                        setTimeout(() => {
                            if (!bot.stayMode) {
                                bot.chat("/party leave");
                                bot.chat("/limbo");
                                bot.inParty = false;
                                bot.joinedGame = false;
                                bot.inLimbo = true;
                            } else {
                                bot.chat("/lobby");
                                bot.joinedGame = false;
                            }
                        }, 1500);
                    }, Math.floor(Math.random() * 500));
                }
            }
        }

        const inviteMatch = raw.match(/(?:\[.*?\] )?(\w+) has invited you to join their party!/);
        if (inviteMatch) {
            const inviter = inviteMatch[1];
            if (!whitelist.includes(inviter)) return;

            if (bot.inParty) {
                let location = translate(bot.currentLanguage, "status_lobby");
                if (bot.joinedGame) location = translate(bot.currentLanguage, "status_ingame");
                else if (bot.inLimbo) location = translate(bot.currentLanguage, "status_limbo");

                const message = bot.joinedGame
                    ? translate(bot.currentLanguage, "status_ingame_wait")
                    : translate(bot.currentLanguage, "status_already_party", location);

                bot.chat(`/msg ${inviter} ${message}`);
                return;
            }

            inviteCooldowns[bot.username] = {
                lastInviter: inviter,
                timestamp: Date.now()
            };

            console.log(`[BOT ${index}] Accepting invite from ${inviter}`);
            bot.chat(`/party accept ${inviter}`);
            bot.inParty = true;
            bot.joinedGame = false;
            bot.inLimbo = false;
            lastInviteTime = Date.now();
            bot.invitedBy = inviter;

            if (!activeParties[inviter]) {
                activeParties[inviter] = { bots: [], helpBotAssigned: false };
            }
            if (!activeParties[inviter].bots.some(b => b.username === bot.username)) {
                activeParties[inviter].bots.push({ username: bot.username, joinedAt: Date.now() });
            }

            const delay = Math.floor(Math.random() * 1000) + 500; // 500ms - 1500ms
            setTimeout(() => {
                if (bot.inParty && !bot.muted) {
                    const totalInvites = invitationCounts[bot.username] || 0;
                    const stayStatus = bot.stayMode ? translate(bot.currentLanguage, "enabled") : translate(bot.currentLanguage, "disabled");
                    const glStatus = bot.glEnabled ? translate(bot.currentLanguage, "enabled") : translate(bot.currentLanguage, "disabled");
                    const partyJoinMessage = translate(bot.currentLanguage, "party_join_message", totalInvites, Object.values(gameJoins).reduce((sum, count) => sum + count, 0), stayStatus, glStatus);
                    bot.chat(`/party chat ${partyJoinMessage}`);
                    sendToWebhook(`✅ **${bot.username}** was invited by **${inviter}**. INFO: Invites: ${totalInvites} - Games: ${Object.values(gameJoins).reduce((sum, count) => sum + count, 0)} - Stay: ${stayStatus} - GL: ${glStatus}`);
                } else if (bot.inParty && bot.muted) {
                    sendToWebhook(`✅ **${bot.username}** was invited by **${inviter}** (bots muted). INFO: Invites: ${invitationCounts[bot.username] || 0} - Games: ${Object.values(gameJoins).reduce((sum, count) => sum + count, 0)} - Stay: ${bot.stayMode ? translate(bot.currentLanguage, "enabled") : translate(bot.currentLanguage, "disabled")}`);
                }
                setTimeout(() => {
                    if (bot.inParty && bot.invitedBy === inviter && !activeParties[inviter].helpBotAssigned) {
                        const partyBots = activeParties[inviter].bots;
                        partyBots.sort((a, b) => a.joinedAt - b.joinedAt);
                        if (partyBots.length > 0 && partyBots[0].username === bot.username && !bot.isDesignatedHelpBot) {
                            bot.helpBot = true;
                            bot.isDesignatedHelpBot = true;
                            activeParties[inviter].helpBotAssigned = true;
                            activeParties[inviter].helpBot = bot.username;
                            console.log(`[HELP BOT] (TIMEOUT) ${bot.username} is now the help bot for party of ${inviter}.`);
                            bot.chat("/party chat 🎤 I'm now responding to commands.");
                        } else if (bot.inParty && !bot.isDesignatedHelpBot && !activeParties[inviter].helpBotAssigned) {
                            bot.helpBot = false;
                        }
                    }
                }, delay + 1500);
            }, delay);
        }

        if (partyChatMatch && sender && !bots.some(b => b.username === sender) && !bot.muted && bot.helpBot) {
            const command = partyChatMatch[2].trim().split(' ')[0];
            const args = partyChatMatch[2].trim().substring(command.length).trim();
            const inviter = bot.invitedBy;

            if (commandHandlers[command]) {
                const isLeader = commandLeaders[inviter]?.command === command && commandLeaders[inviter]?.leader === bot.username && Date.now() - commandLeaders[inviter]?.timestamp < commandLeaderTimeout;

                if (!isLeader || commandHandlers[command].needsLeader === false) {
                    console.log(`[COMMAND] Received command "${command}" from ${sender} in party chat (Bot: ${bot.username}):`, args);
                    commandHandlers[command].module(bot, raw, args, sender, adminList, (mute) => { bot.muted = mute; }, whitelist, translate, sendToWebhook, bot.activeParties, fs, path, reloadConfigs, bots, (leader) => {
                        if (leader && inviter) {
                            commandLeaders[inviter] = { command: command, leader: bot.username, timestamp: Date.now() };
                        }
                    });
                } else {
                    console.log(`[COMMAND] Ignoring command "${command}" as ${commandLeaders[inviter].leader} is handling it.`);
                }
            } else if (autoResponses[command]) {
                const response = translate(bot.currentLanguage, autoResponses[command], args);
                bot.chat(`/party chat ${response}`);
            }
        }

        if (!raw.startsWith("Party >") && !raw.startsWith("From") && autoResponses[msg] && !bot.muted && bot.helpBot) {
            bot.chat(autoResponses[msg]);
        }

        const dmMatch = raw.match(/^From (?:\[.*?\] )?(\w+): (.+)/);
        if (dmMatch) {
            const sender = dmMatch[1];
            const content = dmMatch[2].trim();
            sendToDMWebhook(`📨 **${sender} ➜ ${bot.username}**: ${content}`);

            const privateCommand = content.trim().split(' ')[0].toLowerCase();
            const privateArgs = content.trim().substring(privateCommand.length).trim();

            if (whitelist.includes(sender) && commandHandlers[privateCommand] && privateCommand === "!status" && bot.helpBot) {
                commandHandlers[privateCommand].module(bot, raw, privateArgs, sender, adminList, bot.muted, whitelist, translate, sendToWebhook, bot.joinedGame, bot.inLimbo);
            }
        }

        const partyMessages = {};
        if (partyChatMatch) {
            const sender = partyChatMatch[1];
            const content = partyChatMatch[2].trim();
            if (!partyMessages[sender]) {
                partyMessages[sender] = [];
            }
            partyMessages[sender].push({ content, timestamp: Date.now() });
            partyMessages[sender] = partyMessages[sender].filter(m => Date.now() - m.timestamp < 3000);
            if (partyMessages[sender].length > 3 && !bot.muted && bot.helpBot) {
                bot.chat(`/party chat ${translate(bot.currentLanguage, "spam_warning")}`);
            }
        }
    });

    bot.on("kicked", (reason) => {
        console.log(`[BOT ${index}] Kicked: ${reason}`);
        sendToWebhook(`❌ **${bot.username}** was kicked: ${reason}`);
        bot.inParty = false;
        bot.joinedGame = false;
        bot.inLimbo = false;
        if (bot.invitedBy && activeParties[bot.invitedBy]) {
            activeParties[bot.invitedBy].bots = activeParties[bot.invitedBy].bots.filter(b => b.username !== bot.username);
            if (activeParties[bot.invitedBy].bots.length === 0) {
                delete activeParties[bot.invitedBy];
            } else if (activeParties[bot.invitedBy].helpBotAssigned && activeParties[bot.invitedBy].helpBot === bot.username) {
                activeParties[bot.invitedBy].helpBotAssigned = false;
                delete activeParties[bot.invitedBy].helpBot;
            }
        }
        bot.invitedBy = null;
        bot.helpBot = false;
        bot.isDesignatedHelpBot = false;
        setTimeout(() => {
            createBot({ username: bot.username, language: bot.currentLanguage }, index, activeParties);
        }, 5000);
    });

    bot.on("end", (reason) => {
        console.log(`[BOT ${index}] Disconnected: ${reason}`);
        sendToWebhook(`🔌 **${bot.username}** disconnected: ${reason}`);
        bot.inParty = false;
        bot.joinedGame = false;
        bot.inLimbo = false;
        if (bot.invitedBy && activeParties[bot.invitedBy]) {
            activeParties[bot.invitedBy].bots = activeParties[bot.invitedBy].bots.filter(b => b.username !== bot.username);
            if (activeParties[bot.invitedBy].bots.length === 0) {
                delete activeParties[bot.invitedBy];
            } else if (activeParties[bot.invitedBy].helpBotAssigned && activeParties[bot.invitedBy].helpBot === bot.username) {
                activeParties[bot.invitedBy].helpBotAssigned = false;
                delete activeParties[bot.invitedBy].helpBot;
            }
        }
        bot.invitedBy = null;
        bot.helpBot = false;
        bot.isDesignatedHelpBot = false;
        console.log(`[BOT ${index}] Attempting to reconnect in 5 seconds...`);
        setTimeout(() => {
            createBot({ username: bot.username, language: bot.currentLanguage }, index, activeParties);
        }, 5000);
    });

    bot.on('error', err => {
        console.error(`[BOT ${index}] Error:`, err);
        sendToDMWebhook(`🚨 **${bot.username}** encountered an error: ${err}`);
        bot.inParty = false;
        bot.joinedGame = false;
        bot.inLimbo = false;
        if (bot.invitedBy && activeParties[bot.invitedBy]) {
            activeParties[bot.invitedBy].bots = activeParties[bot.invitedBy].bots.filter(b => b.username !== bot.username);
            if (activeParties[bot.invitedBy].bots.length === 0) {
                delete activeParties[bot.invitedBy];
            } else if (activeParties[bot.invitedBy].helpBotAssigned && activeParties[bot.invitedBy].helpBot === bot.username) {
                activeParties[bot.invitedBy].helpBotAssigned = false;
                delete activeParties[bot.invitedBy].helpBot;
            }
        }
        bot.invitedBy = null;
        bot.helpBot = false;
        bot.isDesignatedHelpBot = false;
        console.log(`[BOT ${index}] Attempting to reconnect in 10 seconds...`);
        setTimeout(() => {
            createBot({ username: bot.username, language: bot.currentLanguage }, index, activeParties);
        }, 10000);
    });

    return bot;
}

setInterval(() => {
    const statesToSave = {};
    bots.forEach(bot => {
        statesToSave[bot.username] = {
            stayMode: bot.stayMode,
            glEnabled: bot.glEnabled,
            language: bot.currentLanguage,
            helpBot: bot.helpBot
        };
    });
    saveBotStates(statesToSave);
}, 300000);

setInterval(() => {
    const now = new Date();
    const backupPath = path.join(__dirname, `../bots/invitationCounts_backup_${now.toISOString().replace(/:/g, '-')}.json`);
    fs.copyFileSync(invitationCountsPath, backupPath);
    console.log(`[BACKUP] Created backup of invitationCounts.json at ${now.toISOString()}`);
}, 3600000);

module.exports = {
    createBot,
};