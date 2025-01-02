"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { ProjectTabs } from "@/components/ProjectTabs"
import { DocumentCard } from "@/components/DocumentCard"
import { AddDocumentForm } from "@/components/AddDocumentForm"
import { supabase } from "@/lib/supabase"
import type { Tables, TablesInsert, DocumentContent, DocumentMetadata } from "@/types/schema"
import { DocumentDialog } from "@/components/DocumentDialog"

type Project = Tables<"projects"> & {
  documents: Tables<"documents">[]
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Tables<"documents"> | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select("*")
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
    if (!currentProject) return

    const errorDoc: TablesInsert<"documents"> = {
      id: crypto.randomUUID(),
      title: "Error",
      preview: error instanceof Error ? error.message : 'Failed to extract content',
      status: "error",
      type: "webpage",
      category,
      project_id: currentProject.id,
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
    if (!currentProject) return

    try {
      setIsProcessing(true)

      const newDoc: TablesInsert<"documents"> = {
        id: crypto.randomUUID(),
        title: data.name,
        preview: "Processing...",
        status: "pending",
        type: "webpage",
        category: data.category,
        project_id: currentProject.id,
        content: null,
        metadata: null
      }

      const optimisticDoc = newDoc as Tables<"documents">
      setCurrentProject(prev => prev ? {
        ...prev,
        documents: [optimisticDoc, ...prev.documents]
      } : prev)

      const { data: insertedDoc, error: insertError } = await supabase
        .from("documents")
        .insert(newDoc)
        .select()
        .single()

      if (insertError || !insertedDoc) {
        setCurrentProject(prev => prev ? {
          ...prev,
          documents: prev.documents.filter(d => d.id !== newDoc.id)
        } : prev)
        throw new Error(insertError?.message || "Failed to insert document")
      }

      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: data.url })
      })

      const scrapeData = await response.json()

      if (!response.ok) {
        throw new Error(scrapeData.error || 'Failed to extract content')
      }

      const content: DocumentContent = {
        markdown: scrapeData.content.markdown || '',
        title: scrapeData.content.title || data.name,
        description: scrapeData.content.description || '',
        url: data.url,
        tiptap: scrapeData.content.tiptap || null
      }

      const metadata: DocumentMetadata = {
        total: scrapeData.metadata.total || 0,
        completed: scrapeData.metadata.completed || 0,
        creditsUsed: scrapeData.metadata.creditsUsed || 0,
        expiresAt: scrapeData.metadata.expiresAt || new Date().toISOString(),
        hasMore: scrapeData.metadata.hasMore || false
      }

      const { error: updateError } = await supabase
        .from("documents")
        .update({
          status: "active",
          title: content.title,
          preview: content.description || 'Content extracted successfully',
          content,
          metadata
        })
        .eq("id", insertedDoc.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      await fetchProjects()
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

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-light">stack.wrld</h1>
          <LayoutGroup>
            <ProjectTabs
              projects={projects}
              currentProject={currentProject}
              onProjectChange={setCurrentProject}
              onProjectsUpdate={setProjects}
            />
          </LayoutGroup>
        </div>

        <div className="space-y-2">
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
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
