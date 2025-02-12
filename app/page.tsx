"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { ProjectTabs } from "@/components/ProjectTabs"
import { DocumentCard } from "@/components/DocumentCard"
import { AddDocumentForm } from "@/components/AddDocumentForm"
import { supabase } from "@/lib/supabase"
import type { Tables, TablesInsert } from "@/types/schema"
import { DocumentDialog } from "@/components/DocumentDialog"
import { useUser } from "@/hooks/use-user"
import { redirect } from "next/navigation"

type Project = Tables<"projects"> & {
  documents: Tables<"documents">[]
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Tables<"documents"> | null>(null)
  const { user, loading } = useUser()

  useEffect(() => {
    if (!loading && user) {
      fetchProjects()
    }
  }, [user, loading])

  const fetchProjects = async () => {
    console.log("Fetching projects for user:", user)
    if (!user) return

    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order('created_at', { ascending: true })

    if (projectsError) {
      console.error("Error fetching projects:", projectsError)
      return
    }

    const projectsWithDocs = await Promise.all(
      projectsData.map(async (project) => {
        const { data: documents, error: documentsError } = await supabase
          .from("documents")
          .select("*")
          .eq("project_id", project.id)
          .order('created_at', { ascending: false })

        if (documentsError) {
          console.error("Error fetching documents:", documentsError)
          return { ...project, documents: [] }
        }

        return { ...project, documents: documents || [] }
      })
    )

    setProjects(projectsWithDocs)
    if (projectsWithDocs.length > 0 && !currentProject) {
      setCurrentProject(projectsWithDocs[0])
    } else if (currentProject) {
      const updatedCurrentProject = projectsWithDocs.find(p => p.id === currentProject.id)
      if (updatedCurrentProject) {
        setCurrentProject(updatedCurrentProject)
      }
    }
  }

  const handleError = async (error: unknown, category: Tables<"documents">["category"]) => {
    if (!currentProject || !user) return

    const errorDoc: TablesInsert<"documents"> = {
      id: crypto.randomUUID(),
      title: "Error",
      preview: error instanceof Error ? error.message : 'Failed to extract content',
      status: "error",
      type: "webpage",
      category,
      project_id: currentProject.id,
      user_id: user.id,
      content: {
        markdown: '',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to extract content',
        url: ''
      },
      metadata: {
        total: 0,
        completed: 0,
        creditsUsed: 0,
        expiresAt: new Date().toISOString(),
        hasMore: false
      }
    }

    const { error: insertError } = await supabase
      .from("documents")
      .insert(errorDoc)

    if (insertError) {
      console.error("Error inserting error document:", insertError)
      return
    }

    await fetchProjects()
  }

  const handleSubmit = async (data: {
    name: string,
    category: Tables<"documents">["category"],
    url: string
  }) => {
    if (!currentProject || !user) return

    try {
      setIsProcessing(true)

      const newDoc: TablesInsert<"documents"> = {
        id: crypto.randomUUID(),
        title: data.name,
        preview: data.url ? "Processing..." : "Empty document",
        status: "pending",
        type: "webpage",
        category: data.category,
        project_id: currentProject.id,
        user_id: user.id,
        content: null,
        metadata: null
      }

      const optimisticDoc = newDoc as Tables<"documents">
      setCurrentProject(prev => prev ? {
        ...prev,
        documents: [optimisticDoc, ...prev.documents]
      } : prev)

      const [insertResult, scrapeResponse] = await Promise.all([
        supabase
          .from("documents")
          .insert(newDoc)
          .select()
          .single(),

        fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: data.url,
            name: data.name,
            category: data.category
          })
        })
      ])

      if (insertResult.error) {
        throw new Error(insertResult.error.message)
      }

      const scrapeData = await scrapeResponse.json()
      if (!scrapeResponse.ok) {
        throw new Error(scrapeData.error || 'Failed to extract content')
      }

      const { error: updateError } = await supabase
        .from("documents")
        .update({
          status: "active",
          title: scrapeData.content.title || data.name,
          preview: scrapeData.content.description || (data.url ? 'Content extracted successfully' : 'Empty document'),
          content: scrapeData.content,
          metadata: scrapeData.metadata
        })
        .eq("id", insertResult.data.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      setCurrentProject(prev => {
        if (!prev) return prev
        const updatedDocs = prev.documents.map(doc =>
          doc.id === insertResult.data.id
            ? {
              ...doc,
              status: "active" as "active" | "pending" | "error",
              title: scrapeData.content.title || data.name,
              preview: scrapeData.content.description || 'Content extracted successfully',
              content: scrapeData.content,
              metadata: scrapeData.metadata
            }
            : doc
        )
        return { ...prev, documents: updatedDocs }
      })

    } catch (error) {
      handleError(error, data.category)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting document:", error)
      return
    }

    await fetchProjects()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <h1 className="text-2xl font-light">stack.wrld</h1>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </main>
    )
  }

  if (!user) {
    redirect('/signin')
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <LayoutGroup>
          <ProjectTabs
            projects={projects}
            currentProject={currentProject}
            onProjectChange={setCurrentProject}
            onProjectsUpdate={setProjects}
          />
        </LayoutGroup>

        <div className="space-y-2 w-full overflow-x-auto">
          <AddDocumentForm
            isProcessing={isProcessing}
            onSubmit={handleSubmit}
          />
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProject?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              {currentProject?.documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onSelect={setSelectedDoc}
                  onDelete={handleDelete}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <DocumentDialog
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUpdate={fetchProjects}
        />
      </div>
    </main>
  )
}
