import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { ChatPanel } from '@/features/ai-chat/components/ChatPanel'

export const metadata: Metadata = {
  title: 'AI Chat',
}

export default function AiChatPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="AI Chat" description="Describe what's happening and get suggestions." />
      <ChatPanel />
    </div>
  )
}
