# Auction API requirements

This document is derived from the auction UI in `app/(site)/auctions` and the mock service in `lib/auction/store.ts`. The frontend currently persists auctions in `localStorage` under `cricshub.auctions.v1`. Nothing here is a live server.

The backend is the authority for auction status, bids, purse, and player ownership. The browser checks are only to keep the console responsive.

## A. Conventions that need backend agreement

These are proposals, not settled platform standards.

| Topic | Proposal |
| --- | --- |
| Host | `https://api.cricshub.com` |
| Base path | `https://api.cricshub.com/api/v1/auctions` |
| Auth | Same session as the rest of CricsHub: httpOnly JWT cookie, `credentials: include` |
| Content type | `application/json` except CSV import and export |
| Timestamps | ISO-8601 UTC (`2026-10-18T08:30:00.000Z`). Display them in `auction.timezone` |
| Money | Integer rupees. No paise. The UI formats with `en-IN` currency |
| Ids | Opaque strings. The mock uses prefixes (`auc_`, `team_`, `plyr_`, `bid_`, `evt_`) but the server may use UUIDs |
| Errors | `{ "error": { "code": "INSUFFICIENT_PURSE", "message": "MUM does not have enough purse for ₹1,25,000." } }` with 4xx/5xx |
| Validation | `422` with `{ "error": { "code": "VALIDATION", "fields": [{ "path": "rules.maxSquad", "message": "..." }] } }` |
| Pagination | `?page=1&pageSize=6` and `{ "items": [], "page": 1, "pageSize": 6, "total": 24 }` |
| Sorting | `?sort=updatedAt` or `?sort=-startsAt` (leading `-` is descending) |
| Idempotency | `Idempotency-Key` header on bid, sell, unsold, defer, undo, start, complete. Replaying the same key returns the original result and does not apply the action twice |
| Concurrency | `If-Match: "<revision>"` or a `revision` integer on the auction. A stale console gets `409 STALE_STATE` and must refetch |

`resetDemo` is a frontend-only helper. Do not implement it on the server.

## B. Permissions

Keep the first version to two roles. Team representatives do not bid directly in this UI.

| Role | Who | Can |
| --- | --- | --- |
| `auctioneer` | Authenticated user who created the auction | Create, edit drafts, publish, start, pause, resume, bid on behalf of a team, sell, unsold, defer, reopen, withdraw, undo, complete, cancel, archive, export |
| `viewer` | Signed-in user with the spectator link | Read auction state, teams, current lot, recent sales. No mutations |

`visibility: "private"` means only the auctioneer can open the spectator route. `visibility: "link"` means any signed-in viewer with the id can open `GET /auctions/{id}/live`. Unauthenticated public access is not in the current UI (the whole `/auctions` tree is behind the site session). Confirm with the product team before making spectator routes anonymous.

Not in this version: a team representative submitting their own bid. If that is added later, the auctioneer console should still be the only place that finalises a sale.

## C. Auction lifecycle

```
draft → scheduled → live ⇄ paused → completed
draft → cancelled
scheduled → cancelled
live/paused → cancelled   only when no player is sold
any non-live → archived   archive is a flag, not a status
```

| Status | Setup edits | Console |
| --- | --- | --- |
| `draft` | Yes | No |
| `scheduled` | Yes | Start only |
| `live` | No | Bid, sell, unsold, defer, next, undo, pause, end |
| `paused` | No | Resume, undo. Lot changes are rejected until resume |
| `completed` | No | Read only |
| `cancelled` | No | Read only |

Player states: `available → in_auction → sold | unsold | deferred`. `unsold` and `deferred` can return to `available` (reopen). `available`, `unsold`, and `deferred` can become `withdrawn` when the lot is not on the block. `sold` cannot be withdrawn. `in_auction` cannot be withdrawn until the lot is finished.

## D. Derived money

Store bids and sales. Do not trust a client-supplied "remaining purse".

- Team budget = `purseOverride` if set, otherwise `rules.pursePerTeam`
- Spent = sum of `soldPrice` for players with `status = sold` and `soldToTeamId = team`
- Remaining = budget − spent

The same figures are shown on the team list, team drawer, live buttons, spectator list, and results.

## E. Endpoints

### Auctions

#### `GET /api/v1/auctions`

