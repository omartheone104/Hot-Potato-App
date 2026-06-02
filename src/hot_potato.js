const { Client, Interaction, Guild, MessageFlags, InteractionResponse, Message } = require("discord.js");
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./data/db.sqlite');
const gameState = require("./utils/gameState");
const time_map = new Map();
const timeout_map = new Map();
const count_map = new Map();
const countdown_message_map = new Map();
const countdown_interval_map = new Map();
var count = 0;
// 8.64e+7

module.exports = {
    startPotato: async function startPotato(client, guildId) {
        const create_query = 'CREATE TABLE IF NOT EXISTS Game (GuildID TEXT NOT NULL, ChannelID TEXT NOT NULL, RemainingPlayers TEXT NOT NULL, HasPotato TEXT NOT NULL, DatePotatoGiven TEXT NOT NULL, PRIMARY KEY (GuildID))';
        db.run(create_query)

        const state = gameState.getState(guildId);
        const guild = client.guilds.cache.get(guildId);
        const channel = client.channels.cache.get(state.lobbyChannelId);
        const baseTime = 24 * 60 * 60 * 1000;
        const players = state.players;

        if (!players || players.length <= 1) {
            await channel.send("Too few players in lobby.")
            state.started = false;
            state.starting = false;
            return;
        }

        state.started = true;
        state.starting = false;

        time_map.set(guild.id, baseTime);
        count_map.set(guild.id, 0);

        const rng  = Math.floor(Math.random() * players.length);
        const player_with_potato = players[rng];
        const date = new Date().toUTCString();

        const sql_query = 'INSERT INTO Game VALUES (?, ?, ?, ?, ?)';
        db.run(sql_query, [guild.id, channel.id, players.join(','), player_with_potato, date],
            async (err) => {
                if (err) {
                    // if (err.code === "SQLITE_CONSTRAINT") {
                    //     console.log(`[${guild.id}] Attempted to start duplicate game.`);
                    //     state.starting = false;
                    //     state.started = false;

                    //     if (!interaction.replied) {
                    //         await interaction.send({
                    //             content: "A game is already running.",
                    //             flags: MessageFlags.Ephemeral,
                    //         });
                    //     }

                    //     return;
                    // }

                    // console.error("SQLite Error: ", err);
                    // state.starting = false;
                    // state.started = false;

                    // if (!interaction.replied) {
                    //     await interaction.send({
                    //         content: "Database error while starting game.",
                    //         flags: MessageFlags.Ephemeral,
                    //     });
                    // }

                    // return;

                    console.error("SQLite Error:", err);
                    return;
                }

                await channel.send(`The hot potato game has started. <@${player_with_potato}> has the hot potato.`);

                this.timeFunc(guildId);
                const delay = time_map.get(guild.id);
                this.startCountdown(client, guildId, delay);
                clearTimeout(timeout_map.get(guild.id));
                const timeout = setTimeout(() => this.kickPlayer(client, guildId), delay);
                timeout_map.set(guild.id, timeout);
            }
        );
    },
    PassPotato: async function PassPotato(client, interaction, targetUser) {
        const correct_guild = interaction.guild.id;
        const channelID = interaction.channel.id;

        db.get("SELECT HasPotato FROM Game WHERE GuildID = ?", [correct_guild], async (err, column) => {
            if (err || !column) return;
            const player_with_potato = column.HasPotato;
            if(interaction.user.id !== player_with_potato){
                const holder_member = await interaction.guild.members.fetch(player_with_potato).catch(() => null);
                const holder_name = holder_member?.displayName ?? holder_member?.user.username ?? "Unknown Player";
                await interaction.followUp({content: `You do not have the potato. ${holder_name} has the potato.`, flags: MessageFlags.Ephemeral});
                return;
            }

            db.get("SELECT RemainingPlayers FROM Game WHERE GuildID = ?", [correct_guild], async (err, column) => {
                if (err || !column) return;
                let current_players_arr = column.RemainingPlayers.split(',');
                current_players_arr = current_players_arr.filter(id => id !== player_with_potato);

                if (!targetUser) {
                    await interaction.followUp({content: "User not found", flags: MessageFlags.Ephemeral});
                    return;
                }

                const check = current_players_arr.includes(targetUser.user.id);

                if (targetUser.id === interaction.user.id) {
                    await interaction.followUp({content: "You can't pass the hot potato to yourself", flags: MessageFlags.Ephemeral});
                    return;
                } else if (targetUser.user.bot) {
                    await interaction.followUp({content: "You can't pass the hot potato to a bot", flags: MessageFlags.Ephemeral});
                    return;
                } else if (!check) {
                    await interaction.followUp({content: "This user is currently not in the game", flags: MessageFlags.Ephemeral});
                    return;
                }

                const date = new Date().toUTCString();
                db.run("UPDATE Game SET ChannelID = ?, HasPotato = ?, DatePotatoGiven = ? WHERE GuildID = ?", 
                    [channelID, targetUser.user.id, date, correct_guild]);

                await interaction.followUp(`The hot potato has been passed to ${targetUser.user.username}`);

                this.timeFunc(correct_guild);
                const delay = time_map.get(correct_guild);
                this.startCountdown(client, correct_guild, delay);
                clearTimeout(timeout_map.get(correct_guild));
                const timeout = setTimeout(() => this.kickPlayer(client, correct_guild), delay);
                timeout_map.set(correct_guild, timeout);
            });
        });
    },
    PassRandomPotato: async function PassRandomPotato(client, interaction){
        const correct_guild = interaction.guild.id;
        const channelID = interaction.channel.id;

        db.get("SELECT HasPotato FROM Game WHERE GuildID = ?", [correct_guild], async (err, column) => {
            if (err || !column) return;
            const player_with_potato = column.HasPotato;
            if(interaction.user.id !== player_with_potato){
                const holder_member = await interaction.guild.members.fetch(player_with_potato).catch(() => null);
                const holder_name = holder_member?.displayName ?? holder_member?.user.username ?? "Unknown Player";
                await interaction.followUp({content: `You do not have the potato. ${holder_name} has the potato.`, flags: MessageFlags.Ephemeral});
                return;
            }

            db.get("SELECT RemainingPlayers FROM Game WHERE GuildID = ?", [correct_guild], async (err, column) => {
                if (err || !column) return;
                const current_players_arr = column.RemainingPlayers.split(',').filter(id => id !== player_with_potato);
                if (current_players_arr.length === 0) return;

                const rng = Math.floor(Math.random() * current_players_arr.length);
                const new_player_with_potato = current_players_arr[rng];

                const new_member = await interaction.guild.members.fetch(new_player_with_potato).catch(() => null);
                const new_player_name = new_member?.displayName ?? new_member?.user.username ?? "Unknown Player";

                const date = new Date().toUTCString();

                db.run("UPDATE Game SET ChannelID = ?, HasPotato = ?, DatePotatoGiven = ? WHERE GuildID = ?", 
                    [channelID, new_player_with_potato, date, correct_guild]);

                await interaction.followUp(`The hot potato has been passed to ${new_player_name}`);

                this.timeFunc(correct_guild);
                const delay = time_map.get(correct_guild);
                this.startCountdown(client, correct_guild, delay);
                clearTimeout(timeout_map.get(correct_guild));
                const timeout = setTimeout(() => this.kickPlayer(client, correct_guild), delay);
                timeout_map.set(correct_guild, timeout);
            });
        });
    },
    getPotatoHolder: async function getPotatoHolder(client, interaction){
        const correct_guild = interaction.guild.id;

        db.get("SELECT HasPotato FROM Game WHERE GuildID = ?", [correct_guild], async (err, column) => {
            if (err || !column) return;
            const member = await interaction.guild.members.fetch(column.HasPotato).catch(() => null);
            const player_name = member?.displayName ?? member?.user.username ?? "Unknown Player";
            interaction.followUp(`${player_name} has the potato`);
        });
    },
    gameEnded: async function gameEnded(client, guildId, winner_id = null){
        const state = gameState.getState(guildId);
        const guild = client.guilds.cache.get(guildId);
        const channel = client.channels.cache.get(state.lobbyChannelId);
        const correct_guild = guildId;
        const channelID = channel.id;

        if (countdown_interval_map.has(correct_guild)) {
            clearInterval(countdown_interval_map.get(correct_guild));
            countdown_interval_map.delete(correct_guild);
        }

        countdown_message_map.delete(correct_guild);
        clearTimeout(timeout_map.get(correct_guild));

        if (winner_id) {
            const member = await guild.members.fetch(winner_id).catch(() => null);
            const winner_name = member?.displayName ?? member?.user.username ?? "Unknown Player";
            await channel.send(`<@${winner_id}> (${winner_name}) is the winner!`);
        } else {
            db.get("SELECT RemainingPlayers FROM Game WHERE GuildID = ?", [correct_guild], async (err, column) => {
                if (err || !column) return;
                const winner_id = column.RemainingPlayers;
                const member = await guild.members.fetch(winner_id).catch(() => null);
                const winner_name = member?.displayName ?? member?.user.username ?? "Unknown Player";
                await channel.send(`<@${winner_id}> (${winner_name}) is the winner!`);
            });
        }
        
        state.started = false;
        state.starting = false;
        state.players = [];
        state.hostId = null;
        db.run("DELETE FROM Game WHERE GuildID = ?", [correct_guild]);
        time_map.delete(correct_guild);
        timeout_map.delete(correct_guild);
        count_map.delete(correct_guild);
    },
    kickPlayer: async function kickPlayer(client, guildId){
        const state = gameState.getState(guildId);
        const guild = client.guilds.cache.get(guildId);
        const channel = client.channels.cache.get(state.lobbyChannelId);

        const correct_guild = guildId;
        const channelID = channel.id;

        if (!guild || !channel) return;
        
        db.get("SELECT RemainingPlayers, HasPotato FROM Game WHERE GuildID = ?", [correct_guild], async (err, column) => {
            if (err || !column) return;
            let current_players_arr = column.RemainingPlayers.split(',');
            const player_with_potato = column.HasPotato;
            current_players_arr = current_players_arr.filter(id => id !== player_with_potato);

            const member_with_potato = await guild.members.fetch(player_with_potato).catch(() => null);
            const player_with_potato_name = member_with_potato?.displayName ?? member_with_potato?.user.username ?? "Unknown Player";

            if(current_players_arr.length === 1){
                const winner_id = current_players_arr[0];

                const member_winner = await guild.members.fetch(winner_id).catch(() => null);
                const winner_name = member_winner?.displayName ?? member_winner?.user.username ?? "Unknown Player";

                await channel.send(`${player_with_potato_name} is out. ${winner_name} has the potato.`)
                    .then(() => {
                        setTimeout(() => {
                            this.gameEnded(client, correct_guild, winner_id);
                        }, 200);
                    });
                return;
            }

            const rng = Math.floor(Math.random() * current_players_arr.length);
            const new_player_with_potato = current_players_arr[rng];

            const member_new_player_with_potato = await guild.members.fetch(new_player_with_potato).catch(() => null);
            const new_player_with_potato_name = member_new_player_with_potato?.displayName ?? member_new_player_with_potato?.user.username ?? "Unknown Player";

            const date = new Date().toUTCString();

            db.run("UPDATE Game SET ChannelID = ?, RemainingPlayers = ?, HasPotato = ?, DatePotatoGiven = ? WHERE GuildID = ?",
                [channelID, current_players_arr.join(','), new_player_with_potato, date, correct_guild]);

            await channel.send(`${player_with_potato_name} is out. ${new_player_with_potato_name} has the potato.`);

            // let count = count_map.get(correct_guild) ?? 0;
            // count++;
            // count_map.set(correct_guild, count);
            
            this.timeFunc(guildId);
            const delay = time_map.get(correct_guild);
            this.startCountdown(client, guildId, delay);
            clearTimeout(timeout_map.get(correct_guild));
            const timeout = setTimeout(() => this.kickPlayer(client, guildId), delay);
            timeout_map.set(correct_guild, timeout);
        });
    },
    getRemainingPlayers: async function getRemainingPlayers(client, interaction){
        const correct_guild = interaction.guild.id;

        db.get("SELECT RemainingPlayers FROM Game WHERE GuildID = ?", [correct_guild], async (err, column) => {
            if (err || !column) return;
            const ids = column.RemainingPlayers.split(',');
            const player_names = await Promise.all(ids.map(async (id) => {
                const member = await interaction.guild.members.fetch(id).catch(() => null);
                return (member?.displayName ?? member?.user.username ?? "Unknown Player");
            }));
            interaction.followUp("Players remaining: " + player_names.join(', '));
        });
    },
    endPotato: async function endPotato(client, interaction){
        const correct_guild = interaction.guild.id;
        if (countdown_interval_map.has(correct_guild)) {
            clearInterval(countdown_interval_map.get(correct_guild));
            countdown_interval_map.delete(correct_guild);
        }

        countdown_message_map.delete(correct_guild);
        db.run("DELETE FROM Game WHERE GuildID = ?", correct_guild);
        clearTimeout(timeout_map.get(correct_guild));
        time_map.delete(correct_guild);
        timeout_map.delete(correct_guild);
        count_map.delete(correct_guild);
        await interaction.reply("Force end game");
    },
    timeFunc: async function timeFunc(guildId){
        const baseTime = 24 * 60 * 60 * 1000;
        //const devBaseTime = 30000;
        const decayPercent = 0.10;
        const minTime = 5000;

        let count = count_map.get(guildId) ?? 0;

        const newTime = Math.max(Math.floor(baseTime * Math.pow(1 - decayPercent, count)), minTime);

        //const newTime = Math.max(Math.floor(devBaseTime * Math.pow(1 - decayPercent, count)), minTime);

        count++;
        
        count_map.set(guildId, count);
        time_map.set(guildId, newTime);

        console.log(`[${guildId}] Timer updated → ${(newTime / 1000).toFixed(2)}s (count: ${count})`);
    },
    startCountdown: async function startCountdown(client, guildId, totalMs){   
        const state = gameState.getState(guildId);
        const channel = client.channels.cache.get(state.lobbyChannelId);
        
        if (countdown_interval_map.has(guildId)){
            clearInterval(countdown_interval_map.get(guildId));
            countdown_interval_map.delete(guildId);
        }

        const endTime = Date.now() + totalMs;

        let message = countdown_message_map.get(guildId);

        const remainingSeconds = Math.ceil(totalMs / 1000);

        if (!message) {
            message = await channel.send(`Hot Potato Timer \n${this.formatTime(remainingSeconds)} remaining\n${this.progressBar(totalMs, totalMs)}`);
            countdown_message_map.set(guildId, message);
        } else {
            await message.edit(`Hot Potato Timer \n${this.formatTime(remainingSeconds)} remaining\n${this.progressBar(totalMs, totalMs)}`);
        }
        
        const interval = setInterval(async () => {
            const remainingMs = Math.max(0, endTime - Date.now());
            const remainingSeconds = Math.ceil(remainingMs / 1000);

            if (remainingMs <= 0) {
                clearInterval(interval);
                countdown_interval_map.delete(guildId);
                return;
            }

            try {
                await message.edit(
                    `Hot Potato Timer \n${this.formatTime(remainingSeconds)} remaining\n${this.progressBar(remainingMs, totalMs)}`
                );
            } catch {
                clearInterval(interval);
                countdown_interval_map.delete(guildId);
            }
        }, 1000);

        countdown_interval_map.set(guildId, interval);
    },
    progressBar: function progressBar(remainingMs, totalMs, size = 10){
        const filled = Math.round((remainingMs / totalMs) * size);
        return "█".repeat(filled) + "░".repeat(size - filled);
    },
    formatTime: function formatTime(totalSeconds){
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const parts = [];

        if (hours > 0) {
            parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
        }

        if (minutes > 0) {
            parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
        }

        if (seconds > 0 || parts.length === 0) {
            parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);
        }

        return parts.join(", ");
    }
};
