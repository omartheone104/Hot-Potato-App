require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const eventHandler = require('./handlers/eventHandler');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./db.sqlite');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildModeration,
    ],
});

eventHandler(client);

client.login(process.env.TOKEN);

const create_query = 'CREATE TABLE IF NOT EXISTS Game (GuildID TEXT NOT NULL, ChannelID TEXT NOT NULL, StartingPlayers TEXT NOT NULL, RemainingPlayers TEXT NOT NULL, HasPotato TEXT NOT NULL, DatePotatoGiven TEXT NOT NULL, PRIMARY KEY (GuildID))';
db.run(create_query)