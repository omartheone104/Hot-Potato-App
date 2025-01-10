const gameStates = {};

const getState = (guildId) => {
    if (!gameStates[guildId]) {
        gameStates[guildId] = { started: false };
    }
    return gameStates[guildId];
};

const resetState = (guildId) => {
    gameStates[guildId] = { started: false };
};

module.exports = { getState, resetState };
