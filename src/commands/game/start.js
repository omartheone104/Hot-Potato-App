const { Client, Interaction } = require("discord.js");
const hotPotato = require("../../hot_potato");
const gameState = require("../../utils/gameState");

module.exports = {
    name: 'start',
    description: 'starts the game and gives the hot potato to a random player',
    // devOnly: Boolean,
    // options: Object[],

    callback: async (client, interaction) => {
        try {
            if (gameState.started) {
                interaction.reply({
                    content: 'The game has already started!',
                    ephemeral: true,
                });
                return;
            }
            gameState.started = true;
            hotPotato.startPotato(client, interaction);
        } catch (error) {
            console.log(`An error occurred while starting the hot potato game: ${error}`);
        }
    },
}
