const { Client, Interaction } = require("discord.js");
const hotPotato = require("../../hot_potato");

module.exports = {
    name: 'whohaspotato',
    description: 'displays the current holder of the potato',
    // devOnly: Boolean,
    // options: Object[],

    callback: async (client, interaction) => {
        await interaction.deferReply();
        try {
            hotPotato.getPotatoHolder(client, interaction);
        } catch (error) {
            console.log(`An error occurred: ${error}`);
        }
    },
}
