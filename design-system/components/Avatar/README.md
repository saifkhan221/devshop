# Avatar

Avatar — a person or project mark, always circular.

**Consumer provides:** an `<img>` with `alt`, or two initials as text; a size class; optional `ds-avatar-status` for presence.

- Initials fall back to `bg-300` + `ink`; `-peach`, `-violet`, `-cream` are for project avatars (hash the project id to pick one, so it is stable).
- `ds-avatar-group` overlaps up to four; the fifth becomes a "+N" neutral avatar.
