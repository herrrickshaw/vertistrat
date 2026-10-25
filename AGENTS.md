<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Site content/config constants (URLs, flags, disclaimer) live in src/config.ts so non-developers edit one file.
- Blogger feed is loaded via JSONP (alt=json-in-script) because Blogger sends no CORS headers.
- Shared header/footer render in src/routes/__root.tsx; page sections use helpers in src/components/site/ui.tsx.
