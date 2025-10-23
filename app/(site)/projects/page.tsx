import { getAllProjects } from "./_lib/mdx";
import ProjectList from './_components/ProjectList';

export const revalidate = 60;

export default async function ProjectsPage() {
  const projects = await getAllProjects();
  return <ProjectList projects={projects} />;
}
