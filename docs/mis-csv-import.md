# Importing the Adaptly marksheet into your MIS

Adaptly's bulk Scan & Mark exports a free, downloadable CSV — the teacher saves
it themselves. There is no paid push to SIMS, Bromcom, Arbor, Edukey, or
Provision Map; native MIS APIs (Wonde, GroupCall, OneRoster) are scheduled for
Phase C and will sit behind a per-tenant feature flag.

The CSV columns are deliberately UK-MIS-friendly:

| Column          | Notes                                                       |
| --------------- | ----------------------------------------------------------- |
| `PupilName`     | First Last as held on Adaptly.                              |
| `UPN`           | The pupil's MIS unique pupil number, when set.              |
| `Mark`          | Total marks awarded across the worksheet.                   |
| `OutOf`         | Total marks available.                                      |
| `Pct`           | `Mark / OutOf` to one decimal place.                        |
| `Comment`       | One feedback comment per pupil (≤ 80 words).                |
| `Misconceptions`| Up to five misconception tags, separated by `; `.           |
| `Date`          | ISO 8601 (`yyyy-mm-dd`), UTC, the date the batch finished.  |

The file is UTF-8 with a BOM so Excel and SIMS' Result Sheet importer treat it
as text and don't auto-format the first row. Cells starting with `=`, `+`, `-`
or `@` are escaped to defuse the spreadsheet formula trigger that has eaten
more than one teacher's mark column.

## SIMS

Reports → Marksheet → Import results from spreadsheet. Map `UPN` to the SIMS
pupil identifier and `Mark` to the relevant aspect column. See the official
[ESS SIMS support hub](https://www.ess-help.com/) for the import wizard
walkthrough specific to your release.

## Bromcom

Assessment → Marksheets → Tools → Import from CSV. Bromcom matches on UPN by
default; choose "Add comment" to bring the `Comment` column across as a free-
text note against each pupil's mark. Reference: [Bromcom docs](https://docs.bromcom.com/).

## Arbor

Students → Assessments → upload Marksheet CSV. Arbor expects column headers in
the first row, which Adaptly emits exactly as documented above. Reference:
[Arbor support](https://support.arbor-education.com/).

## Other MIS

Edukey Provision Map and other UK MIS importers all accept comma-separated
data with quoted strings; the same file works without modification. If a
particular MIS rejects the BOM, open the file in a text editor and remove the
first three bytes — the rest of the schema is identical.

If your MIS isn't on this list and you want it covered in the help modal,
open an issue with the MIS name and a link to its CSV import documentation.
