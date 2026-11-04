# Cloud rollout — 2026-11-04

Based on the supplied `prumo-schema-v0.1(2).prisma` concept, preserved as `financial-schema-concept.prisma`. Auth models use separate tables; `AppUser.authSubject` references the Better Auth identity. Workspace membership scopes every read/write. `Workspace.revision`, `Workspace.displayName`, external `clientId` fields and transaction `space` support the existing local client without changing its backup format.

Infrastructure: Neon project `aged-forest-02217119` in São Paulo, `production` and isolated `dev-auth-sync` branches. Initial additive migration applied to both initially empty databases and recorded with its checksum in `_prisma_migrations`. Vercel project `prumo` has independent production/feature-preview database URLs and auth secrets. No secrets are committed. Production uses canonical origin `https://prumo-weld.vercel.app`; preview uses the feature branch alias. Login and sync should be used on those origins; other Vercel aliases are not trusted write origins.

Eight automated tests cover existing monetary logic, settling commitments, pending selection, snapshot validation, cross-account references, duplicate IDs, dates, aggregate numeric safety, exact Origin and compatibility with the installed auth schema. TypeScript and production builds pass; Vercel preview reached READY.

Live login/signup and save/reload across sessions remain unverified: the preview requires Vercel Authentication; the connected deployment-fetch operation returned 403 when reading deployment aliases. The local executor also cannot resolve/reach the Neon database host. Schema execution and verification used the authorized Neon connector. Deployment Protection was not weakened.

The app retains local mode. Migration of personal browser data is explicit after login, and the original guest backup is retained. Conflicts never overwrite a newer cloud revision. Account cache data is isolated per user. Backend uses normalised financial tables; snapshot transport is transitional. Existing goal movement history is retained by delta adjustments; the snapshot bulk API is not intended for future transfer/recurrence clients. Recovery of lost passwords and email verification are deferred and disclosed before signup.


## Profile hydration and first-sync follow-up

An empty cloud response during focus refresh used `emptyData`, dropping the session display name. All cloud hydration now uses one resolver with the authenticated name as fallback; custom names and existing financial data are preserved. Revision zero is shown as Connected, not Synced. The dashboard offers explicit migration of guest data, or first-account setup if no guest data exists. The original guest data remains untouched. Online server failures are no longer labeled Offline. Dark surfaces now use a near-black canvas with only a small green channel difference.
