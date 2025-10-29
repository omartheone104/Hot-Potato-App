const { Client, Interaction, Guild, MessageFlags } = require("discord.js");
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./db.sqlite');
const gameState = require("./utils/gameState");
const moment = require('moment');
const { PlayerSubscription } = require("@discordjs/voice");
const members_and_ID = new Map();
const time_map = new Map();
const timeout_map = new Map();
const count_map = new Map();
var expirationtime = 15000;
// 8.64e+7
var count = 0;

module.exports = {
    startPotato: async function startPotato(client, interaction) {
        const guild = interaction.guild;
        const channel = interaction.channel;
        const state = gameState.getState(guild.id);

        let members = await guild.members.fetch();
        members = members.filter(m => !m.user.bot);

        const guildMembersMap = new Map();
        members.forEach(member => guildMembersMap.set(member.user.id, member.user.username));

        members_and_ID.set(guild.id, guildMembersMap);
        time_map.set(guild.id, expirationtime);
        count_map.set(guild.id, 0);

        const players = Array.from(guildMembersMap.keys());
    
        if(players.length <= 1){
            await interaction.reply("Too few players.");
            state.started = false;
            return;
        }
        
        const rng  = Math.floor(Math.random() * players.length);
        const player_with_potato = players[rng];
        const date = new Date().toUTCString();

        const sql_query = 'INSERT INTO Game VALUES (?, ?, ?, ?, ?, ?)';
        db.run(sql_query, [guild.id, channel.id, players.join(','), players.join(','), player_with_potato, date]);

        await interaction.reply(`The hot potato game has started. <@${player_with_potato}> has the hot potato.`);

        const timeout = setTimeout(() => this.kickPlayer(client, interaction), time_map.get(guild.id));
        timeout_map.set(guild.id, timeout);
    },
    PassPotato: async function PassPotato(client, interaction, targetUser) {
        const correct_guild = interaction.guild.id;
        const guildMembersMap = members_and_ID.get(correct_guild);
        const channelID = interaction.channel.id;
        clearTimeout(timeout_map.get(correct_guild));

        db.get("SELECT HasPotato FROM Game WHERE GuildID = ?", [correct_guild], (err, column) => {
            if (err || !column) return;
            const player_with_potato = `${column.HasPotato}`;
            if(interaction.user.id != player_with_potato){
                const player_with_potato_username = guildMembersMap.get(player_with_potato);
                interaction.followUp({content: `You do not have the potato. ${player_with_potato_username} has the potato.`, flags: MessageFlags.Ephemeral});
                return;
            }

            db.get("SELECT RemainingPlayers FROM Game WHERE GuildID = ?", [correct_guild], (err, column) => {
                if (err || !column) return;
                let current_players_arr = column.RemainingPlayers.split(',');
                current_players_arr = current_players_arr.filter(id => id !== player_with_potato);
                const check = current_players_arr.includes(targetUser.user.id);

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
                }

                const date = new Date().toUTCString();
                db.run("UPDATE Game SET ChannelID = ?, HasPotato = ?, DatePotatoGiven = ? WHERE GuildID = ?", 
                    [channelID, targetUser.user.id, date, correct_guild]);

                interaction.followUp(`The hot potato has been passed to ${targetUser.user.username}`);

                this.timeFunc(client, interaction);
                const timeout = setTimeout(() => this.kickPlayer(client, interaction), time_map.get(correct_guild));
                timeout_map.set(correct_guild, timeout)
            });
        });
    },
    PassRandomPotato: async function PassRandomPotato(client, interaction){
        const correct_guild = interaction.guild.id;
        const guildMembersMap = members_and_ID.get(correct_guild);
        const channelID = interaction.channel.id;
        clearTimeout(timeout_map.get(correct_guild));

        db.get("SELECT HasPotato FROM Game WHERE GuildID = ?", [correct_guild], (err, column) => {
            if (err || !column) return;
            const player_with_potato = `${column.HasPotato}`;
            if(interaction.user.id != player_with_potato){
                const player_with_potato_username = guildMembersMap.get(player_with_potato);
                interaction.followUp({content: `You do not have the potato. ${player_with_potato_username} has the potato.`, flags: MessageFlags.Ephemeral});
                return;
            }

            db.get("SELECT RemainingPlayers FROM Game WHERE GuildID = ?", [correct_guild], (err, column) => {
                if (err || !column) return;
                let current_players_arr = column.RemainingPlayers.split(',').filter(id => id !== player_with_potato);
                const rng = Math.floor(Math.random() * current_players_arr.length);
                const new_player_with_potato = current_players_arr[rng];
                const new_player_with_potato_username = guildMembersMap.get(new_player_with_potato);
                const date = new Date().toUTCString;

                db.run("UPDATE Game SET ChannelID = ?, HasPotato = ?, DatePotatoGiven = ? WHERE GuildID = ?", 
                    [channelID, new_player_with_potato, date, correct_guild]);

                interaction.followUp(`The hot potato has been passed to ${new_player_with_potato_username}`);

                this.timeFunc(client, interaction);
                const timeout = setTimeout(() => this.kickPlayer(client, interaction), time_map.get(correct_guild));
                timeout_map.set(correct_guild, timeout)
            });
        });
    },
    getPotatoHolder: async function getPotatoHolder(client, interaction){
        const correct_guild = interaction.guild.id;
        const guildMembersMap = members_and_ID.get(correct_guild);

        db.get("SELECT HasPotato FROM Game WHERE GuildID = ?", [correct_guild], (err, column) => {
            if (err || !column) return;
            const current_potato = guildMembersMap.get(columnd.HasPotato);
            interaction.followUp(`${current_potato} has the potato`);
        });
    },
    gameEnded: async function gameEnded(client, interaction, winner_id = null){
        const guild = interaction.guild;
        const correct_guild = guild.id;
        const guildMembersMap = members_and_ID.get(correct_guild);
        const state = gameState.getState(guild.id);

        clearTimeout(timeout_map.get(correct_guild));

        if (winner_id) {
            const winner_username = guildMembersMap.get(winner_id);
            await interaction.followUp(`<@${winner_id}> (${winner_username}) is the winner!`);
        } else {
            db.get("SELECT RemainingPlayers FROM Game WHERE GuildID = ?", [correct_guild], (err, column) => {
                if (err || !column) return;
                const winner_id = column.RemainingPlayers;
                const winner_username = guildMembersMap.get(winner_id);
                interaction.followUp(`<@${winner_id}> (${winner_username}) is the winner!`);
            });
        }
        
        state.started = false;
        db.run("DELETE FROM Game WHERE GuildID = ?", [correct_guild]);
        members_and_ID.delete(correct_guild);
        time_map.delete(correct_guild);
        timeout_map.delete(correct_guild);
        count_map.delete(correct_guild);
    },
    kickPlayer: async function kickPlayer(client, interaction){
        const correct_guild = interaction.guild.id;
        const guildMembersMap = members_and_ID.get(correct_guild);
        const channelID = interaction.channel.id;
        
        db.get("SELECT RemainingPlayers, HasPotato FROM Game WHERE GuildID = ?", [correct_guild], (err, column) => {
            if (err || !column) return;
            let current_players_arr = column.RemainingPlayers.split(',');
            const player_with_potato = column.HasPotato;
            current_players_arr = current_players_arr.filter(id => id !== player_with_potato);

            const player_with_potato_username = guildMembersMap.get(player_with_potato);

            if(current_players_arr.length === 1){
                const winner_id = current_players_arr[0];
                const winner_username = guildMembersMap.get(winner_id);

                interaction.followUp(`${player_with_potato_username} is out. ${winner_username} has the potato.`)
                    .then(() => {
                        setTimeout(() => {
                            this.gameEnded(client, interaction, winner_id);
                        }, 200);
                    });
                return;
            }

            const rng = Math.floor(Math.random() * current_players_arr.length);
            const new_player_with_potato = current_players_arr[rng];
            const new_player_with_potato_username = guildMembersMap.get(new_player_with_potato);
            const date = new Date().toUTCString();

            db.run("UPDATE Game SET ChannelID = ?, RemainingPlayers = ?, HasPotato = ?, DatePotatoGiven = ? WHERE GuildID = ?",
                [channelID, current_players_arr.join(','), new_player_with_potato, date, correct_guild]);

            interaction.followUp(`${player_with_potato_username} is out. ${new_player_with_potato_username} has the potato.`);
            
            this.timeFunc(client, interaction);
            const timeout = setTimeout(() => this.kickPlayer(client, interaction), time_map.get(correct_guild));
            timeout_map.set(correct_guild, timeout);
        });
    },
    getRemainingPlayers: async function getRemainingPlayers(client, interaction){
        const correct_guild = interaction.guild.id;
        const guildMembersMap = members_and_ID.get(correct_guild);

        db.get("SELECT RemainingPlayers FROM Game WHERE GuildID = ?", [correct_guild], (err, column) => {
            if (err || !column) return;
            const current_players_arr = column.RemainingPlayers.split(',').map(id => guildMembersMap.get(id));
            interaction.followUp("Players remaining: " + current_players_arr.join(', '));
        });
    },
    endPotato: async function endPotato(client, interaction){
        const correct_guild = interaction.guild.id;
        db.run("DELETE FROM Game WHERE GuildID = ?", correct_guild);
        clearTimeout(timeout_map.get(correct_guild));
        members_and_ID.delete(correct_guild);
        time_map.delete(correct_guild);
        timeout_map.delete(correct_guild);
        count_map.delete(correct_guild);
        await interaction.reply("Force end game");
    },
    timeFunc: async function timeFunc(client, interaction){
        const correct_guild = await interaction.guild.id;
        time_map.set(correct_guild, expirationtime);
    }
};
