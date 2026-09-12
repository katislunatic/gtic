# Fix "Invalid OAuth2 redirect_uri" on Discord login

## Root cause
Discord only allows redirects to URLs explicitly registered in your Discord app's OAuth2 settings. The site sends its own origin + `/discord-callback`. Because the live site is hosted on Netlify (`https://gtecleague.netlify.app/`), that exact redirect URL must be added to Discord; otherwise Discord rejects the login with the error in your screenshot.

## Fix (in the Discord Developer Portal)
1. Go to https://discord.com/developers/applications and open the app whose Client ID/Secret you saved.
2. Open **OAuth2** → **Redirects**.
3. Add this URL and click **Save Changes**:
   - `https://gtecleague.netlify.app/discord-callback` (the real Netlify site)
4. Optional — if you also want to test Discord login inside the Lovable editor preview, add this second URL:
   - `https://id-preview--abcb8247-23b6-4ce8-8656-a55611faf2cb.lovable.app/discord-callback`
5. Retry the Discord login from the Settings menu on the Netlify site.

## Why no code change is needed
- `src/hooks/use-discord-auth.ts` already passes `window.location.origin + '/discord-callback'` to the edge function.
- `supabase/functions/discord-auth/index.ts` already forwards that redirect URI to Discord.
- When the site runs on Netlify, `window.location.origin` is `https://gtecleague.netlify.app`, so once that URL is registered the flow will work.

## Verification
- I'll test the generated Discord authorize URL and confirm it lands on Discord's consent page instead of the "Invalid OAuth2 redirect_uri" screen.

## Note
- If you later add a custom domain to the Netlify site, you'll need to add that domain's `/discord-callback` URL to Discord too.
