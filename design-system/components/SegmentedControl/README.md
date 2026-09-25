# SegmentedControl

SegmentedControl — two to four mutually exclusive options, one always selected.

**Consumer provides:** 2–4 labels (one word each, ideally) and the selected value; `aria-pressed="true"` on the active item. `DevShop.bindTabs(el)` switches the state on click.

- Use it for view or range switches (Day / Week / Month; List / Board). For more than four options or long labels, use `Select`.
- Sits at the right of a page header or card header, never inside a form.
