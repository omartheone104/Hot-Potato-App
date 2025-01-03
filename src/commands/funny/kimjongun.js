module.exports = {
    name: 'kimjongun',
    description: 'Replies with Kim Jong Un gif',
    // devOnly: Boolean,
    // options: Object[],

    callback: (client, interaction) => {
        let url = `https://tenor.com/view/kim-jongun-hi-hello-dictador-gif-12672400`;
        interaction.reply(`${url}`);
    },
}
