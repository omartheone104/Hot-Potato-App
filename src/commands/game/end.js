const { Client, Interaction, MessageFlags } = require("discord.js");
const hotPotato = require("../../hot_potato");
const gameState = require("../../utils/gameState");

module.exports = {
    name: 'end',
    description: 'force the game to end (admin only)',
    devOnly: true,
    // options: Object[],

    callback: async (client, interaction) => {
        try {
            const guildId = interaction.guild.id;
            const state = gameState.getState(guildId);
            /*if (!gameState.started) {
                interaction.reply({
                    content: 'You need to start the game first by using the `/start` command.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }*/
            state.started = false;
            hotPotato.endPotato(client, interaction);
        } catch (error) {
            console.log(`An error occurred while ending the hot potato game: ${error}`);
        }
    },
}
