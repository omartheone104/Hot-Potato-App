const { Client, Interaction } = require("discord.js");
const hotPotato = require("../../hot_potato");

module.exports = {
    name: 'remaining',
    description: 'displays remaining players in game',
    // devOnly: Boolean,
    // options: Object[],

    callback: async (client, interaction) => {
        await interaction.deferReply();
        try {
            hotPotato.getRemainingPlayers(client, interaction);
        } catch (error) {
            console.log(`An error occurred: ${error}`);
        }
    },
}
