# CodeBlock

CodeBlock — output panes and code samples for the dev tools.

**Consumer provides:** a `ds-code-header` (language or filename left, copy button right) and a `<pre class="ds-code">` with the text; optional token spans `tk-key` `tk-str` `tk-num` `tk-kw` `tk-cm` from your highlighter.

- Ground is `bg-000` (one step below the card) so the block reads as a well. Colours: keys `peach-text`, strings `success-text`, numbers `violet-text`, keywords `info-text`, comments `ink-faint`.
- Inline code uses `ds-code-inline`.
- Wrap long lines only in prose contexts; tool output scrolls horizontally.
