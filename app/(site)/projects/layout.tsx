import { getAllProjects } from "@/lib/mdx";
import ProjectsLayoutClient from "./ProjectsLayoutClient";

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const projects = await getAllProjects();

  return <ProjectsLayoutClient projects={projects}>{children}</ProjectsLayoutClient>;
}

