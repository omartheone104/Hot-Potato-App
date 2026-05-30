const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const hotPotato = require("../../hot_potato");
const gameState = require("../../utils/gameState");
const lobbyTimeoutMap = new Map();

const createLobbyEmbed = (state) => {
    const players = state.players.length ? state.players.map(id => `<@${id}>`).join("\n") : "No players joined.";

    return new EmbedBuilder()
        .setTitle("Hot Potato Lobby")
        .setDescription(`Players (${state.players.length})\n\n${players}\n\nWaiting for players...`)
        .setTimestamp();

};

const createButtons = () => {
    return new ActionRowBuilder().addComponents(
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
};

module.exports = async (client, interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("hotpotato_")) return;

    const guildId = interaction.guild.id;
    const state = gameState.getState(guildId);

    if (!state.starting && !state.started) {
        return interaction.reply({
            content: "No lobby is currently open.",
            flags: MessageFlags.Ephemeral,
        });
    }

    if (state.started) {
        return interaction.reply({
            content: "The game has already started.",
            flags: MessageFlags.Ephemeral,
        });
    }

    switch (interaction.customId) {
        case "hotpotato_join": {
            if (state.players.includes(interaction.user.id)) {
                return interaction.reply({
                    content: "You have already joined the lobby.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            state.players.push(interaction.user.id);
            
            return interaction.update({
                embeds: [createLobbyEmbed(state)],
                components: [createButtons()],
            });
        }
        case "hotpotato_leave": {
            if (interaction.user.id === state.hostId) {
                return interaction.reply({
                    content: "The host cannot leave the lobby. Cancel it instead.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            state.players = state.players.filter(id => id !== interaction.user.id);

            return interaction.update({
                embeds: [createLobbyEmbed(state)],
                components: [createButtons()],
            });
        }
        case "hotpotato_start": {
            if (interaction.user.id !== state.hostId) {
                return interaction.reply({
                    content: "Only the host can start the game.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (state.players.length < 2) {
                return interaction.reply({
                    content: "Need at least 2 players.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            state.starting = false;
            state.started = true;

            if (state.lobbyTimeout) {
                clearTimeout(state.lobbyTimeout);
                state.lobbyTimeout = null;
            }

            await interaction.update({
                embeds: [createLobbyEmbed(state)],
                components: [],
            });

            await hotPotato.startPotato(client, interaction);
            break;
        }
        case "hotpotato_cancel": {
            if (interaction.user.id !== state.hostId) {
                return interaction.reply({
                    content: "Only the host can cancel the lobby.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            state.starting = false;
            state.started = false;
            state.hostId = null;
            state.players = [];

            if (state.lobbyTimeout) {
                clearTimeout(state.lobbyTimeout);
                state.lobbyTimeout = null;
            }

            const cancelEmbed = new EmbedBuilder()
                .setTitle(";( Lobby Cancelled")
                .setDescription("The Hot Potato lobby was cancelled.")
                .setTimestamp();
            
            return interaction.update({
                embeds: [cancelEmbed],
                components: [],
            });
        }
    }
};