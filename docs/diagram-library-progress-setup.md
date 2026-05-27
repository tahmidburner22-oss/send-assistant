# Diagram library progress audit — setup guide

> Goal: see how many of the 5,975 catalogue diagrams are already done,
> which still need an image, and what to work on next — entirely from
> your phone, in your browser, with no terminal and no coding.

This audit is **read-only**. It looks at your Supabase database and
counts what's there. It will never change any of your data.

You only do the setup once. After that, you tap one button to refresh
the report whenever you want.

---

## Part A — One-time setup (about 3 minutes)

You need to paste one secret value into your repo's Secrets settings.
This is the proper way to give GitHub access to your database — it gets
encrypted, never shown again, and never appears in any logs.

### A1. Get your Supabase connection string

1. Open [supabase.com](https://supabase.com) in your phone browser and
   sign in.
2. Tap your project.
3. Tap **Project Settings** (the cog icon, usually bottom-left of the
   menu).
4. Tap **Database**.
5. Scroll down to **Connection string**.
6. Tap the **URI** tab.
7. Important: tap **Use connection pooler** if it's not already selected
   (the URL should end in `:6543`, not `:5432`).
8. Tap the eye icon to reveal the password, then tap the copy icon at
   the right-hand end of the string.

The string you've copied looks roughly like
`postgresql://postgres.xxxx:YOUR-PASSWORD@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`.

Treat it like a password — it gives full access to your database.

### A2. Paste it as a GitHub repo secret

1. Open this repository on GitHub in your phone browser.
2. Tap the **Settings** tab at the top of the page (you may need to tap
   the three-dot "..." menu first if Settings isn't visible).
3. In the left-hand menu, tap **Secrets and variables** → **Actions**.
4. Tap the green **New repository secret** button.
5. In **Name**, type exactly: `DATABASE_URL`
6. In **Secret**, paste the connection string you copied in step A1.
7. Tap **Add secret**.

Done. GitHub now has the secret encrypted at rest. You'll never see its
value again, and it will never appear in any workflow log — GitHub
auto-redacts it.

---

## Part B — Run the audit (about 30 seconds)

1. On the repo page, tap the **Actions** tab.
2. In the left-hand list of workflows, tap **Diagram library — progress
   audit**.
3. Tap the grey **Run workflow** button on the right (you may need to
   scroll right to see it).
4. Leave the defaults as they are. Tap the green **Run workflow** button
   in the popup.

Wait about 30–60 seconds. Pull-to-refresh the Actions page until you see
a new run with a green tick.

### Where to read the result

Three places — pick whichever is easiest on your phone:

**(i) The "Summary" tab (recommended)**

Tap the run row → tap the **Summary** tab → scroll down. The full
progress report is rendered right there — progress bar, per-subject
tables, "next 30 highest-priority briefs to work on", everything.
This is the fastest view.

**(ii) The pull request**

By default, the workflow also opens a Pull Request titled
**"Diagram library — progress audit refresh"** that adds the report to
the repo. Tap the **Pull requests** tab to find it. Useful because it
gives you a permanent versioned history of progress over time.

**(iii) The downloaded artefact**

On the run page, scroll to **Artifacts** at the bottom and tap
`diagram-library-progress-...`. You'll get a `.zip` containing the
markdown and JSON files.

---

## Part C — How to read the report

The report has four sections:

### 1. Headline

A single progress bar showing what % of the catalogue is "live" (image
attached). Plus three numbers:

- **Done** — image uploaded, the AI can use this diagram on a worksheet
  right now.
- **Needs image** — the brief is in the live database but doesn't have
  an image yet.
- **Not seeded** — the brief lives only in the catalogue file; it
  hasn't been added to the database at all.

### 2. Progress by phase

A table showing how many briefs are done in each year band:

- Primary (Y1–Y6)
- KS3 (Y7–Y9)
- GCSE (Y10–Y11) ← biggest impact, prioritise this
- A-Level (Y12–Y13)

### 3. Progress by subject

The same numbers broken down per subject inside each phase. Useful for
spotting that, for example, GCSE Biology is 60% done but GCSE Computing
is at 5%.

### 4. Next 30 highest-priority briefs to work on

A list ordered: GCSE first, then KS3, then A-Level, then Primary.
Within each band, "needs image" comes before "not seeded" (less work to
flip). This is your to-do list — these are the diagrams to generate
next.

### Bonus: Orphan DB rows

If your live database has rows that don't match any catalogue brief
(e.g. older manually-uploaded diagrams), they're listed at the bottom
for you to review and possibly merge into the catalogue.

---

## Troubleshooting

**"Missing secret" error in red.**
Go back to Part A2 and confirm the secret is named exactly
`DATABASE_URL` (case-sensitive, no spaces).

**"Bad secret — does not look like a Postgres connection string".**
Your secret doesn't start with `postgres://` or `postgresql://`. Go
back to Part A1 step 6 and copy the **URI** tab, not the URL or
psql tab.

**Workflow times out or fails to connect.**
Make sure you used the **pooler** URL (port `:6543`), not the direct
connection (port `:5432`). Direct connections are blocked from CI by
Supabase's IPv6 setup.

**Workflow runs but says "0 briefs in catalogue CSV".**
The catalogue file is missing from `main`. Make sure PR #132
("Extend diagram catalogue to KS3 / GCSE / A-Level") is merged, or run
the workflow on a branch that contains the catalogue.

**The PR doesn't get opened.**
Check that the workflow's "Open or update PR with the refreshed report"
step ran. If you turned the toggle off when running, the report will
still be in the Summary and Artefacts tabs — just no PR.

**I changed my Supabase password.**
Go back to Part A and replace the secret with the new connection
string. GitHub doesn't let you edit a secret value — you delete and
re-add. Same name (`DATABASE_URL`), new value.

---

## Frequently asked questions

**Will this change anything in my database?**
No. The script only runs `SELECT` queries.

**How often should I run it?**
Whenever you want a fresh number. Once after you've uploaded a batch of
images is the most useful time. You can also turn on a weekly auto-run
by uncommenting the `schedule:` block in
`.github/workflows/diagram-library-progress.yml`.

**Can I share the report with someone non-technical?**
Yes. The Summary tab on a workflow run is publicly readable if your
repo is public (open the run, tap Share). For private repos, you can
download the artefact and forward the `.md` file. Or invite them to
the repo with read access.

**What about generating the images themselves?**
That's a separate workflow that's coming next. It's not in this PR
because we still need to confirm exactly which Manus API endpoint to
call. This audit is the safe, read-only first step.
