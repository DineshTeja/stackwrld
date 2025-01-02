import { useEffect, useState, useCallback } from 'react'
import { useEditor, useEditorState } from '@tiptap/react'
import type { AnyExtension } from '@tiptap/core'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { TiptapCollabProvider, WebSocketStatus } from '@hocuspocus/provider'
import type { Doc as YDoc } from 'yjs'

import { ExtensionKit } from '@/extensions/extension-kit'
import { userColors, userNames } from '@/lib/constants'
import { randomElement } from '@/lib/utils'
import type { EditorUser } from '@/components/BlockEditor/types'
import { initialContent } from '@/lib/data/initialContent'
import { Ai } from '@/extensions/Ai'
import { AiImage, AiWriter } from '@/extensions'
import { DocumentContent } from '@/types/schema'

export const useBlockEditor = ({
  aiToken,
  ydoc,
  provider,
  userId,
  userName = 'Maxi',
  documentId,
  initialDocContent,
  onContentUpdate,
}: {
  aiToken?: string
  ydoc: YDoc | null
  provider?: TiptapCollabProvider | null | undefined
  userId?: string
  userName?: string
  documentId?: string
  initialDocContent?: DocumentContent | null
  onContentUpdate?: (content: DocumentContent) => void
}) => {
  const [collabState, setCollabState] = useState<WebSocketStatus>(
    provider ? WebSocketStatus.Connecting : WebSocketStatus.Disconnected,
  )

  // Track if content has been initialized
  const [isContentInitialized, setIsContentInitialized] = useState(false)

  const handleUpdate = useCallback(({ editor }) => {
    if (!documentId || !onContentUpdate || !initialDocContent) return

    // Only update if content has been initialized
    if (!isContentInitialized) return

    const tiptapContent = editor.getJSON()
    
    // Don't update if it's an empty document
    if (tiptapContent.content?.length === 1 && 
        tiptapContent.content[0].type === 'paragraph' && 
        !tiptapContent.content[0].content) {
      return
    }

    onContentUpdate({
      ...initialDocContent,
      tiptap: tiptapContent
    })
  }, [documentId, onContentUpdate, initialDocContent, isContentInitialized])

  const editor = useEditor(
    {
      immediatelyRender: true,
      shouldRerenderOnTransaction: false,
      autofocus: true,
      onCreate: ({ editor }) => {
        if (provider && !provider.isSynced) {
          provider.on('synced', () => {
            setTimeout(() => {
              if (editor.isEmpty) {
                editor.commands.setContent(JSON.parse(JSON.stringify(initialDocContent?.tiptap || initialContent)))
                setIsContentInitialized(true)
              }
            }, 0)
          })
        } else if (editor.isEmpty) {
          editor.commands.setContent(JSON.parse(JSON.stringify(initialDocContent?.tiptap || initialContent)))
          editor.commands.focus('start', { scrollIntoView: true })
          setIsContentInitialized(true)
        }
      },
      onUpdate: handleUpdate,
      extensions: [
        ...ExtensionKit({
          provider,
        }),
        provider && ydoc
          ? Collaboration.configure({
              document: ydoc,
            })
          : undefined,
        provider
          ? CollaborationCursor.configure({
              provider,
              user: {
                name: randomElement(userNames),
                color: randomElement(userColors),
              },
            })
          : undefined,
        aiToken
          ? AiWriter.configure({
              authorId: userId,
              authorName: userName,
            })
          : undefined,
        aiToken
          ? AiImage.configure({
              authorId: userId,
              authorName: userName,
            })
          : undefined,
        aiToken ? Ai.configure({ token: aiToken }) : undefined,
      ].filter((e): e is AnyExtension => e !== undefined),
      editorProps: {
        attributes: {
          autocomplete: 'off',
          autocorrect: 'off',
          autocapitalize: 'off',
          class: 'min-h-full',
        },
      },
    },
    [ydoc, provider, documentId, initialDocContent?.tiptap]
  )

  // Reset content initialization state when document changes
  useEffect(() => {
    setIsContentInitialized(false)
  }, [documentId])

  const users = useEditorState({
    editor,
    selector: (ctx): (EditorUser & { initials: string })[] => {
      if (!ctx.editor?.storage.collaborationCursor?.users) {
        return []
      }

      return ctx.editor.storage.collaborationCursor.users.map((user: EditorUser) => {
        const names = user.name?.split(' ')
        const firstName = names?.[0]
        const lastName = names?.[names.length - 1]
        const initials = `${firstName?.[0] || '?'}${lastName?.[0] || '?'}`

        return { ...user, initials: initials.length ? initials : '?' }
      })
    },
  })

  useEffect(() => {
    provider?.on('status', (event: { status: WebSocketStatus }) => {
      setCollabState(event.status)
    })
  }, [provider])

  return { editor, users, collabState }
}
