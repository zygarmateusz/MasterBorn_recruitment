# Submission: Mateusz Zygar

## Time Spent

Total time: **about 3 hours** (approximate)

## Ticket Triage

### Tickets I Addressed

List the ticket numbers you worked on, in the order you addressed them:

0. **Lint errors (before tickets)**: The template already had lint errors and the pre-commit hook checks whole files, so I couldn't commit anything in these files. I fixed them first in separate commits.
1. **CFG-148**: Fixed the crash after unchecking Include Packaging. Add-ons that depend on an option are now removed for all option types, not only selects.
2. **CFG-142**: Fixed the price stuck at $0.00. Old responses are ignored in a different way now and the loading state works correctly.
3. **CFG-147**: Fixed share links with Polish letters and emoji. The config is now encoded as UTF-8 and URL safe, and the name from the link is restored.
4. **CFG-152**: Keyboard navigation. Color swatches work with Tab and arrow keys, add-on checkboxes work with space, focus styles are visible, and modals take focus so Escape closes them and focus goes back to the button.
5. **CFG-143 (partly)**: Fixed only one of the causes. The resize listener was never removed, so I added a cleanup when the component unmounts. The other leads are in the Deprioritized table.
6. **CFG-156**: List keys were the index or the add-on name. I changed them to stable ids in 5 places (color swatches, add-ons, price lines for options and add-ons, validation warnings). React only warns when a key is missing, not when it's an index, so there were no warnings in the console, but the keys were still wrong.

### Tickets I Deprioritized

List tickets you intentionally skipped and why:

| Ticket  | Reason                                                                                                                                                                                                                                    |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CFG-153 | This is a new feature estimated for 2-3 weeks, not a bug fix. Doesn't fit here.                                                                                                                                                           |
| CFG-155 | Nice to have, doesn't block the demo.                                                                                                                                                                                                     |
| CFG-157 | Needs some UX design first. Also the dirty flag it depends on was broken (it was true right after page load), I fixed that with the lint fixes.                                                                                           |
| CFG-158 | currentConfig is already memoized and product is a constant, so this wouldn't change much. The real problem is draftName (see below).                                                                                                     |
| CFG-150 | The JS sets a CSS variable for columns but the CSS doesn't use it at all, it's just flex-wrap. Small impact compared to the other bugs.                                                                                                   |
| CFG-143 | I only fixed the resize listener. I didn't have time to profile the rest properly. Other leads: every option change creates a new preview image URL (t=Date.now()), and App logs the whole config to the console on every change.         |
| CFG-149 | Partly better already: after the CFG-142 fix the loading state is correct, so the price-loading class and the Calculating... button work. I wouldn't use the suggested '...' because the price disappears and screen readers get nothing. |
| CFG-151 | Good ticket, but lower priority than the blockers. The plan would be to map each error code to a friendly message with a try again action (refetch from the price hook is ready for it).                                                  |

### Tickets That Need Clarification

List any tickets where you couldn't proceed due to ambiguity:

| Ticket  | Question                                                                                                                                |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| CFG-146 | I didn't find a bug in the code, the date is saved in ISO and shown in local time. I would need the browser, timezone and a screenshot. |

### Tickets With a Misleading Priority Label

Our board labels aren't always right. List tickets where you disagreed with the label (e.g. a Low that's actually High, a High that's actually Low, a Medium that's actually Unclear) and explain why. If you didn't disagree with any, say so.

| Ticket  | Label on board | Your read     | Why                                                                                                                  |
| ------- | -------------- | ------------- | -------------------------------------------------------------------------------------------------------------------- |
| CFG-152 | ⚪ Low         | 🟠 High       | TechStyle has accessibility (WCAG 2.1 AA) in the contract, so no keyboard navigation can be a legal problem.         |
| CFG-158 | 🟠 High        | ⚪ Low        | The suggested fix is for values that are already stable, so it won't help.                                           |
| CFG-153 | 🟡 Medium      | Out of sprint | 2-3 weeks of work, it's not a sprint task.                                                                           |
| CFG-147 | 🔴 Critical    | 🔴 Critical   | Label is ok, but the note that it's a dev only problem is wrong. btoa breaks on Polish letters and emoji everywhere. |

### Tickets Where You Stopped to Ask Instead of Implementing

If a ticket was ambiguous enough that the right move was to escalate / ask PM / gather more context rather than ship a fix, list it here. We value this signal — picking one interpretation blindly and shipping it can cost more than stopping to ask.

