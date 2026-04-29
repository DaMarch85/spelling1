# Battle point waiting-room fix

Upload `src/app.js` to GitHub and redeploy Cloudflare.

This changes battle point spending so:
- creating a waiting battle does not spend a battle point
- the joining player spends a battle point immediately because the battle matches straight away
- the waiting player spends a battle point only once an opponent joins and the battle becomes ready
- no Supabase SQL change is required
