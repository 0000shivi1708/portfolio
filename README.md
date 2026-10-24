# Shivangi Shukla — IAM Engineer portfolio

Personal portfolio for UK IAM roles. One uniform system: ivory canvas, one card style (header strip + body), one section template (numbered rule, heading left, intro right), burgundy accents, behind a light interactive identity graph:

```
Hero (identity record, status Active, + key numbers) → 01 Migration → 02 Selected work → 03 Experience → 04 Skills (filter by employer) → 05 Credentials → 06 Contact
```

Plain **HTML / CSS / JavaScript**. No build step and no dependencies apart from Google Fonts (Bodoni Moda for headings and numbers, Hanken Grotesk for everything else). The site works with JavaScript turned off.

## Hosting on GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages** and set **Source** to `Deploy from a branch`, **Branch** to `main` and **Folder** to `/ (root)`.
3. Save. The site goes live at `https://<username>.github.io/<repo>/` within a minute or so.

`.nojekyll` makes Pages serve the files exactly as they are. For a custom domain, add a `CNAME` file containing the domain.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | All content. Every fact comes from the LinkedIn profile (Oct 2026) and her CV. Copy is in British English. |
| `styles.css` | Design tokens in `:root` (burgundy tint scale, type, spacing, motion), layout, reduced-motion, high-contrast and print rules |
| `script.js` | Background identity graph (canvas), hero identity-record sequence, scroll-linked migration wiring and lifecycle line, section rules, count-ups, skills filter, copy-to-clipboard |

## Motion

| Moment | Trigger | Reduced motion |
| --- | --- | --- |
| Background identity graph: identities (circles) → roles (diamonds) → applications (squares), with access packets flowing along the links; the pointer lights nearby access paths, a click provisions from the nearest identity | Continuous; pauses when the tab is hidden | Drawn once, static |
| Name rises; the identity record materialises, five attributes tick in, then the *Active* status appears | Page load, once | Final state shown immediately |
| A rule draws across each numbered section label | Enter view, once | Shown |
| OIM → IdentityIQ rows wire up and turn "migrated"; lifecycle line draws through joiner, mover and leaver | Scroll position | Shown complete |
| Numbers count up | Enter view, once | Static |
| Skills filter by employer | Click, tap or keyboard | Instant |

Nothing pins or hijacks the scroll. If JavaScript fails to load, a CSS failsafe reveals the hero after 3s.

## Editing

- **Numbers:** the `data-count` values in the hero's number cards. Keep them in line with the CV.
- **Experience:** one `<li class="role">` per position
- **Skills:** `<li data-at="ltim acc wip">Skill<span>where it was used</span></li>`; `data-at` drives the employer filter

## Security and quality

- Content-Security-Policy meta: same-origin scripts plus one hashed inline line, Google Fonts only, no trackers. If you change the inline `<script>` in `<head>`, update its `sha256-` hash.
- Every text pair passes WCAG AA (lowest is 5.3:1), with visible focus rings, a skip link and semantic landmarks.
- Handles `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast: more` and print.

## Design source

`chats/` and `project/` hold the original Claude Design handoff: the transcript, the earlier prototypes, and the resume they were built from.
