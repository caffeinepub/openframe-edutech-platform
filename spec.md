# OpenFrame EduTech Platform

## Current State
- FE login uses Internet Identity. On first login, the app shows a linking form (name + phone) that tries to match an existing FE account in the DB. If no match is found, it shows "No FE account found. Please contact your admin."
- Admin can create, edit, and delete FE accounts from the Field Executives page.
- FE accounts are seeded with placeholder data (Rahul Sharma, Priya Singh).

## Requested Changes (Diff)

### Add
- FE self-registration: when an FE logs in with II for the first time and enters name + phone, a new FE account is created automatically (no admin pre-registration required).

### Modify
- LoginPage.tsx: `handleFELinkSubmit` — instead of looking for an existing match and erroring if not found, always create a new FE account with the entered name + phone and the II principal.
- FieldExecutivesPage.tsx: remove Add FE button, Edit button, Delete button, and the Add/Edit dialog and Delete confirm dialog. Page becomes read-only (view all self-registered FEs only).

### Remove
- The "No FE account found. Please contact your admin." error path in the FE linking flow.
- Admin ability to add/edit/delete FE accounts.

## Implementation Plan
1. In `LoginPage.tsx` `handleFELinkSubmit`: remove the "no match found" error. Instead, generate a new FE account (auto FE code, new id) with the entered name, phone, and II principal, save it, then log in.
2. In `FieldExecutivesPage.tsx`: remove the Add button, Edit/Delete action buttons, Add/Edit dialog, and Delete confirm dialog. Keep the table, search, and stats. Update empty state text to reflect FEs self-register.
