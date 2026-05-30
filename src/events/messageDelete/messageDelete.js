const { ChannelType, PermissionFlagsBits } = require("discord.js");
const gameState = require("../../utils/gameState");

module.exports = async (client, message) => {
    try {
        if (!message.guild) return;

        const state = gameState.getState(message.guild.id);

        if (!state?.lobbyMessageId) return;

        if (message.id !== state.lobbyMessageId) return;

        if (state.started === true) return;

        console.log("Hot Potato lobby message deleted");

        if (state.lobbyTimeout) {
            clearTimeout(state.lobbyTimeout);
            state.lobbyTimeout = null;
        }

        state.starting = false;
        state.started = false;
        state.players = [];
        state.hostId = null;
        state.lobbyMessageId = null;

        const channel = client.channels.cache.get(state.lobbyChannelId);
        if (channel) {
            channel.send("The Hot Potato lobby was deleted and has been cancelled.");
        }
    } catch (error) {
        console.log(`Error in messageDelete handler: ${error}`);
    }
};