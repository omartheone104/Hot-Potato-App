# Hot Potato Discord Bot

A real-time multiplayer **Hot Potato game bot** built for Discord using Node.js. Players join a lobby, pass the “hot potato” to each other, and try not to be holding it when the timer runs out.

Every round is unpredictable — timing, targeting, and quick decisions determine who survives.

---

## Release

**Hot Potato Bot v1.0 is now live**

This release includes the full core gameplay loop:

- Lobby creation and player joining
- Real-time potato passing system
- Countdown-based elimination mechanic
- Interactive Discord UI (buttons + slash commands)
- Fully automated round handling
- Stable game state management

The bot is designed for small to medium Discord communities looking for quick, competitive mini-games that don’t require setup beyond joining a lobby.

---

## Gameplay Overview

1. Players join a lobby
2. A match begins automatically when ready
3. One player starts with the hot potato
4. Pass it to another player using `/pass`
5. The timer steadily runs down…
6. Whoever holds it at zero is eliminated
7. Repeat until one winner remains

---

## Key Features

- Strategic passing mechanics
- Dynamic countdown pressure
- Multiplayer lobby system
- Automated round progression
- Robust game state handling
- Fast, event-driven Discord interactions

---

## Built With

- Node.js
- Discord.js v14
- Event-driven architecture
- In-memory game state system

---

## Status

Future updates planned (leaderboards and better performance)