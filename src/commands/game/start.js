const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const gameState = require("../../utils/gameState");
const hotPotato = require("../../hot_potato");

module.exports = {
    name: 'start',
    description: 'starts a new Hot Potato lobby',
    // devOnly: Boolean,
    // options: Object[],

    callback: async (client, interaction) => {
        const guildId = interaction.guild.id;
        const state = gameState.getState(guildId);

        try {
            if (state.started) {
                return interaction.reply({
                    content: 'A game is already in progress.',
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (state.starting) {
                return interaction.reply({
                    content: 'A lobby is already open.',
                    flags: MessageFlags.Ephemeral,
                });
            }

            state.starting = true;
            state.started = false;
            state.hostId = interaction.user.id;
            state.players = [interaction.user.id];
            state.lobbyChannelId = interaction.channel.id;

            if (state.lobbyTimeout) {
                clearTimeout(state.lobbyTimeout);
            }

            const embed = new EmbedBuilder()
                .setTitle("Hot Potato Lobby")
                .setDescription(`Players (1)\n\n<@${interaction.user.id}>\n\nWaiting for players...`)
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("hotpotato_join")
                    .setLabel("Join")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("hotpotato_leave")
                    .setLabel("Leave")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("hotpotato_start")
                    .setLabel("Start Game")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("hotpotato_cancel")
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Primary)
            );

            state.lobbyTimeout = setTimeout(async () => {
                const freshState = gameState.getState(guildId);

                if (!freshState.lobbyMessageId) return;
                if (!freshState.starting || freshState.started) return;

                const channel = client.channels.cache.get(freshState.lobbyChannelId);
                if (!channel) return;

                const msg = await channel.messages.fetch(freshState.lobbyMessageId).catch(() => null);
                if (!msg) {
                    console.log("Lobby message deleted (timeout fallback)");
                    freshState.players = [];
                    freshState.hostId = null;
                    freshState.starting = false;
                    freshState.started = false;
                    freshState.lobbyMessageId = null;
                    freshState.lobbyTimeout = null;
                    return;
                }

                freshState.starting = false;
                freshState.started = true;
                
                const expiredEmbed = new EmbedBuilder()
                    .setTitle("Lobby Expired")
                    .setDescription("No activity detected. The lobby has been closed. Game will start.")
                    .setTimestamp();

                await msg.edit({
                    embeds: [expiredEmbed],
                    components: [],
                }).catch(() => {});
                
                clearTimeout(freshState.lobbyTimeout)
                freshState.lobbyTimeout = null;
          
                await hotPotato.startPotato(client, guildId);
            }, 24 * 60 * 60 * 1000);

            const response = await interaction.reply({
                embeds: [embed],
                components: [row],
                withResponse: true,
            });

            state.lobbyMessageId = response.resource.message.id;
        } catch (error) {
            state.started = false;
            state.starting = false;

            console.log(`An error occurred while starting the hot potato game: ${error}`);

            if (!interaction.replied) {
                await interaction.reply({
                    content: 'Failed to start the game.',
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
    },
}
