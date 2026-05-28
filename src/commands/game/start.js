const { Client, Interaction, MessageFlags } = require("discord.js");
const hotPotato = require("../../hot_potato");
const gameState = require("../../utils/gameState");

module.exports = {
    name: 'start',
    description: 'starts the game and gives the hot potato to a random player',
    // devOnly: Boolean,
    // options: Object[],

    callback: async (client, interaction) => {
        const guildId = interaction.guild.id;
        const state = gameState.getState(guildId);

        try {
            if (state.started) {
                return interaction.reply({
                    content: 'The game has already started!',
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (state.starting) {
                return interaction.reply({
                    content: 'The game is currently starting.',
                    flags: MessageFlags.Ephemeral,
                });
            }

            state.starting = true;

            await hotPotato.startPotato(client, interaction);

            state.started = true;
        } catch (error) {
            state.started = false;

            console.log(`An error occurred while starting the hot potato game: ${error}`);

            if (!interaction.replied) {
                await interaction.reply({
                    content: 'Failed to start the game.',
                    flags: MessageFlags.Ephemeral,
                });
            }
        } finally {
            state.starting = false;
        }
    },
}
