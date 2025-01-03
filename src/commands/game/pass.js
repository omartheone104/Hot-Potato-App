const { Client, Interaction, ApplicationCommandOptionType } = require("discord.js");
const hotPotato = require("../../hot_potato");

module.exports = {
    name: 'pass',
    description: 'pass the hot potato to another player',
    // devOnly: Boolean,
    options: [
        {
            name: 'target-user',
            description: 'the user you want to pass the hot potato to',
            required: true,
            type: ApplicationCommandOptionType.User,
        },
    ],

    callback: async (client, interaction) => {
        const targetUserId = interaction.options.get('target-user').value;
        await interaction.deferReply();
        const targetUser = await interaction.guild.members.fetch(targetUserId);
        try {
            hotPotato.PassPotato(client, interaction, targetUser);
        } catch (error) {
            console.log(`An error occurred while passing the hot potato: ${error}`);
        }
    },
}