Dashboard list. Query: `q`, `status` (`draft|scheduled|live|paused|completed|cancelled|archived`), `sort` (`updatedAt|startsAt|name`), `page`, `pageSize`.

Auctioneer sees their own auctions. Response items are summaries:

```json
{
  "items": [
    {
      "id": "auc_harbour",
      "name": "Harbour T20 player auction",
      "tournament": "Harbour T20",
      "status": "live",
      "archived": false,
      "startsAt": "2026-10-18T08:30:00.000Z",
      "timezone": "Asia/Kolkata",
      "teamCount": 8,
      "playerCount": 16,
      "updatedAt": "2026-10-18T08:41:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 6,
  "total": 4
}
```

Dashboard stats (all / upcoming / live-or-paused / completed) are counted from this list in the UI. The server may also return them as `counts` so the header does not depend on the current page.

#### `POST /api/v1/auctions`

Creates a draft and returns the auction. Used by **New auction**, which then opens setup.

```json
{
  "name": "Sunday Smash",
  "tournament": "Sunday Smash",
  "description": "",
  "startsAt": "2026-12-06T07:30:00.000Z",
  "timezone": "Asia/Kolkata",
  "visibility": "private",
  "format": "player"
}
```

`format` is always `player` in this UI.

#### `GET /api/v1/auctions/{auctionId}`

Full auction for overview, setup, console, and spectator: rules, teams, players, bids, events, `currentPlayerId`, clock fields (`startedAt`, `pausedAt`, `pausedMs`, `endedAt`).

Spectator responses must omit nothing the watch page renders, but must not include a write capability. Prefer the same body plus the caller's `role`.

#### `PATCH /api/v1/auctions/{auctionId}`

Setup step 1. Allowed in `draft` and `scheduled` only. Body matches the create fields. `409 AUCTION_LOCKED` after start.

#### `PUT /api/v1/auctions/{auctionId}/rules`

Setup step 2. Same lock as PATCH.

```json
{
  "pursePerTeam": 2000000,
  "minSquad": 11,
  "maxSquad": 15,
  "overseasLimit": 2,
  "allowPurseOverride": true,
  "increments": [
    { "upTo": 100000, "step": 10000 },
    { "upTo": 500000, "step": 25000 },
    { "upTo": null, "step": 50000 }
  ],
  "roleLimits": [
    { "role": "WK", "min": 1, "max": 3 },
    { "role": "BAT", "min": 3, "max": null },
    { "role": "BOWL", "min": 3, "max": null },
    { "role": "AR", "min": 1, "max": null }
  ]
}
```

`overseasLimit: null` means no cap. `roleLimits[].max: null` means no maximum. Reject `step <= 0`, `pursePerTeam <= 0`, and `maxSquad < minSquad`.

#### `POST /api/v1/auctions/{auctionId}/validate`

Review step. Returns `{ "issues": [{ "step": "teams", "message": "Add at least two teams." }] }`. `step` is `details | rules | teams | players`. Empty `issues` means publish is allowed.

#### `POST /api/v1/auctions/{auctionId}/publish`

Draft → scheduled. `422` with the first config issue if invalid. Writes an `published` audit event.

#### `POST /api/v1/auctions/{auctionId}/start`

Scheduled → live, then presents the first `available` player (lowest `queueOrder`). One transaction. If the queue is empty, change nothing and return `422`.

#### `POST /api/v1/auctions/{auctionId}/pause` and `/resume`

Live ↔ paused. Resume adds the paused duration to `pausedMs` and clears `pausedAt`. The UI clock is `(now or pausedAt or endedAt) - startedAt - pausedMs`.

#### `POST /api/v1/auctions/{auctionId}/complete`

Live or paused → completed. Reject with `409 LOT_OPEN` if the current player is `in_auction`. Reject with `409 PLAYERS_WAITING` if any player is `available` or `deferred`.

#### `POST /api/v1/auctions/{auctionId}/cancel`

Reject when status is completed or cancelled. Reject when live/paused and any player is sold (`409 SALES_EXIST`). Undo those sales first.

#### `POST /api/v1/auctions/{auctionId}/archive`

Sets `archived: true`. Reject while live or paused. Does not delete events or sales.

### Teams

#### `POST /api/v1/auctions/{auctionId}/teams`

