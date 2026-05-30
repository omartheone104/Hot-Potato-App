const gameStates = {};

const createDefaultState = () => ({
    started: false,
    starting: false,
    hostId: null,
    lobbyMessageId: null,
    players: [],
    currentHolder: null,
    potatoTimeout: null,
    countdownMessageId: null,
    lobbyTimeout: null,
    lobbyChannelId: null,
});

const getState = (guildId) => {
    if (!gameStates[guildId]) {
        gameStates[guildId] = createDefaultState();
    }
    return gameStates[guildId];
};

const resetState = (guildId) => {
    const state = gameStates[guildId];

    if (!state) return;

    if (state.potatoTimeout) {
        clearTimeout(state.potatoTimer);
    }

    if (state.lobbyTimeout) {
        clearTimeout(state.lobbyTimeout);
    }

    gameStates[guildId] = createDefaultState();
};

module.exports = { getState, resetState };
