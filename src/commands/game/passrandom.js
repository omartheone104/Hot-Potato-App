const { Client, Interaction } = require("discord.js");
const hotPotato = require("../../hot_potato");

module.exports = {
    name: 'passrandom',
    description: 'pass the hot potato to a random player',
    // devOnly: Boolean,
    // options: Object[],

    callback: async (client, interaction) => {
        await interaction.deferReply();
        try {
            hotPotato.PassRandomPotato(client, interaction);
        } catch (error) {
            console.log(`An error occurred while passing the hot potato: ${error}`);
        }
    },
}
