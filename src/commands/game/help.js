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
                    .setTitle("The Hot Potato Game")
                    .setDescription("Welcome to Hot Potato. The objective of the game is to be the last one standing! The potato is hot and you must pass it around. You have a limited amount of time before the potato burns you. It gets hotter when it is passed around and when the amount of players decreases. Good luck and don't get cooked.")
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
