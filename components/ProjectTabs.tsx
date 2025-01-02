import { motion } from "framer-motion"
import { Input } from "./ui/input"
import { Button } from "@/components/ui/button"
import { Tables, TablesInsert } from "@/types/schema"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

type Project = Tables<"projects"> & {
    documents: Tables<"documents">[]
}

type TabBackgroundProps = {
    isActive: boolean
}

const TabBackground = ({ isActive }: TabBackgroundProps) => (
    <motion.div
        layoutId="activeProjectTab"
        className="absolute inset-0 bg-zinc-800 rounded"
        initial={false}
        animate={{
            opacity: isActive ? 1 : 0
        }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
    />
)

type ProjectTabsProps = {
    projects: Project[]
    currentProject: Project | null
    onProjectChange: (project: Project) => void
    onProjectsUpdate: (projects: Project[]) => void
}

export function ProjectTabs({
    projects,
    currentProject,
    onProjectChange,
    onProjectsUpdate
}: ProjectTabsProps) {
    const [editingProject, setEditingProject] = useState<string | null>(null)

    const handleRename = async (projectId: string, newName: string) => {
        const { error } = await supabase
            .from("projects")
            .update({ name: newName || currentProject?.name })
            .eq("id", projectId)

        if (error) {
            console.error("Error updating project:", error)
            return
        }

        const updatedProjects = projects.map(project =>
            project.id === projectId
                ? { ...project, name: newName || project.name }
                : project
        )
        onProjectsUpdate(updatedProjects)
        setEditingProject(null)
    }

    const handleCreateProject = async () => {
        const newProject: TablesInsert<"projects"> = {
            name: `Stack ${projects.length + 1}`,
            created_at: new Date().toISOString()
        }

        const { data, error } = await supabase
            .from("projects")
            .insert(newProject)
            .select()
            .single()

        if (error || !data) {
            console.error("Error creating project:", error)
            return
        }

        const projectWithDocs = { ...data, documents: [] }
        const updatedProjects = [...projects, projectWithDocs]
        onProjectsUpdate(updatedProjects)
        onProjectChange(projectWithDocs)
    }

    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500 text-lg">/</span>
            {projects.map((project) => (
                <div key={project.id} className="flex items-center">
                    {editingProject === project.id ? (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                const form = e.target as HTMLFormElement
                                const input = form.elements.namedItem('name') as HTMLInputElement
                                handleRename(project.id, input.value)
                            }}
                            className="flex"
                        >
                            <Input
                                name="name"
                                defaultValue={project.name}
                                autoFocus
                                className="h-7 w-[120px] bg-zinc-800 border-0 text-sm"
                                onBlur={(e) => handleRename(project.id, e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setEditingProject(null)
                                    }
                                }}
                            />
                        </form>
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => {
                                    if (currentProject?.id !== project.id) {
                                        onProjectChange(project)
                                    } else {
                                        setEditingProject(project.id)
                                    }
                                }}
                                onDoubleClick={() => setEditingProject(project.id)}
                                className={`px-2 py-1 rounded relative ${currentProject?.id === project.id
                                    ? 'text-white'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                {currentProject?.id === project.id && (
                                    <TabBackground isActive={currentProject.id === project.id} />
                                )}
                                <span className="relative z-10">{project.name}</span>
                            </button>
                        </div>
                    )}
                </div>
            ))}
            <Button
                size="sm"
                onClick={handleCreateProject}
                className="text-xs text-zinc-500 hover:text-zinc-400 bg-transparent"
            >
                + New Stack
            </Button>
        </div>
    )
} 