import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatPanel } from '@/features/ai-chat/components/ChatPanel'
import { requestSupport } from '@/features/ai-chat/actions/requestSupport'
import type { SupportResponse } from '@/features/ai-chat/types'

// The Server Action is the seam between the app and Dev 2's adapter — stub it
// so these tests stay about the screen's behaviour, not the network.
vi.mock('@/features/ai-chat/actions/requestSupport', () => ({
  requestSupport: vi.fn(),
}))

const mockedRequestSupport = vi.mocked(requestSupport)

const reply: SupportResponse = {
  possibleContext: 'This often comes down to how a food feels.',
  suggestedActions: ['turning it into a soup'],
  followUpQuestion: 'Was anything different today?',
  safetyNotice: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedRequestSupport.mockResolvedValue({
    success: true,
    data: reply,
  })
})

async function submit(situation = 'He skipped dinner') {
  const user = userEvent.setup()

  await user.type(
    screen.getByRole('textbox', { name: /describe/i }),
    situation
  )

  await user.click(
    screen.getByRole('button', { name: /send/i })
  )

  return user
}

describe('ChatPanel', () => {
  it('starts empty with the send button disabled', () => {
    render(<ChatPanel />)

    expect(
      screen.getByText(/describe what's happening/i)
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: /send/i })
    ).toBeDisabled()
  })

  it('sends the situation and the known child context to the assistant', async () => {
    render(<ChatPanel />)

    await submit("Ben isn't eating his dinner")

    expect(mockedRequestSupport).toHaveBeenCalledWith(
      expect.objectContaining({
        childName: 'Ben',
        currentSituation: "Ben isn't eating his dinner",
        knownTriggers: expect.arrayContaining([
          expect.any(String),
        ]),
      })
    )
  })

  it('sends only relevant context from the info panel as recentContext', async () => {
    render(<ChatPanel />)

    await submit('Ben is anxious about his appointment today')

    expect(mockedRequestSupport).toHaveBeenCalledWith(
      expect.objectContaining({
        currentSituation: 'Ben is anxious about his appointment today',
        recentContext: 'Mood: Stressed. Appointment: 4:30.',
      })
    )
  })
})
it('does not send unrelated snapshot context for a food refusal', async () => {
  render(<ChatPanel />)

  await submit('Ben refused beef yesterday.')

  expect(mockedRequestSupport).toHaveBeenCalledWith(
    expect.objectContaining({
      currentSituation: 'Ben refused beef yesterday.',
      recentContext: undefined,
    })
  )
})

  it('shows the follow-up question when the assistant suggests no actions yet', async () => {
    mockedRequestSupport.mockResolvedValue({
      success: true,
      data: {
        possibleContext: 'Ben is upset after school.',
        suggestedActions: [],
        followUpQuestion: 'What happened just before this started?',
        safetyNotice: null,
      },
    })

    render(<ChatPanel />)

    await submit('Ben is upset after school')

    expect(
      await screen.findByText(/what happened just before this started/i)
    ).toBeInTheDocument()
    expect(screen.queryByText(/you can try/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('includes recent conversation turns as short-term session context', async () => {
    render(<ChatPanel />)

    await submit('The shopping centre is too loud for Ben')

    // Wait until the first assistant response has been added.
    expect(
      await screen.findByText(/how a food feels/i)
    ).toBeInTheDocument()

    await submit('What should I try next?')

    expect(mockedRequestSupport).toHaveBeenLastCalledWith(
      expect.objectContaining({
        currentSituation: 'What should I try next?',
        sessionContext: [
          {
            role: 'user',
            content: 'The shopping centre is too loud for Ben',
          },
          {
            role: 'assistant',
            content:
              'turning it into a soup Was anything different today?',
          },
        ],
      })
    )
  })

  it('shows a loading state, then the recommendation', async () => {
    let resolve: (
      value: {
        success: true
        data: SupportResponse
      }
    ) => void = () => {}

    mockedRequestSupport.mockReturnValue(
      new Promise((r) => {
        resolve = r
      })
    )

    render(<ChatPanel />)

    await submit()

    expect(
      screen.getByRole('status')
    ).toHaveTextContent(/thinking/i)

    resolve({
      success: true,
      data: reply,
    })

    expect(
      await screen.findByText(/how a food feels/i)
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: /turning it into a soup/i,
      })
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('status')
    ).not.toBeInTheDocument()
  })

  it('surfaces the failure message when the assistant is unreachable', async () => {
    mockedRequestSupport.mockResolvedValue({
      success: false,
      error:
        "Couldn't reach the assistant. Check that the local AI service is running.",
    })

    render(<ChatPanel />)

    await submit()

    const alert = await screen.findByRole('alert')

    expect(alert).toHaveTextContent(
      /couldn't reach the assistant/i
    )

    expect(
      screen.getByRole('button', { name: /retry/i })
    ).toBeInTheDocument()
  })

  it('retries the last situation after a failure', async () => {
    mockedRequestSupport.mockResolvedValue({
      success: false,
      error: 'Service unavailable.',
    })

    render(<ChatPanel />)

    const user = await submit('He skipped lunch')

    mockedRequestSupport.mockResolvedValue({
      success: true,
      data: reply,
    })

    await user.click(
      screen.getByRole('button', { name: /retry/i })
    )

    expect(
      await screen.findByText(/how a food feels/i)
    ).toBeInTheDocument()

    expect(
      mockedRequestSupport
    ).toHaveBeenLastCalledWith(
      expect.objectContaining({
        currentSituation: 'He skipped lunch',
      })
    )
  })

  it('does not repeat the carer\'s message when retrying', async () => {
    mockedRequestSupport.mockResolvedValue({
      success: false,
      error: 'Service unavailable.',
    })

    render(<ChatPanel />)

    const user = await submit('He skipped lunch')

    mockedRequestSupport.mockResolvedValue({
      success: true,
      data: reply,
    })

    await user.click(
      screen.getByRole('button', { name: /retry/i })
    )

    await screen.findByText(/how a food feels/i)

    // Week 2 UX testing found retry adding the prompt to the conversation a
    // second time — it should still appear exactly once.
    expect(
      screen.getAllByText('He skipped lunch')
    ).toHaveLength(1)
  })

  it('does not resend the retried prompt as session context', async () => {
    mockedRequestSupport.mockResolvedValue({
      success: false,
      error: 'Service unavailable.',
    })

    render(<ChatPanel />)

    const user = await submit('He skipped lunch')

    mockedRequestSupport.mockResolvedValue({
      success: true,
      data: reply,
    })

    await user.click(
      screen.getByRole('button', { name: /retry/i })
    )

    await screen.findByText(/how a food feels/i)

    // The prompt travels in currentSituation; repeating it in the history
    // would hand Hermes the same message twice.
    expect(
      mockedRequestSupport
    ).toHaveBeenLastCalledWith(
      expect.objectContaining({
        currentSituation: 'He skipped lunch',
        sessionContext: [],
      })
    )
  })

  it('shows a safety notice above the advice when the agent returns one', async () => {
    mockedRequestSupport.mockResolvedValue({
      success: true,
      data: {
        ...reply,
        safetyNotice:
          'If this continues, speak to a health professional.',
      },
    })

    render(<ChatPanel />)

    await submit()

    expect(
      await screen.findByText(
        /speak to a health professional/i
      )
    ).toBeInTheDocument()
  })

  it('acknowledges feedback once a rating is given', async () => {
    render(<ChatPanel />)

    const user = await submit()

    await screen.findByText(/how was my help/i)

    await user.click(
      screen.getByRole('button', {
        name: /very helpful/i,
      })
    )

    expect(
      screen.getByText(
        /keep this in mind for the future/i
      )
    ).toBeInTheDocument()

    expect(
      screen.queryByText(/how was my help/i)
    ).not.toBeInTheDocument()
  })

  it('toggles the context drawer from the menu button', async () => {
    const user = userEvent.setup()

    render(<ChatPanel />)

    expect(
      screen.queryByText(/ben's info/i)
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: /show ben's info/i,
      })
    )

    expect(
      screen.getByText(/ben's info/i)
    ).toBeInTheDocument()

    expect(
      screen.getByText(/sleep: 6.5 hours/i)
    ).toBeInTheDocument()
  })

  it('puts each suggestion on its own left-aligned line', async () => {
    mockedRequestSupport.mockResolvedValue({
      success: true,
      data: { ...reply, suggestedActions: ['turning it into a soup', 'offering a familiar food'] },
    })

    render(<ChatPanel />)

    await submit()

    const first = await screen.findByRole('button', { name: 'turning it into a soup' })
    const second = screen.getByRole('button', { name: 'offering a familiar food' })

    // Mei's Sprint 3 Week 2 review: wrapped suggestions were coming out centred.
    for (const suggestion of [first, second]) {
      expect(suggestion).toHaveClass('block', 'text-left')
    }
    expect(screen.getByText('or')).toBeInTheDocument()
  })

  it('lists the conversation\'s suggestions under recent recommendations', async () => {
    render(<ChatPanel />)

    const user = await submit()
    await screen.findByText(/was anything different today/i)

    await user.click(screen.getByRole('button', { name: /show ben's info/i }))

    const panel = screen.getByRole('complementary', { name: /ben's info/i })

    expect(within(panel).getByText('Recent recommendations')).toBeInTheDocument()
    expect(within(panel).getByText('turning it into a soup')).toBeInTheDocument()
  })

  it('shows "None yet" under recent recommendations before any reply', async () => {
    const user = userEvent.setup()

    render(<ChatPanel />)

    await user.click(screen.getByRole('button', { name: /show ben's info/i }))

    const panel = screen.getByRole('complementary', { name: /ben's info/i })

    expect(within(panel).getByText('None yet')).toBeInTheDocument()
  })

  it('resets the conversation from the header', async () => {
    render(<ChatPanel />)

    const resetButton = screen.getByRole('button', { name: /reset chat/i })
    expect(resetButton).toBeDisabled()

    const user = await submit('He skipped lunch')
    await screen.findByText(/was anything different today/i)

    await user.click(resetButton)

    expect(screen.queryByText('He skipped lunch')).not.toBeInTheDocument()
    expect(screen.queryByText(/was anything different today/i)).not.toBeInTheDocument()
    expect(screen.getByText(/describe what's happening/i)).toBeInTheDocument()
    expect(resetButton).toBeDisabled()
  })

  it('clears an error state on reset', async () => {
    mockedRequestSupport.mockResolvedValue({ success: false, error: 'Service unavailable.' })

    render(<ChatPanel />)

    const user = await submit('He skipped lunch')
    await screen.findByRole('alert')

    await user.click(screen.getByRole('button', { name: /reset chat/i }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('cannot reset while a reply is loading', async () => {
    mockedRequestSupport.mockReturnValue(new Promise(() => {}))

    render(<ChatPanel />)

    await submit()

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset chat/i })).toBeDisabled()
  })

  it('keeps the chat box a fixed height so long conversations scroll inside it', () => {
    render(<ChatPanel />)

    const box = screen.getByRole('textbox', { name: /describe/i }).closest('div.flex.flex-col')

    // Mei's Sprint 3 priority #1 — the box no longer grows with the thread.
    expect(box).toHaveClass('h-[32rem]')
    expect(box).not.toHaveClass('min-h-[28rem]')
  })

  it('shows the context grouped under headings with today\'s date', async () => {
    const user = userEvent.setup()

    render(<ChatPanel />)

    await user.click(screen.getByRole('button', { name: /show ben's info/i }))

    const panel = screen.getByRole('complementary', { name: /ben's info/i })

    for (const heading of ['Sleep', 'Food', 'Observations', 'Events']) {
      expect(within(panel).getByText(heading)).toBeInTheDocument()
    }
    expect(within(panel).getByText(/total sleep: 6.5 hours/i)).toBeInTheDocument()
    expect(within(panel).getByText(String(new Date().getFullYear()), { exact: false })).toBeInTheDocument()
  })

  it('lets the context panel scroll within the chat\'s height', async () => {
    const user = userEvent.setup()

    render(<ChatPanel />)

    await user.click(screen.getByRole('button', { name: /show ben's info/i }))

    const panel = screen.getByRole('complementary', { name: /ben's info/i })

    // Mei's Sprint 3 priority #3 — scroll rather than overflow.
    expect(panel).toHaveClass('overflow-y-auto', 'lg:h-[32rem]')
  })

  it('lays the context panel over the chat on small screens', async () => {
    const user = userEvent.setup()

    render(<ChatPanel />)

    await user.click(
      screen.getByRole('button', {
        name: /show ben's info/i,
      })
    )

    // On a phone the panel used to drop into the next grid row, pushing it
    // below the conversation. It should overlay instead, and become a side
    // column again from lg up.
    const panel = screen.getByText(/ben's info/i).closest('aside')

    expect(panel).toHaveClass('absolute', 'right-0', 'lg:static')

    // A scrim gives a way back out on touch.
    expect(
      screen.getByRole('button', { name: /close ben's info/i })
    ).toBeInTheDocument()
  })