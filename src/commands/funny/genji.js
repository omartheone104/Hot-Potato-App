module.exports = {
    name: 'genji',
    description: 'Replies with genji gif',
    // devOnly: Boolean,
    // options: Object[],

    callback: (client, interaction) => {
        let url = `https://tenor.com/view/genji-ryujin-no-ken-wo-kurae-overwatch-gif-6910676`;
        interaction.reply(`${url}`);
    },
}
