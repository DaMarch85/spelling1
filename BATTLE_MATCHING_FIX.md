# Battle matching fix

Upload `src/app.js` to GitHub and redeploy Cloudflare.

What changed:

- If two users enter the arena at about the same time, they no longer both sit in separate waiting rooms forever.
- While a user is waiting, the app now periodically looks for an older waiting battle from another user.
- The newer waiting user joins the older waiting user, cancels their own waiting room, and the battle starts.
- Battle points are still only spent once the match actually starts.

After deployment, users should refresh the site before testing battles again.

Optional cleanup:

Run `supabase_clear_waiting_battles.sql` once if you want to clear the currently stuck waiting battles from earlier tests.
