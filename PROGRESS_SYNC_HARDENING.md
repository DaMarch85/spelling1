# Progress sync hardening

This update fixes the main ways progress could go backwards after a browser close/reopen.

## Problems fixed

1. Remote progress previously replaced local progress outright. If Supabase had an older copy, mastered words could reset.
2. Card purchases previously spent points before the Supabase card row was confirmed. If the card insert failed, the user could lose points without the card being safely saved online.
3. Loading cards from Supabase previously replaced the local card list. If a recently bought local card had not made it to Supabase yet, it could disappear.

## New behaviour

- Local and Supabase progress are merged instead of one overwriting the other.
- Mastered words stay mastered if either local or remote progress says mastered.
- Card collections are merged by card instance id when possible.
- Spendable shop points are recalculated from lifetime earned points minus shop-purchased cards, which avoids keeping a card while also losing the points spent on it.
- For signed-in users, a card purchase now only spends points after the Supabase card insert succeeds.
- Progress is saved locally immediately and flushed again when the page is hidden or closed.

No Supabase SQL is required.
