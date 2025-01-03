const { Client, IntentsBitField } = require('discord.js');
const sqlite3 = require('sqlite3');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildModeration,
    ],
});

const db = new sqlite3.Database('./db.sqlite');

client.on('ready', (c) => {
    console.log(`${c.user.tag} is online.`);
});

client.on('error', (err) => { 
    console.error(err);
});

client.on('warn', (info) => { 
    console.warn(info);
});

client.on('messageCreate', (msg) => {
    console.log(msg.author.tag + ":", msg.content);
    if (msg.content === 'nig') {
        msg.reply('ger');
    }
});

client.login(
    'MTMwNjgxNDkyMzQ4MDg5NTUyOA.Ghkvak.I9TQKN9wsJ3uqj7bIMnEa6yMdV7LdVcSJsaDOA'
);
