module.exports = {
    name: 'hanzo',
    description: 'Replies with hanzo gif',
    // devOnly: Boolean,
    // options: Object[],

    callback: (client, interaction) => {
        let url = `https://tenor.com/view/hanzo-genji-battle-brothers-ultimate-gif-13381737`;
        interaction.reply(`${url}`);
    },
}