| Ticket            | Who would you ask        | What you'd ask                                                                                                                                                                                                   |
| ----------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CFG-144 / CFG-145 | Sarah and Jamie together | One ticket says remove Quick Add, the other says TechStyle needs a hotkey for it on the demo. They need to decide together, I don't want to remove something the biggest client wants.                           |
| CFG-154           | PM and Finance           | Should the discount start at 50 or 51? And is it 10% (code and CONTEXT.md) or 15% (marketing page)? It's about money so I don't want to guess. Also the UI at 50 says top tier reached but there is no discount. |

---

## Technical Write-Up

### Critical Issues Found

Describe the most important bugs you identified:

#### Issue 1: Crash after unchecking Include Packaging

**Ticket(s):** CFG-148

**What was the bug?**

The code that removes add-ons when their requirement is gone only worked for select options. Include Packaging is a toggle, so Gift Wrap stayed selected. It also changed the array directly with splice instead of making a new one, so React could miss the change. Then the summary tried to get Gift Wrap from the list of available add-ons, got undefined and crashed on .price.

**How did you find it?**

I followed the steps from the ticket, checked the error in the console and looked where the summary reads the add-on price. Then I checked why an unavailable add-on was still selected.

**How did you fix it?**

The cleanup now works for every option type and creates a new array. The summary takes add-ons from the full product list and skips missing ones. I removed the availableAddOns map because nothing used it anymore.

**Why this approach?**

Fixing only the summary would hide the crash, but the wrong add-on would still be in the config and in the price. So I fixed it where the problem starts.

---

#### Issue 2: Price stuck at $0.00

**Ticket(s):** CFG-142

**What was the bug?**

The hook saved Date.now() as the latest request, but the API returns a request counter (1, 2, 3...) as timestamp. Comparing these two never passed, so every response was ignored. Loading was also turned off by any response, even old ones.

**How did you find it?**

The ticket said the problem is in how the hook decides to use a response. I compared what the hook saves with what calculatePrice returns and they were different things.

**How did you fix it?**

I used the cleanup pattern from React docs. When the config changes, the old request is marked as ignored, so a slow old response can't overwrite a new one. Loading is now calculated from the data. On error the last price stays. refetch still works (can be used for a try again button). I removed useDebouncedPriceCalculation because it wasn't used anywhere.

**Why this approach?**

A smaller fix (my own counter instead of Date.now()) would fix the comparison, but the hook also had a lint error that blocked the commit. This way fixes both.

---

#### Issue 3: Share link broken for some configurations

**Ticket(s):** CFG-147

**What was the bug?**

Two problems. First, btoa only works with Latin1 characters, so a name like "Żółć test 🎨" throws an error and opening the Share modal crashed the app. Second, normal base64 has +, / and = in it. In a URL query a + is read as a space, so some links decoded to garbage or failed. This is not a dev only problem, it happens in every environment.

**How did you find it?**

I looked at how the share URL is built and tested with the config from the ticket. It throws InvalidCharacterError.

**How did you fix it?**

The JSON is turned into UTF-8 bytes first and then encoded to URL safe base64 (- and _ instead of + and /, no padding). Decoding does the same in reverse. The name from the link is now restored too (before it was ignored). Old links with only normal characters still work.

**Why this approach?**

encodeURIComponent on the JSON would also work, but the links would be longer and less readable. URL safe base64 keeps the same format as before, so old links still open.

---

#### Issue 4: Keyboard navigation

**Ticket(s):** CFG-152

**What was the bug?**

Color swatches were divs, so Tab skipped them and screen readers didn't get the color name. Add-on checkboxes could get focus but space did nothing, because onChange was empty and only a click on the row worked. Some buttons had no focus style (quantity +/-, swatches, checkboxes). Modals didn't take focus when opened, so Escape didn't work at all, and focus stayed on the page. The custom dropdown from the audit doesn't exist, all dropdowns are native selects, so arrow keys already work there.

**How did you find it?**

I went through the whole configurator using only the keyboard and checked each point from the audit.

**How did you fix it?**

Each part is a separate commit:

- swatches are buttons with role radio, aria-label and arrow key support (roving tabindex like a normal radio group)
- the add-on row is a label for the checkbox and the checkbox toggles the add-on itself
- added focus-visible styles to the missing elements
- modals get focus on open, have role dialog with a title, and on close focus goes back to the button that opened them (this code was already there, it just never ran with Escape)

**Why this approach?**

