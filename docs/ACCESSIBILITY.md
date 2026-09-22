# ExitLoop Accessibility Implementation and Test Plan

## Standard and scope

ExitLoop targets WCAG 2.2 Level AA across the teacher authoring flow, teacher dashboard, student join flow, and student activity. The implementation follows the [W3C Forms Tutorial](https://www.w3.org/WAI/tutorials/forms/) and [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

This file documents implemented patterns and the release test plan. It is not an independent accessibility certification. A formal conformance claim requires evaluation of every page and complete process on the deployed build.

## Implemented patterns

- A skip link moves keyboard users past repeated navigation.
- Native labels are connected to text fields, textareas, selects, and file controls.
- Related radio choices use `fieldset` and `legend`.
- Instructions and character limits use `aria-describedby`.
- Validation errors use `role="alert"`, stable IDs, `aria-invalid`, and `aria-errormessage` where the error applies to a field.
- Progress indicators expose the current step with `aria-current="step"`.
- Status messages such as saving, loading, and offline state are announced without moving focus.
- The lesson upload affordance is a real keyboard-operable button linked to the native file input.
- Focus indicators use a high-contrast three-pixel outline and remain visible around custom radio cards and expandable sections.
- Primary buttons, compact text buttons, rating choices, and repeated actions use targets at least 44 CSS pixels high where layout permits.
- Layouts reflow to one column on narrow screens.
- `prefers-reduced-motion` disables nonessential transitions and animation.
- The student activity has no countdown. Clipboard paste is not blocked.
- Decorative icons are hidden from assistive technology.

These choices follow W3C guidance that accessible forms need labels, grouped controls, instructions, validation feedback, notifications, and logical multi-step structure. The W3C also notes that larger clickable areas help users with limited dexterity and that accessible structure reduces cognitive difficulty for a wider group of users.

## Release test matrix

Test these routes on the deployed build:

| Route or process | Automated scan | Keyboard | Screen reader | Zoom/reflow |
| --- | --- | --- | --- | --- |
| Home and role selection | Required | Required | Required | Required |
| Student join | Required | Required | Required | Required |
| Initial response through survey | Required | Required | Required | Required |
| Teacher login and workspace | Required | Required | Required | Required |
| Activity upload and five review steps | Required | Required | Required | Required |
| Live and closed session dashboard | Required | Required | Required | Required |
| Delete confirmation and error recovery | Required | Required | Required | Required |

Use axe or an equivalent rules engine for automated checks. Complete keyboard testing with Tab, Shift+Tab, Enter, Space, arrow keys, and Escape. Test VoiceOver with Safari on macOS, plus one Chromium screen-reader combination when available. Check 200% browser zoom and 400% text reflow at a 1280 CSS-pixel viewport.

## Manual acceptance criteria

1. Every control has an announced name, role, state, and relevant instructions.
2. Focus order follows the visual and task order, with no trap or unexpected context change.
3. Focus is always visible and is not hidden by the sticky teacher header.
4. Errors identify the field and explain how to fix it without relying only on color.
5. Text and controls meet AA contrast; focus and component boundaries meet non-text contrast.
6. At 400% reflow, ordinary text does not require horizontal scrolling.
7. A student can finish without a mouse, without a countdown, and without needing to re-enter saved information.
8. A teacher can upload a file, edit the draft, create a session, review evidence, export, and delete a session without a mouse.

Record the date, deployed commit, browser, assistive technology, tester, failures, and fixes for every release audit.
