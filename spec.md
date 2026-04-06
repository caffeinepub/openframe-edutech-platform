# OpenFrame EduTech Platform

## Current State
FE login uses a mock name+phone form (no real Internet Identity). `useInternetIdentity` hook exists and is functional but is not wired to FE login. FE records in `db` have a `principal` field currently storing placeholder strings like `fe-principal-001`.

Student login also uses a mock name+phone form.

## Requested Changes (Diff)

### Add
- FE login: "Sign in with Internet Identity" button that triggers the real II auth flow.
- FE first-time linking flow: after II login, if the returned principal does not match any FE record, show a form asking for name + phone to link their account (one-time setup). On successful match, the FE's `principal` field is updated to the real II principal.
- FE subsequent logins: if the II principal already matches an FE record, log them in directly with no extra step.

### Modify
- `LoginPage.tsx`: Replace the FE view's mock name+phone form with the II login flow (button → link form → success).
- `AppContext.tsx` / logout: When an FE logs out, also call `clear()` from `useInternetIdentity` to properly clear the II session.
- Main entry / providers: Ensure `InternetIdentityProvider` wraps the app so `useInternetIdentity` is available in `LoginPage`.

### Remove
- The `handleFELogin` mock handler and the `mockName`/`mockPhone` shared state for FE (student mock login remains unchanged for now).

## Implementation Plan
1. Wrap `App` (or `main.tsx`) with `InternetIdentityProvider` if not already done.
2. In `LoginPage.tsx`:
   - Import `useInternetIdentity`.
   - Add state: `feStep: 'button' | 'linking' | 'loading'`, `linkName`, `linkPhone`.
   - On FE view: show a centered card with II button. On click, call `ii.login()`.
   - Watch `ii.identity` — when it resolves, check if principal matches any FE. If yes, log in. If no, move to `linking` step.
   - In linking step: show name + phone form. On submit, find FE by name+phone, update their principal to the II principal, then log in.
3. In `AppContext.tsx`: expose `iiClear` callback (or handle in `LoginPage` itself by calling `ii.clear()` before navigating to login).
4. Update FE dashboard logout button to also call `ii.clear()` to fully sign out of II.
