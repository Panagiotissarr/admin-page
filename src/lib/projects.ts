export type Project = {
  id: string;
  name: string;
  description: string;
  adminPath: string;
  icon: string;
};

export const projects: Project[] = [
  {
    id: "sarris-dev",
    name: "sarris.dev",
    description: "Personal portfolio & website",
    adminPath: "/sarris-dev",
    icon: "PT",
  },
  {
    id: "cloud",
    name: "Cloud",
    description: "API platform — manage API keys",
    adminPath: "/cloud",
    icon: "CL",
  },
];
