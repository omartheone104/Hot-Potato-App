const gameStates = {};

const getState = (guildId) => {
    if (!gameStates[guildId]) {
        gameStates[guildId] = { started: false, starting: false };
    }
    return gameStates[guildId];
};

const resetState = (guildId) => {
    gameStates[guildId] = { started: false, starting: false };
};

module.exports = { getState, resetState };
