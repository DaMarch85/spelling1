# Progress sync fix

This update hardens progress saving so users are much less likely to lose points, battle points, cards, or mastered-word progress after closing and reopening the browser.

## What was going wrong

The app stored progress in both localStorage and Supabase. When a signed-in user reopened the app, the old Supabase `user_progress.state` could overwrite newer local progress before the newer local progress had finished syncing.

Cards also had two sources of truth: `state.ownedCards` and the `user_cards` table. The old code replaced local cards with Supabase cards. If a local purchase had not finished syncing yet, that card could disappear on the next refresh/sign-in.

## What changed

- Local progress now records `lastUpdatedAt`.
- The app now merges local and Supabase progress instead of blindly replacing one with the other.
- Points, lifetime points, battle points, unlocked levels, unlocked packs, word progress, and card ownership are all merged conservatively.
- Cards from Supabase and cards from local progress are merged rather than replaced.
- Local cards that do not yet have a Supabase `user_cards.id` are inserted into Supabase after sign-in.
- Critical changes such as buying a card, spending a battle point, assigning a battle attack, and correct spelling are pushed to Supabase more quickly.
- The app writes localStorage immediately when the page is hidden or closed.

## Note

If a user plays in an incognito/private window and closes all incognito windows before Supabase sync completes, the browser may delete localStorage. Normal browser windows should now recover much more reliably by merging local and remote state.
