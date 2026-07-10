/**
 * Project templates for the creation wizard.
 * offsetDays = stage target date offset from "today" at creation time —
 * the wizard converts these to concrete YYYY-MM-DD dates when a template is picked.
 */

export type TemplateStage = { name: string; offsetDays: number };

export type ProjectTemplate = {
  key: string;
  name: string;
  description: string;
  stages: TemplateStage[];
};

export const TEMPLATES: ProjectTemplate[] = [
  {
    key: "blank",
    name: "Blank",
    description: "A minimal three-stage scaffold. Rename, reorder, or delete anything.",
    stages: [
      { name: "Plan", offsetDays: 14 },
      { name: "Build", offsetDays: 35 },
      { name: "Ship", offsetDays: 50 },
    ],
  },
  {
    key: "product-launch",
    name: "Product launch",
    description: "Discovery through GA for a user-facing feature or product.",
    stages: [
      { name: "Discovery", offsetDays: 10 },
      { name: "Spec & design", offsetDays: 21 },
      { name: "Build", offsetDays: 45 },
      { name: "Beta", offsetDays: 60 },
      { name: "Launch", offsetDays: 75 },
    ],
  },
  {
    key: "curriculum-module",
    name: "Curriculum module",
    description: "Author, review, and publish a new learning module end to end.",
    stages: [
      { name: "Outline", offsetDays: 7 },
      { name: "Author content", offsetDays: 28 },
      { name: "Expert review", offsetDays: 42 },
      { name: "Publish", offsetDays: 56 },
    ],
  },
];

export function getTemplate(key: string): ProjectTemplate | undefined {
  return TEMPLATES.find((t) => t.key === key);
}