I tried to use native elements (button, label, checkbox) where possible so the browser handles keyboard and screen readers. What's still missing is a focus trap in the modals, I left it because it's a bigger change.

---

### Other Changes Made

Brief description of any other modifications:

- Fixed the lint errors from the template first. Most of them were real problems:
  - empty catch in validation, errors were just ignored (now config is marked as not validated)
  - isDirty was set in an effect so it was true right after page load and Discard was always visible (now it's set when the user changes something)
  - share URL and loading config from URL were done in effects, which gave extra renders and default options showing for a moment (now calculated directly / read on start)
  - any changed to unknown in ConfigChangeEvent

---

## Code Quality Notes

### Things I Noticed But Didn't Fix

List any issues you noticed but intentionally left:

| Issue                                                                                                  | Why I Left It                                                             |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Preview image URL has two question marks (?text=TechStyle+Pro?config=...). Saw it in the console logs. | Not part of any ticket.                                                   |
| draftName is in currentConfig, so typing a draft name recalculates price, validation and preview.      | This is the real perf problem behind CFG-158, needs a bit of refactoring. |
| Configuration validated shows even when validation has errors.                                         | Not a blocker for the demo.                                               |
| Quick Add doesn't check if the price is still loading, so it can add to cart with an old price.        | Waiting for the decision on CFG-144 / CFG-145 first.                      |
| Modals have no focus trap, Tab can leave the modal.                                                    | Bigger change, the main keyboard problems are fixed.                      |

### Potential Improvements for the Future

If you had more time, what would you improve?

1. Split ProductConfigurator into smaller components (options, add-ons, price panel). 900+ lines in one file makes every change risky.
2. Add tests, at least for pricing, share link encoding and the price hook. There are no tests at all right now.
3. Finish CFG-143 with the profiler, and move draftName out of currentConfig.
4. A proper accessible modal and friendly error messages (CFG-151).

---

## Questions for the Team

Questions you would ask in a real scenario:

1. Quick Add: remove it or add the hotkey? (CFG-144 / CFG-145)
2. Discount: 50 or 51, and 10% or 15%? (CFG-154)
3. Is the demo going to run on a dev build or a production build, and on which browser?
4. Can we add a test setup (Vitest) to the project? It would help a lot with the next fixes.

---

## Assumptions Made

List any assumptions you made to proceed:

1. A shared link should win over initialConfiguration when the page is opened with ?config=, because the user clicked that link on purpose.
2. Removing useDebouncedPriceCalculation and the availableAddOns map is safe, because nothing in the repo used them.
3. Old share links only need to keep working if they had normal characters. Links with Polish letters or emoji crashed before, so they never existed.

---

## Self-Assessment

### What went well?

I think the triage went well. I fixed the three demo blockers first and found the root cause of each one instead of just hiding the symptom. I also kept the commits small, one thing per commit.

### What was challenging?

The template already had lint errors and the pre-commit hook blocked every commit in those files, so I had to fix that first. Also some tickets contradict each other or have misleading notes, so I had to decide what to trust.

### What would you do differently with more time?

I would add tests before changing the price hook and the share link encoding, so the fixes are covered and don't break again.

---

## AI Assistance Notes (optional)

If you used AI tools (Copilot, Claude, Cursor, ChatGPT, etc.), we'd love a short note on how. **We don't score the fact that you used AI — we score the quality of your reasoning and verification.**

I used Claude to analyze the code, find the causes of the bugs and prepare the fixes. It also helped me put this document together in English, but the decisions and the content are mine and I checked everything. I tested every fix myself in the browser and checked the changes before each commit.

Things I decided differently than the AI suggested:

- CFG-142: I went with rewriting the hook instead of a minimal fix, because the lint error needed that anyway.

---

## Additional Notes

Anything else you want us to know:

Some commit messages don't have the ticket number in them, so here is the mapping:

- fix:replace any with unknown in ConfigChangeEvent - lint pre-work
- fix: resolve pre-existing lint errors - lint pre-work
- fix: clear dependent add-ons when their requirement is no longer met - CFG-148
- fix: ignore stale price responses so the total updates - CFG-142
- fix: encode share links as UTF-8 so special characters work - CFG-147
- fix: make color swatches keyboard accessible - CFG-152
- fix: make add-on checkboxes work with keyboard - CFG-152
- fix: add visible focus styles for keyboard users - CFG-152
- fix: move focus into modals so Escape closes them - CFG-152
- fix: remove resize listener on unmount - CFG-143
- fix: use stable ids as list keys - CFG-156
- docs: fill in submission template - this file
