# Interface refinement — November 2026

The updated Figma references for budgets (17:9), goals (17:115), reports (17:203), and mobile tools (29:5) inform this revision. Preserve Inter, the original local logo export, the Prumo forest identity and existing financial behavior.

The requested darker direction deliberately adapts the older Figma dark preview (12:21): near-black canvas #0B0E0D; graphite surface #131816; forest CTA #28513B with white labels. The former pale-sage CTA is removed. Muted green is restricted to data, selected navigation and small accents. Text contrast and data visibility take precedence over making every accent dark.

Use restrained 500/600 weights, tabular money values, consistent 20px panel gaps, fine separators, 44px interaction targets, and short opacity transitions with reduced-motion support. Avoid decorative gradients, extra illustrations, glass surfaces or fake financial data.

Budgets use one grouped category list with real totals and warning states. Goals gain a summary strip and existing reserve controls. Reports reuse the accessible six-month chart with category summaries. Mobile uses four bottom destinations and a keyboard-accessible Radix tools sheet rather than a horizontally scrolling desktop sidebar.

No schema or financial data migrations. PWA shell cache version increments so the previous assets can be retired after the new worker activates. A previously open installed app may need to be closed and reopened for the waiting worker to activate.

Validation: TypeScript, existing financial tests, production build and programmatic contrast checks. Browser review remains pending: the managed preview service appends Vite flags (`--host`, `--strictPort`) rejected by Next.js. No application runtime changes were introduced to accommodate that service.
