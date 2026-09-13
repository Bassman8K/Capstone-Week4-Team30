import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { ScaffoldNotice } from '@/components/shared/ScaffoldNotice'
import { ChatShell } from '@/features/ai-chat/components/ChatShell'
import { ContextDrawer } from '@/features/ai-chat/components/ContextDrawer'
import { FeedbackWidget } from '@/features/ai-chat/components/FeedbackWidget'

export const metadata: Metadata = {
  title: 'AI Chat',
}

export default function AiChatPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="AI Chat" description="Describe what's happening and get suggestions." />

      <ScaffoldNotice>
        Layout only. Sprint 2 wires the composer to the assistant endpoint (see{' '}
        <code>backend/src/lib/ollama.ts</code>) and renders real messages.
      </ScaffoldNotice>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <ChatShell>
          <p className="text-sm text-zinc-400">Messages will appear here.</p>
        </ChatShell>

        <div className="space-y-4">
          <ContextDrawer
            childName="Ben"
            snapshot={{
              sleepHours: null,
              breakfast: null,
              mood: null,
              schoolHours: null,
              nextAppointment: null,
            }}
          />
          <FeedbackWidget />
        </div>
      </div>
    </div>
  )
}