```json
{
  "name": "Mumbai Strikers",
  "shortName": "MUM",
  "ownerName": "Rohan Mehta",
  "color": "#1E88E5",
  "purseOverride": null
}
```

Allowed only before start. `409` on duplicate name or short name (case-insensitive). `422` if `purseOverride` is set while `allowPurseOverride` is false, or if it is `<= 0`.

#### `PATCH /api/v1/auctions/{auctionId}/teams/{teamId}`

Same body and rules. Locked after start.

#### `DELETE /api/v1/auctions/{auctionId}/teams/{teamId}`

Locked after start. No history is rewritten because the team has no sales yet.

#### `GET /api/v1/auctions/{auctionId}/teams/{teamId}`

Team plus derived `budget`, `spent`, `remaining`, squad players, and events whose payload mentions the team or one of its players. This is the team drawer.

### Players

#### `POST /api/v1/auctions/{auctionId}/players`

```json
{
  "name": "Ishaan Nair",
  "role": "AR",
  "nationality": "India",
  "overseas": false,
  "category": "B",
  "basePrice": 50000,
  "matches": 30,
  "battingAvg": "18.2",
  "bowlingAvg": "27.1"
}
```

Roles are `BAT | BOWL | AR | WK`. Duplicate names among non-withdrawn players are rejected. `basePrice` must be `> 0`. Server assigns `queueOrder` at the end and `status: "available"`. Allowed only before start.

There is no global player directory in this UI. A player belongs to one auction.

#### `PATCH /api/v1/auctions/{auctionId}/players/{playerId}`

Same fields. Locked after start. Cannot edit a sold player.

#### `DELETE /api/v1/auctions/{auctionId}/players/{playerId}`

Only before start, and never a sold player. After start the UI calls withdraw instead.

#### `POST /api/v1/auctions/{auctionId}/players/import`

`text/csv` or `{ "csv": "..." }`. Header row optional:

`name,role,nationality,overseas,category,basePrice,matches,battingAvg,bowlingAvg`

The UI previews with a client parse, then imports valid rows and reports skipped duplicates. The server must re-validate. Suggested response:

```json
{
  "imported": 2,
  "errors": [{ "row": 3, "message": "Liam Hart is already in this auction and was skipped." }]
}
```

`overseas` accepts yes/no, true/false, 1/0. Role aliases the UI accepts (`BATTER`, `BOWLER`, `ALL-ROUNDER`, `WICKETKEEPER`) should be accepted by the server too.

#### `GET /api/v1/auctions/{auctionId}/players`

Query used by the players table: `q` (name), `role`, `status`, `category`, `sort` (`queueOrder|basePrice|name`). The UI filters client-side today; the server should still support these filters for larger pools.

#### `POST /api/v1/auctions/{auctionId}/players/{playerId}/withdraw`

Body empty. Allowed from `available`, `unsold`, or `deferred` while the auction is editable, live, or paused. Reject `sold` and `in_auction`. The players table can send one request per selected id. Each failure is reported on its own; the UI counts failures.

#### `POST /api/v1/auctions/{auctionId}/players/{playerId}/reopen`

`unsold` or `deferred` → `available`, appended to the queue. Only while live or paused.

### Live lot and bids

All of these require `auctioneer`. Paused auctions reject them with `409 PAUSED` except undo, which the console still allows.

#### `POST /api/v1/auctions/{auctionId}/lots/next`

Presents the next `available` player. Reject `409 LOT_OPEN` if someone is already `in_auction`. Sets that player to `in_auction` and `currentPlayerId`. Event type `presented`.

#### `POST /api/v1/auctions/{auctionId}/bids`

The client does **not** send an amount. The server computes it: base price if there is no active bid, otherwise current amount + the increment slab that applies to the current amount (`step` while `amount < upTo`; a null `upTo` is the open-ended slab).

```json
{ "teamId": "team_mum" }
```

```json
{
  "bid": {
    "id": "bid_01",
    "playerId": "plyr_dev",
    "teamId": "team_mum",
    "amount": 125000,
    "at": "2026-10-18T08:42:01.000Z",
    "voided": false
  },
  "auctionRevision": 18
}
```

Reject when:

