const { devs } = require('../../../config.json');
const getLocalCommands = require('../../utils/getLocalCommands');
const gameState = require("../../utils/gameState");

module.exports = async (client, interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const localCommands = getLocalCommands();

  try {
    const guildId = interaction.guild.id;
    const state = gameState.getState(guildId);
    const commandObject = localCommands.find(
      (cmd) => cmd.name === interaction.commandName
    );

    if (!commandObject) return;

    if (commandObject.devOnly) {
      if (!devs.includes(interaction.member.id)) {
        interaction.reply({
          content: 'Only developers are allowed to run this command.',
          ephemeral: true,
        });
        return;
      }
    }

    if (commandObject.permissionsRequired?.length) {
      for (const permission of commandObject.permissionsRequired) {
        if (!interaction.member.permissions.has(permission)) {
          interaction.reply({
            content: 'Not enough permissions.',
            ephemeral: true,
          });
          return;
        }
      }
    }

    if (commandObject.botPermissions?.length) {
      for (const permission of commandObject.botPermissions) {
        const bot = interaction.guild.members.me;

        if (!bot.permissions.has(permission)) {
          interaction.reply({
            content: "I don't have enough permissions.",
            ephemeral: true,
          });
          return;
        }
      }
    }

    if (interaction.commandName !== 'start' && interaction.commandName !== 'end' && interaction.commandName !== 'help' && !state.started) {
      interaction.reply({
        content: 'You need to start the game first by using the `/start` command.',
        ephemeral: true,
      });
      return;
    }
    await commandObject.callback(client, interaction);
  } catch (error) {
    console.log(`There was an error running this command: ${error}`);
  }
};
