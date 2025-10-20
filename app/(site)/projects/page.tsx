import { getAllProjects } from "@/lib/mdx";
import ProjectList from './ProjectList';

export const revalidate = 60;

export default async function ProjectsPage() {
  const projects = await getAllProjects();
  return <ProjectList projects={projects} />;
}
