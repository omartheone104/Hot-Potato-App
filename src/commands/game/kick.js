const { Client, Interaction, PermissionFlagsBits } = require("discord.js");
const hotPotato = require("../../hot_potato");

module.exports = {
    name: 'kick',
    description: 'kicks player with the hot potato out of the game (admin only)',
    devOnly: true,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    
    // options: Object[],

    callback: async (client, interaction) => {
        await interaction.deferReply();
        try {
            hotPotato.kickPlayer(client, interaction);
        } catch (error) {
            console.log(`An error occurred while kicking player: ${error}`);
        }
    },
}
