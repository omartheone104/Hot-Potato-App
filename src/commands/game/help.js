const { Client, Interaction, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require('fs');
const buttonPagination = require('../../utils/buttonPagination');

module.exports = {
    name: 'help',
    description: 'Information about the game',
    // devOnly: Boolean,
    // options: Object[],

    callback: async (client, interaction) => {
        const commandFolders = fs.readdirSync('./src/commands');
        const helpEmbeds = [];

        for (const folder of commandFolders) {
            const commandFiles = fs.readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith('.js'));
            
            const categoryEmbed = new EmbedBuilder()
                    .setTitle(folder)
                    .setTimestamp()
                    .setThumbnail(client.user.displayAvatarURL());

            const subcommands = [];

            for (const file of commandFiles) {
                const command = require(`./../${folder}/${file}`);

                if (command.deleted) {
                    continue;
                }
                
                const description = `${command.description || 'No description provided'}`;

                if (command.type === 'SUB_COMMAND' || command.type === 'SUB_COMMAND_GROUP') {
                    subcommands.push(command);
                } else {
                    categoryEmbed.addFields({
                        name: `/${command.name}`,
                        value: `${description}`
                    })
                }
            }

            if (subcommands.length > 0) {
                categoryEmbed.addFields({
                    name: 'Subcommands',
                    value: subcommands.map(subcommand => `/${subcommand.data.name}`).join(`\n`)
                })
            }

            helpEmbeds.push(categoryEmbed);
        }

        await buttonPagination(interaction, helpEmbeds);
    },
}
