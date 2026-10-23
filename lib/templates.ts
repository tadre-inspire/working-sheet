import type { JSONContent } from "@tiptap/core";

const t = (text: string) => ({ type: "text", text });
const h = (level: number, text: string): JSONContent => ({ type: "heading", attrs: { level }, content: [t(text)] });
const p = (text?: string): JSONContent => (text ? { type: "paragraph", content: [t(text)] } : { type: "paragraph" });
const bullets = (items: string[]): JSONContent => ({
  type: "bulletList",
  content: items.map((i) => ({ type: "listItem", content: [p(i)] })),
});
const todos = (items: string[]): JSONContent => ({
  type: "taskList",
  content: items.map((i) => ({ type: "taskItem", attrs: { checked: false }, content: [p(i)] })),
});
const quote = (text: string): JSONContent => ({ type: "blockquote", content: [p(text)] });
const sheet = (items: unknown[] = []): JSONContent => ({ type: "workingSheet", attrs: { items } });

// Working sheet items: x/w are fractions of the sheet width, y/h are pixels.
const note = (id: string, x: number, y: number, text: string, tone: number) => ({
  id, type: "note", x, y, w: 0.24, h: 120, z: 1, text, tone,
});
const swatch = (id: string, x: number, y: number, color: string) => ({
  id, type: "swatch", x, y, w: 0.14, h: 110, z: 1, color,
});

export type Template = {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  title: string;
  content: JSONContent;
};

export const TEMPLATES: Template[] = [
  {
    id: "blank",
    name: "Blank",
    icon: "📄",
    blurb: "Start from nothing",
    title: "Untitled",
    content: { type: "doc", content: [p()] },
  },
  {
    id: "working-sheet",
    name: "Working sheet",
    icon: "🎨",
    blurb: "Canvas for images, notes, drawing and shapes",
    title: "New working sheet",
    content: {
      type: "doc",
      content: [
        p("Drop images onto the sheet, add notes, shapes and colour swatches, and draw on it."),
        sheet([
          swatch("s1", 0.03, 24, "#dcff3a"),
          swatch("s2", 0.18, 24, "#0e0e0c"),
          swatch("s3", 0.33, 24, "#8f8f84"),
          swatch("s4", 0.48, 24, "#f3f3ea"),
          note("n1", 0.66, 24, "Feeling: warm, loud, night-time.", 0),
          note("n2", 0.04, 170, "Reference: low handheld, sodium light.", 1),
          note("n3", 0.32, 190, "Type: heavy grotesque, tight tracking.", 2),
        ]),
        h(2, "What this sheet is for"),
        p("One line on the brief."),
        h(2, "Next steps"),
        todos(["Collect 10 references", "Lock the palette", "Share with the client"]),
      ],
    },
  },
  {
    id: "design-brief",
    name: "Design brief",
    icon: "🧭",
    blurb: "Brand, graphic and campaign briefs",
    title: "Design brief",
    content: {
      type: "doc",
      content: [
        h(1, "Design brief"),
        quote("One sentence: what are we making, for whom, and why now?"),
        h(2, "Client & audience"),
        bullets(["Client", "Audience (where, who, language)", "Where it will run"]),
        h(2, "Look & feel"),
        p("Add a working sheet below."),
        sheet(),
        h(2, "Deliverables"),
        todos(["Concept routes", "Revisions", "Final files & sizes"]),
        h(2, "Timeline & payment"),
        bullets(["Kick-off", "Review dates", "Deposit / balance"]),
      ],
    },
  },
  {
    id: "film-plan",
    name: "Film planning",
    icon: "🎬",
    blurb: "Treatment, shot list, schedule",
    title: "Film plan",
    content: {
      type: "doc",
      content: [
        h(1, "Film plan"),
        h(2, "Logline"),
        p("One line story."),
        h(2, "Look"),
        sheet(),
        h(2, "Shot list"),
        todos(["Shot 01 · wide establishing", "Shot 02 · close, shallow focus", "Shot 03 · low handheld"]),
        h(2, "Locations & cast"),
        bullets(["Location", "Cast / voice", "Permits"]),
        h(2, "Schedule"),
        p("Day 1 …"),
      ],
    },
  },
  {
    id: "web-plan",
    name: "Web project",
    icon: "🧩",
    blurb: "Sitemap, stack, build checklist",
    title: "Web project plan",
    content: {
      type: "doc",
      content: [
        h(1, "Web project plan"),
        h(2, "Goal"),
        p("What should the site do for the business?"),
        h(2, "Sitemap"),
        bullets(["Home", "About", "Services", "Contact"]),
        h(2, "Stack"),
        p("Next.js, Tailwind, Supabase, Vercel."),
        h(2, "Look"),
        sheet(),
        h(2, "Build checklist"),
        todos(["Content & copy", "Design", "Build", "QA on phone and desktop", "Launch"]),
      ],
    },
  },
];

export const WELCOME: JSONContent = {
  type: "doc",
  content: [
    h(1, "Welcome to your workspace"),
    p("Type / on an empty line to add headings, lists, to-dos, quotes, dividers, code and working sheets."),
    quote("Plan the look before you shoot it."),
    todos(["Create a page from a template", "Add a working sheet with /sheet", "Switch light and dark mode"]),
    p(),
  ],
};
