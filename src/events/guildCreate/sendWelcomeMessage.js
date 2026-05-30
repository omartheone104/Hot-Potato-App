const { ChannelType, PermissionFlagsBits } = require("discord.js");

module.exports = async (client, guild) => {
    try {
        const channel =
            guild.systemChannel ||
            guild.channels.cache.find(
                channel => 
                    channel.type === ChannelType.GuildText &&
                    channel.permissionsFor(client.user)?.has([
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                    ])
            );
        
        if (!channel) return;

        await channel.send('Thanks for inviting Hot Potato! Use `/help` to get started.');
    } catch (error) {
        console.error(`Failed to send welcome message: ${error}`);
    }
};