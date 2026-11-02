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

# Rules
- Admin access is the `admin` row in `user_roles`, checked via `has_role`; public sign-up is disabled so admins are only added by owners (Users panel) — prevents self-promotion.
- `/admin` is a client-only (`ssr: false`) layout whose `beforeLoad` checks the admin role; `/admin/login` is exempted inside it — session lives in localStorage.
- Orders must be written server-side with prices recomputed from the database — never trust browser prices.
- Uploaded images go to the private `product-images` bucket (workspace blocks public buckets); the app stores a long-lived signed URL in the row, and public pages overlay `products.image_url` onto the static menu via `getProductImages` until the menu reads fully from the database.
- Motion utilities (press, chip, tab-enter, page-enter, pop-in, stagger-in, lift-card) live in src/styles.css; reuse them instead of ad hoc animations.
