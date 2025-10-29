const { ApplicationCommandOptionType, ChannelType } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');

module.exports = {
    name: 'asgore',
    description: 'Driving in my car right after a beer',
    // devOnly: Boolean,
    options: [
        {
            name: 'channel',
            description: 'select voice channel',
            required: true,
            type: ApplicationCommandOptionType.Channel,
            channel_types: [ChannelType.GuildVoice],
        },
    ],

    callback: async (client, interaction) => {
        try {
            const channel = interaction.member.voice.channel;

            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });

            const filePath = path.join(__dirname, '..', '..', 'sound', 'asgore.mp3');
            const resource = createAudioResource(filePath);
            const player = createAudioPlayer();
            player.play(resource);
            connection.subscribe(player);
            player.on(AudioPlayerStatus.Idle, () => {connection.destroy();});

            await interaction.reply({files: ['https://tenor.com/view/asgore-knight-gif-10095168295952009600.gif']});
        } catch (error) {
           console.error(`Error playing Asgore: ${error}`);
            await interaction.reply("I couldn't drive my car right after a beer ;("); 
        }
    },
};