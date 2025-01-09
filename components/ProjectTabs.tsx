import { motion } from "framer-motion"
import { Input } from "./ui/input"
import { Button } from "@/components/ui/button"
import { Tables, TablesInsert } from "@/types/schema"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useUser } from "@/hooks/use-user"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { UserMenu } from "./UserMenu"

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
    const { user } = useUser()

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
        if (!user) return

        const newProject: TablesInsert<"projects"> = {
            name: `Stack ${projects.length + 1}`,
            created_at: new Date().toISOString(),
            user_id: user.id
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

    const handleDeleteProject = async (projectId: string) => {
        if (!user) return

        const { error } = await supabase
            .from("projects")
            .delete()
            .eq("id", projectId)

        if (error) {
            console.error("Error deleting project:", error)
            return
        }

        const updatedProjects = projects.filter(p => p.id !== projectId)
        onProjectsUpdate(updatedProjects)

        if (currentProject?.id === projectId) {
            onProjectChange(updatedProjects[0] || null)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-light">stack.wrld</h1>
                <UserMenu />
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* Mobile View */}
                    <div className="flex sm:hidden items-center gap-2">
                        <span className="text-zinc-500 text-lg">/</span>
                        <Select value={currentProject?.id} onValueChange={(value) => {
                            const project = projects.find(p => p.id === value)
                            if (project) onProjectChange(project)
                        }}>
                            <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800 text-white">
                                <SelectValue placeholder="Select Stack">
                                    {currentProject?.name || "Select Stack"}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800">
                                {projects.map(project => (
                                    <div key={project.id} className="flex items-center justify-between px-2">
                                        <SelectItem
                                            value={project.id}
                                            className="text-white flex-1"
                                        >
                                            {project.name}
                                        </SelectItem>
                                        {project.id === currentProject?.id && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <button className="p-1 rounded-sm hover:bg-zinc-700">
                                                        <Trash2 className="w-4 h-4 text-zinc-400 hover:text-red-400" />
                                                    </button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-white">Delete Stack</AlertDialogTitle>
                                                        <AlertDialogDescription className="text-zinc-400">
                                                            Are you sure you want to delete &ldquo;{project.name}&rdquo;? This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="bg-zinc-800 text-white hover:bg-zinc-700">Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteProject(project.id)}
                                                            className="bg-red-500 hover:bg-red-600"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            size="sm"
                            onClick={handleCreateProject}
                            className="text-2xl text-zinc-500 hover:text-zinc-400 bg-transparent h-8 w-8 flex items-center justify-center"
                        >
                            +
                        </Button>
                    </div>

                    {/* Desktop View */}
                    <div className="hidden sm:flex items-center gap-2">
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
                                    <ProjectTab
                                        project={project}
                                        isActive={currentProject?.id === project.id}
                                        onSelect={onProjectChange}
                                        onEdit={() => setEditingProject(project.id)}
                                    />
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
                </div>

                {currentProject && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs text-red-500/70 hover:text-red-500 hover:bg-transparent"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Stack
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Delete Stack</AlertDialogTitle>
                                <AlertDialogDescription className="text-zinc-400">
                                    Are you sure you want to delete &ldquo;{currentProject.name}&rdquo;? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-zinc-800 text-white hover:bg-zinc-700">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleDeleteProject(currentProject.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </div>
    )
}

const ProjectTab = ({
    project,
    isActive,
    onSelect,
    onEdit
}: {
    project: Project
    isActive: boolean
    onSelect: (project: Project) => void
    onEdit: () => void
}) => (
    <div className="relative">
        <button
            onClick={() => {
                if (!isActive) {
                    onSelect(project)
                } else {
                    onEdit()
                }
            }}
            onDoubleClick={onEdit}
            className={`px-2 py-1 rounded relative ${isActive
                ? 'text-white'
                : 'text-zinc-500 hover:text-zinc-300'
                }`}
        >
            {isActive && (
                <TabBackground isActive={isActive} />
            )}
            <span className="relative z-10">{project.name}</span>
        </button>
    </div>
) 