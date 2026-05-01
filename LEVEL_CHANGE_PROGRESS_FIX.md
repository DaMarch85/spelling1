# Level-change progress preservation fix

This fixes a bug where clicking a different level rebuilt the whole app state with `makeInitialState(level)`.
That reset local points, battle points, recently bought cards, mastered words, and correct spelling counts before the next save/sync.

The new behaviour changes only the active spelling level. It keeps:

- shop points
- lifetime points
- battle points
- owned cards
- unlocked packs
- mastered words
- correct spellings
- word progress from other levels

It also stops the app from deleting saved progress for words outside the currently selected level when loading from localStorage/Supabase.

No Supabase SQL change is needed.