| Code | Case |
| --- | --- |
| `409 PAUSED` / `409 NOT_LIVE` | Auction is not live |
| `409 NO_LOT` | No player is `in_auction` |
| `409 INSUFFICIENT_PURSE` | Remaining purse is below the next amount |
| `409 SQUAD_FULL` | Team already has `maxSquad` sold players |
| `409 OVERSEAS_LIMIT` | Player is overseas and the team is at `overseasLimit` |
| `409 ROLE_LIMIT` | Team is at that role's `max` |
| `409 DUPLICATE` | Same team, player, and amount was stored in the last few hundred milliseconds, or the idempotency key was reused |
| `409 STALE_STATE` | Optional `expectedAmount` does not match the server's next amount (send it if you add it; the current UI does not) |
| `409 ALREADY_SOLD` | Player is already sold |

Two bids at once: lock the auction row (or the current lot) inside one database transaction. The second request either becomes the next legal increment after the first commits, or returns `409 STALE_STATE` / `409 DUPLICATE`. Never let both win the same amount.

#### `POST /api/v1/auctions/{auctionId}/lots/sell`

Sells the current player to the team on the latest non-voided bid, at that amount. Re-check purse, squad, overseas, and role limits inside the transaction. Reject `409 NO_BID` when nobody has bid. Set `status: sold`, `soldToTeamId`, `soldPrice`. Leave `currentPlayerId` pointing at the sold player until the next lot is called. The console shows the sale and disables bidding.

#### `POST /api/v1/auctions/{auctionId}/lots/unsold`

Only when the current player is `in_auction` and has no active bid. Otherwise `409 HAS_BIDS` with the message the UI shows: undo the bids or sell.

#### `POST /api/v1/auctions/{auctionId}/lots/defer`

Only with no active bid. Sets `deferred`, clears `currentPlayerId`, moves `queueOrder` to the end.

#### `POST /api/v1/auctions/{auctionId}/undo`

Reverts the latest non-reverted event of type `presented | bid | sold | unsold | deferred | reopened | withdrawn`.

- Bid: mark that bid `voided`. Do not delete it.
- Sold or unsold: player returns to `in_auction`, sale fields clear, `currentPlayerId` restored. Bids stay.
- Presented: only if that player has no active bids; restore the previous status and previous `currentPlayerId`.
- Deferred / reopened / withdrawn: restore the previous status (and previous queue order for defer).

Append an `undo` event that names the target event id. Do not delete the original event; set `reverted: true`. Reject when nothing reversible remains. A second undo walks back one more action.

### Results

#### `GET /api/v1/auctions/{auctionId}/results`

Team squads, spent, remaining, sold and unsold lists, role counts. Same numbers as the results tab. Safe to call before completion; the UI labels them as still changing.

#### `GET /api/v1/auctions/{auctionId}/results.csv`

Columns the export button writes: `team,player,role,soldPrice,basePrice`. One row per sold player.

#### `GET /api/v1/auctions/{auctionId}/events`

Activity timeline, newest first. Include `reverted` so the UI can strike through undone lines. Query `limit` (the console shows 12, settings shows the full list).

## F. Real-time

Use one WebSocket (or SSE) channel per auction: `auction.{auctionId}`.

Subscribe after `GET /auctions/{id}`. Authenticate with the same session. Private auctions reject viewers who are not the auctioneer.

Events the console and spectator view need:

| Event | When |
| --- | --- |
| `auction.bid` | A bid is stored |
| `auction.sold` | A sale is stored |
| `auction.unsold` | A player is unsold |
| `auction.presented` | The lot changes |
| `auction.deferred` | A player is deferred |
| `auction.status` | pause, resume, start, complete, cancel |
| `auction.undone` | An undo commits |
| `auction.activity` | Any audit line, if you would rather send one generic event |

Payload: `{ "eventId", "type", "at", "auctionRevision", "auction": { ...same shape as GET } }`. Sending the full auction document is enough for this UI. Do not make the client patch purses itself.

Ordering: `auctionRevision` increases by 1 per committed mutation. On reconnect, if the client's revision is behind, refetch `GET /auctions/{id}` and resubscribe. Ignore events whose revision is older than the client's. Duplicate `eventId`s are ignored.

The dashboard list does not need a socket. Refresh on focus or poll every 15–30 seconds.

The mock uses a `storage` event so two tabs in one browser stay aligned. That is not a server.

## G. Data model

