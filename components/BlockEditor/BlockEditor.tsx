import { EditorContent } from '@tiptap/react'
import React, { useRef, useCallback } from 'react'

import { LinkMenu } from '@/components/menus'

import { useBlockEditor } from '@/hooks/useBlockEditor'

import '@/styles/index.css'

import { Sidebar } from '@/components/Sidebar'
import ImageBlockMenu from '@/extensions/ImageBlock/components/ImageBlockMenu'
import { ColumnsMenu } from '@/extensions/MultiColumn/menus'
import { TableColumnMenu, TableRowMenu } from '@/extensions/Table/menus'
import { EditorHeader } from './components/EditorHeader'
import { TextMenu } from '../menus/TextMenu'
import { ContentItemMenu } from '../menus/ContentItemMenu'
import { useSidebar } from '@/hooks/useSidebar'
import * as Y from 'yjs'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import { DocumentContent } from '@/types/schema'
import { supabase } from '@/lib/supabase'

export const BlockEditor = ({
  ydoc,
  provider,
  documentId,
  content,
  onUpdate,
}: {
  aiToken?: string
  ydoc: Y.Doc | null
  provider?: TiptapCollabProvider | null | undefined
  documentId?: string
  content?: DocumentContent | null
  onUpdate?: () => void
}) => {
  const menuContainerRef = useRef<HTMLDivElement>(null)

  const leftSidebar = useSidebar()

  const handleContentUpdate = useCallback(async (updatedContent: DocumentContent) => {
    if (!documentId) return

    // Don't update if content hasn't changed
    if (JSON.stringify(updatedContent.tiptap) === JSON.stringify(content?.tiptap)) {
      return
    }

    const { error } = await supabase
      .from("documents")
      .update({
        content: updatedContent
      })
      .eq("id", documentId)

    if (error) {
      console.error("Error updating document content:", error)
      return
    }

    onUpdate?.()
  }, [documentId, onUpdate, content?.tiptap])

  const { editor } = useBlockEditor({
    ydoc,
    provider,
    documentId,
    initialDocContent: content,
    onContentUpdate: handleContentUpdate
  })

  if (!editor || !ydoc) {
    return null
  }

  return (
    <div className="flex h-full" ref={menuContainerRef}>
      {/* {JSON.stringify(content?.tiptap)} */}
      <Sidebar isOpen={leftSidebar.isOpen} onClose={leftSidebar.close} editor={editor} />
      <div className="relative flex flex-col flex-1 h-full overflow-hidden">
        <EditorHeader
          editor={editor}
          isSidebarOpen={leftSidebar.isOpen}
          toggleSidebar={leftSidebar.toggle}
        />
        <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
        <ContentItemMenu editor={editor} />
        <LinkMenu editor={editor} appendTo={menuContainerRef} />
        <TextMenu editor={editor} />
        <ColumnsMenu editor={editor} appendTo={menuContainerRef} />
        <TableRowMenu editor={editor} appendTo={menuContainerRef} />
        <TableColumnMenu editor={editor} appendTo={menuContainerRef} />
        <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
      </div>
    </div>
  )
}

export default BlockEditor
