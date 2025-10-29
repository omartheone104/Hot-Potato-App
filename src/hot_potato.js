const { Client, Interaction, Guild, MessageFlags } = require("discord.js");
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./db.sqlite');
const gameState = require("./utils/gameState");
const moment = require('moment');
var members_and_ID = new Map();
var time_map = new Map();
var timeout;
var expirationtime = 5000;
// 8.64e+7
var count = 0;

module.exports = {
    startPotato: async function startPotato(client, interaction) {
        count = 0;
        const guild = await interaction.guild;
        const channel = await interaction.channel;
        const state = gameState.getState(guild.id);

        time_map.set(guild.id, expirationtime);
        let members = await guild.members.fetch();
        members = await guild.members.cache.filter(members => !members.user.bot);
        let players = [];

        members.forEach((member) => {
            members_and_ID.set(member.user.id, member.user.username);
        });

        for (const [key] of members_and_ID) {
            players.push(key);
        }

        if(players.length <= 1){
            await interaction.reply("Too few players.");
            state.started = false;
            return;
        }

        let username_string = players.join(',');
        let size = players.length;
        let rng = Math.floor(Math.random() * size);
        let player_with_potato = players[rng];
        let date = new Date();
        date = date.toUTCString();

        let sql_query = 'INSERT INTO Game VALUES (?, ?, ?, ?, ?, ?)';
        db.run(sql_query, [guild.id, channel.id, username_string, username_string, player_with_potato, date]);
        await interaction.reply(`The hot potato game has started. <@${player_with_potato}> has the hot potato.`);
        timeout = setTimeout(() => this.kickPlayer(client, interaction), time_map.get(guild.id));
    },
    PassPotato: async function PassPotato(client, interaction, targetUser) {
        const correct_guild = await interaction.guild.id;
        const channelID = await interaction.channel.id;
        let current_players;
        let current_players_arr = [];
        let player_with_potato;
        let check = false;
        let date = new Date();
        date = date.toUTCString();
        clearTimeout(timeout);

        db.get("SELECT HasPotato FROM Game WHERE GuildID = " + correct_guild, (err, column)=>{
            player_with_potato = `${column.HasPotato}`;
            if(interaction.user.id != player_with_potato){
                let player_with_potato_username = members_and_ID.get(player_with_potato);
                interaction.followUp({content: `You do not have the potato. ${player_with_potato_username} has the potato.`, flags: MessageFlags.Ephemeral});
                return;
            } else {
                db.get("SELECT RemainingPlayers FROM Game WHERE GuildID = " + correct_guild, (err, column)=>{
                    current_players = `${column.RemainingPlayers}`;
                    current_players_arr = current_players.split(',');
                    for(let i = 0; i < current_players_arr.length; i++){
                        if(current_players_arr[i] == player_with_potato){
                            current_players_arr.splice(i, 1);
                        }
                    }
                    for(let i = 0; i < current_players_arr.length; i++){
                        if(current_players_arr[i] == targetUser.user.id){
                            check = true;
                        }
                    }
                    if (!targetUser) {
                        interaction.followUp({content: "User not found", flags: MessageFlags.Ephemeral});
                        return;
                    } else if (targetUser.id === interaction.user.id) {
                        interaction.followUp({content: "You can't pass the hot potato to yourself", flags: MessageFlags.Ephemeral});
                        return;
                    } else if (targetUser.user.bot) {
                        interaction.followUp({content: "You can't pass the hot potato to a bot", flags: MessageFlags.Ephemeral});
                        return;
                    } else if (!check) {
                        interaction.followUp({content: "This user is currently not in the game", flags: MessageFlags.Ephemeral});
                        return;
                    } else {
                        db.run("UPDATE Game SET ChannelID = " + channelID + ", HasPotato = \'" + targetUser.user.id + "\', DatePotatoGiven = \'" + date + "\' WHERE GuildID = " + correct_guild);
                        interaction.followUp("The hot potato has been passed to " + targetUser.user.username);
                    }
                });
            }
        });
        count++;
        this.timeFunc(client, interaction, count);
        timeout = setTimeout(() => this.kickPlayer(client, interaction), time_map.get(correct_guild));
    },
    PassRandomPotato: async function PassRandomPotato(client, interaction){
        const correct_guild = await interaction.guild.id;
        const channelID = await interaction.channel.id;
        let current_players;
        let current_players_arr = [];
        let player_with_potato;
        let new_player_with_potato;
        let date = new Date();
        date = date.toUTCString();
        clearTimeout(timeout);

        db.get("SELECT HasPotato FROM Game WHERE GuildID = " + correct_guild, (err, column)=>{
            player_with_potato = `${column.HasPotato}`;
            if(interaction.user.id != player_with_potato){
                let player_with_potato_username = members_and_ID.get(player_with_potato);
                interaction.followUp({content: `You do not have the potato. ${player_with_potato_username} has the potato.`, flags: MessageFlags.Ephemeral});
                return;
            } else {
                db.get("SELECT RemainingPlayers FROM Game WHERE GuildID = " + correct_guild, (err, column)=>{
                    current_players = `${column.RemainingPlayers}`;
                    current_players_arr = current_players.split(',');
                    for(let i = 0; i < current_players_arr.length; i++){
                        if(current_players_arr[i] == player_with_potato){
                            current_players_arr.splice(i, 1);
                        }
                    }
                    let size = current_players_arr.length;
                    let rng = Math.floor(Math.random() * size);
                    new_player_with_potato = current_players_arr[rng];
                    let new_player_with_potato_username = members_and_ID.get(new_player_with_potato);
                    db.run("UPDATE Game SET ChannelID = " + channelID + ", HasPotato = \'" + new_player_with_potato + "\', DatePotatoGiven = \'" + date + "\' WHERE GuildID = " + correct_guild);
                    interaction.followUp("The hot potato has been passed to " + new_player_with_potato_username);
                });
            }
        });
        count++;
        this.timeFunc(client, interaction, count);
        timeout = setTimeout(() => this.kickPlayer(client, interaction), time_map.get(correct_guild));
    },
    getPotatoHolder: async function getPotatoHolder(client, interaction){
        const correct_guild = await interaction.guild.id;
        db.get("SELECT HasPotato FROM Game WHERE GuildID = " + correct_guild, (err, column)=>{
            let current_potato = members_and_ID.get(`${column.HasPotato}`);
            interaction.followUp(`${current_potato} has the potato`);
        });
    },
    gameEnded: async function gameEnded(client, interaction){
        const guild = await interaction.guild;
        const correct_guild = await interaction.guild.id;
        const state = gameState.getState(guild.id);
        let members = await guild.members.fetch();
        let last_player;
        let userID;
        db.get("SELECT RemainingPlayers FROM Game WHERE GuildID = " + correct_guild, (err, column)=>{
            last_player = `${column.RemainingPlayers}`;
            members = guild.members.cache.filter(members => members.user.username == last_player);
            members.forEach((member) => {
                userID = member.user.id;
            });
            interaction.followUp(`<@${last_player}> is the winner!`);
        });
        clearTimeout(timeout);
        state.started = false;
        db.run("DELETE FROM Game WHERE GuildID = " + correct_guild);
    },
    kickPlayer: async function kickPlayer(client, interaction){
        const correct_guild = await interaction.guild.id;
        const channelID = await interaction.channel.id;
        let player_with_potato;
        let current_players;
        let current_players_arr = [];
        let username_string;
        let new_player_with_potato;
        let date = new Date();
        date = date.toUTCString();
        
        db.get("SELECT RemainingPlayers, HasPotato FROM Game WHERE GuildID = " + correct_guild, (err, column)=>{
            current_players = `${column.RemainingPlayers}`;
            current_players_arr = current_players.split(',');
            player_with_potato = `${column.HasPotato}`;
            for(let i = 0; i < current_players_arr.length; i++){
                if(current_players_arr[i] == player_with_potato){
                    current_players_arr.splice(i, 1);
                }
            }
            username_string = current_players_arr.join(',');
            let size = current_players_arr.length;
            let rng = Math.floor(Math.random() * size);
            new_player_with_potato = current_players_arr[rng];
            let player_with_potato_username = members_and_ID.get(player_with_potato);
            let new_player_with_potato_username = members_and_ID.get(new_player_with_potato);
            db.run("UPDATE Game SET ChannelID = " + channelID + ", RemainingPlayers = \'" + username_string + "\', HasPotato = \'" + new_player_with_potato + "\', DatePotatoGiven = \'" + date + "\' WHERE GuildID = " + correct_guild);
            interaction.followUp(`${player_with_potato_username} is out. ${new_player_with_potato_username} has the potato.`);
            if(current_players_arr.length == 1){
                this.gameEnded(client, interaction);
            }
        });
        this.timeFunc(client, interaction, count);
        timeout = setTimeout(() => this.kickPlayer(client, interaction), time_map.get(correct_guild));
    },
    getRemainingPlayers: async function getRemainingPlayers(client, interaction){
        const correct_guild = await interaction.guild.id;
        let current_players;
        let current_players_arr = [];

        db.get("SELECT RemainingPlayers FROM Game WHERE GuildID = " + correct_guild, (err, column)=>{
            current_players = `${column.RemainingPlayers}`;
            current_players_arr = current_players.split(',');
            for(let i = 0; i < current_players_arr.length; i++) {
                current_players_arr[i] = members_and_ID.get(current_players_arr[i]);
            }
            current_players = current_players_arr.join(', ');
            interaction.followUp("Players remaining: " + current_players);
        });
    },
    endPotato: async function endPotato(client, interaction){
        const correct_guild = await interaction.guild.id;

        db.run("DELETE FROM Game WHERE GuildID = " + correct_guild);
        await interaction.reply("Force end game");
    },
    timeFunc: async function timeFunc(client, interaction, count){
        const correct_guild = await interaction.guild.id;

        db.get("SELECT * FROM Game WHERE GuildID = " + correct_guild, (err, column)=>{
            expirationtime = expirationtime * ((1 - 0.05) ** count);
            //console.log(expirationtime);
            time_map.set(correct_guild, expirationtime);
        });
    }
};
