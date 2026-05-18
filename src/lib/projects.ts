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
];
