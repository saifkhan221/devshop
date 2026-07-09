export const TOOLS = [
  { id: 'px-to-rem',          name: 'PX to REM',              icon: '📐', category: 'CSS & Layout',  desc: 'Convert pixel values to REM units',           component: 'PxToRem' },
  { id: 'task-list',          name: 'Task List',              icon: '✅', category: 'Productivity',  desc: 'Manage todos and project tasks',              component: 'TaskList' },
  { id: 'project-notes',      name: 'Callouts',               icon: '📝', category: 'Productivity',  desc: 'Colourful callout notes for your project',    component: 'ProjectNotes' },
  { id: 'svg-viewer',         name: 'SVG Viewer',             icon: '🖼️', category: 'Design',        desc: 'View, preview and inspect SVG files',         component: 'SvgViewer' },
  { id: 'kanban',             name: 'Kanban Board',           icon: '📌', category: 'Productivity',  desc: 'Trello-style task management board',          component: 'KanbanBoard' },

  // Coming soon — disabled
  { id: 'box-shadow',         name: 'Box Shadow Generator',   icon: '🌫️', category: 'CSS & Layout',  desc: 'Build and preview CSS box shadows live',      component: 'BoxShadowGenerator',    disabled: true },
  { id: 'testing-checklist',  name: 'Testing Checklist',      icon: '📋', category: 'Testing',       desc: 'QA checklist to ship with confidence',        component: 'TestingChecklist',      disabled: true },
  { id: 'color-palette',      name: 'Color Palette',          icon: '🎨', category: 'Design',        desc: 'Generate and save color palettes',            component: 'ColorPalette',          disabled: true },
  { id: 'gradient-generator', name: 'Gradient Generator',     icon: '🌈', category: 'CSS & Layout',  desc: 'Create beautiful CSS gradients visually',     component: 'GradientGenerator',     disabled: true },
  { id: 'flexbox-playground', name: 'Flexbox Playground',     icon: '📦', category: 'CSS & Layout',  desc: 'Interactive flexbox layout visualizer',       component: 'FlexboxPlayground',     disabled: true },
  { id: 'grid-builder',       name: 'Grid Layout Builder',    icon: '⊞',  category: 'CSS & Layout',  desc: 'CSS Grid layout builder',                     component: 'GridBuilder',           disabled: true },
  { id: 'border-radius',      name: 'Border Radius',          icon: '⬜', category: 'CSS & Layout',  desc: 'Visual border radius generator',              component: 'BorderRadiusGenerator', disabled: true },
  { id: 'font-pairing',       name: 'Font Pairing Tool',      icon: '🔤', category: 'Design',        desc: 'Find and preview font combinations',          component: 'FontPairing',           disabled: true },
  { id: 'contrast-checker',   name: 'Contrast Checker',       icon: '👁️', category: 'Design',        desc: 'WCAG contrast ratio checker',                 component: 'ContrastChecker',       disabled: true },
  { id: 'code-snippets',      name: 'Code Snippets',          icon: '💾', category: 'Code',          desc: 'Save and organize reusable code',             component: 'CodeSnippets',          disabled: true },
  { id: 'regex-tester',       name: 'Regex Tester',           icon: '🔍', category: 'Code',          desc: 'Test and debug regular expressions',          component: 'RegexTester',           disabled: true },
  { id: 'json-formatter',     name: 'JSON Formatter',         icon: '{ }', category: 'Code',         desc: 'Format and validate JSON data',               component: 'JsonFormatter',         disabled: true },
  { id: 'breakpoint-tester',  name: 'Breakpoint Tester',      icon: '📱', category: 'Testing',       desc: 'Test responsive breakpoints live',            component: 'BreakpointTester',      disabled: true },
]