```
Auction 1—* AuctionTeam
Auction 1—* AuctionPlayer
Auction 1—* Bid
Auction 1—* AuctionEvent
AuctionPlayer *—1 AuctionTeam   (soldToTeamId, nullable)
Bid *—1 AuctionPlayer
Bid *—1 AuctionTeam
```

Auction: `id`, `ownerUserId`, `name`, `tournament`, `description`, `startsAt`, `timezone`, `format` (`player`), `visibility` (`private|link`), `status`, `archived`, `rules` (json or child table), `currentPlayerId`, `createdAt`, `updatedAt`, `publishedAt`, `startedAt`, `pausedAt`, `pausedMs`, `endedAt`, `revision`.

Unique: `(auctionId, lower(team.name))`, `(auctionId, lower(team.shortName))`, `(auctionId, lower(player.name))` where status ≠ withdrawn.

Bid: `id`, `auctionId`, `playerId`, `teamId`, `amount`, `at`, `voided`, `idempotencyKey`.

Event: `id`, `auctionId`, `type`, `at`, `message`, `payload` (json), `reverted`.

Do not store `spent` or `remaining` as source of truth. A cache column is fine only if the sale transaction updates it in the same commit.

Player photos and team logo files are not in the UI. A later `photoUrl` / `logoUrl` can be added without changing bid rules. The UI uses a colour chip and the player's name.

## H. Screen to API map

| Screen | Action | API |
| --- | --- | --- |
| `/auctions` | Load list and counts | `GET /auctions` |
| `/auctions` | Search, status, sort, page | `GET /auctions?q&status&sort&page` |
| `/auctions` | New auction | `POST /auctions` then open setup |
| `/auctions` | Start | `POST /auctions/{id}/start` |
| `/auctions` | Archive | `POST /auctions/{id}/archive` |
| `/auctions/{id}/setup` details | Save and continue | `PATCH /auctions/{id}` |
| Setup rules | Save rules | `PUT /auctions/{id}/rules` |
| Setup teams | Add, edit, remove | `POST/PATCH/DELETE .../teams` |
| Setup players | Add, edit, remove | `POST/PATCH/DELETE .../players` |
| Setup players | Preview CSV | Client parse; server rechecks on import |
| Setup players | Import | `POST .../players/import` |
| Setup review | Show issues | `POST .../validate` |
| Setup review | Publish | `POST .../publish` |
| `/auctions/{id}` overview | Start, or open console | `POST .../start`, then live GET |
| Overview teams | Open a team | `GET .../teams/{teamId}` |
| Players table | Filter and sort | `GET .../players` |
| Players table | Withdraw selected | `POST .../players/{id}/withdraw` per id |
| Players table | Reopen | `POST .../players/{id}/reopen` |
| Rules tab | Read | `GET /auctions/{id}` |
| Results | Read and CSV | `GET .../results` and `GET .../results.csv` |
| Settings | Cancel or end | `POST .../cancel` or `POST .../complete` |
| Settings | Activity | `GET .../events` |
| `/auctions/{id}/live` | Load | `GET /auctions/{id}` + socket |
| Live | Pause, resume, undo, end | matching `POST`s |
| Live | Team button or key 1–N | `POST .../bids` `{ teamId }` |
| Live | Mark sold / unsold / defer / next | `POST .../lots/sell|unsold|defer` and `.../lots/next` |
| `/auctions/{id}/watch` | Read-only | `GET /auctions/{id}` + socket, role `viewer` |

## I. Build order

1. Auction CRUD, rules, teams, players, validate, publish. Unblocks setup.
2. Start, present next, bid, sell, unsold, purse checks, events. Unblocks the console.
3. Pause, resume, defer, reopen, withdraw, undo. Unblocks corrections.
4. Complete, cancel, archive, results, CSV.
5. WebSocket snapshot events and revision checks.
6. Viewer role for `visibility: link`.

Bid, sell, and undo must run in a single database transaction with a row lock on the auction. Idempotency keys are required on those three before more than one auctioneer device is supported.

## J. Open questions

- Should a spectator link work without a CricsHub login? The UI is behind the site session today.
- Should team representatives bid from their own session, or only the auctioneer, as built?
- Are purses always INR, or will a points mode be required?
- Is a player pool shared across auctions, or copied into each auction, as built?
- After completion, may an auctioneer void a single sale without undoing everything after it? The UI only undoes the latest reversible action, and only while live or paused.
