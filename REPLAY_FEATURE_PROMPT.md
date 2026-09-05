# Prompt: game replay viewer + AI thinking indicator

Paste/reference this in a Claude Code session opened in `rd-frontend`.

---

Build two features in this React 18 + TypeScript app (game state arrives via socket.io `gameUpdated` events and the REST API from rd-backend):

## 1. Replay viewer (single-player AND multiplayer)

Players need to walk backward/forward through everything that has happened in the current game, because AI turns currently render only the final board — the AI's ball passes are invisible, so it looks like the AI moves while holding the ball (illegal).

**Backend data (already exists, no backend changes needed):** each entry in `game.moveHistory` is:

```ts
{
  turnNumber: number,
  player: 'white' | 'black',
  pieceMove?: { from: string, to: string },      // algebraic squares, e.g. "d3"
  ballPass?: { from: string, to: string },        // legacy single-pass field
  ballPasses?: { from: string, to: string }[],    // full pass list, in order
  actionStates?: {                                // one entry PER ACTION, in order
    actionType: 'pieceMove' | 'ballPass',
    pieceMove?: { from: string, to: string },
    ballPass?: { from: string, to: string },
    boardSnapshot: Board,                         // full board AFTER this action
  }[],
  boardSnapshot: Board,                           // full board after the whole turn
}
```

`Board` is the same shape as `game.currentBoardStatus`: keys `a1`–`h8`, values `null` or `{ color, hasBall, position, id }`.

**Requirements:**
- Left/Right arrow keys (plus visible ◀ ▶ buttons) step one **action** at a time — each pass and each piece move is its own step, rendered from its `boardSnapshot`. Stepping through an AI turn shows every pass sequentially.
- **Caveat:** AI-generated turns always have `actionStates`; human turns may not (the client built those entries). Where `actionStates` is missing or empty, fall back to one step per turn using the entry's top-level `boardSnapshot` — or derive intermediate boards by applying `pieceMove`/`ballPasses` in order to the previous snapshot if that's easy with existing board utils.
- While not at the latest position, the board is in "replay mode": show a clear indicator (e.g. "Reviewing turn 4 of 12"), block move input, and offer a one-click/Escape return to live. Snap to live automatically when a new `gameUpdated` arrives ONLY if the user was already at the end.
- Works identically in AI games and multiplayer. Keyboard handling must not fire while the user is typing in the chat input.

## 2. AI "thinking" indicator

The hard/impossible AI takes up to ~6s per move; easy is near-instant. Between the human's move submission and the `gameUpdated` carrying the AI's reply, show a lightweight thinking state (e.g. subtle pulse on the AI's side, "thinking…" label). No backend event exists for "AI started thinking" — infer it: it's the AI's turn and no update has arrived yet. Also handle multiplayer gracefully (show "waiting for opponent" instead, if a waiting state doesn't already exist).

## Acceptance
- Stepping through a recorded AI turn shows the ball hopping pass-by-pass, never a carrier moving with the ball.
- Arrow keys scrub the full game from move 1 in both game modes.
- During AI computation the board visibly indicates thinking; when the reply lands, replay history includes the new turn.
- No regressions to normal live play or chat.
