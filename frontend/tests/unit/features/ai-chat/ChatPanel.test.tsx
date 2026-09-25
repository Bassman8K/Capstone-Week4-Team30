import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  mockedRequestSupport.mockResolvedValue({ success: true, data: reply })
})

async function submit(situation = 'He skipped dinner') {
  const user = userEvent.setup()
  await user.type(screen.getByRole('textbox', { name: /describe/i }), situation)
  await user.click(screen.getByRole('button', { name: /send/i }))
  return user
}

describe('ChatPanel', () => {
  it('starts empty with the send button disabled', () => {
    render(<ChatPanel />)

    expect(screen.getByText(/describe what's happening/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })

  it('sends the situation and the known child context to the assistant', async () => {
    render(<ChatPanel />)
    await submit("Ben isn't eating his dinner")

    expect(mockedRequestSupport).toHaveBeenCalledWith(
      expect.objectContaining({
        childName: 'Ben',
        currentSituation: "Ben isn't eating his dinner",
        knownTriggers: expect.arrayContaining([expect.any(String)]),
      })
    )
  })

  it('shows a loading state, then the recommendation', async () => {
    let resolve: (value: { success: true; data: SupportResponse }) => void = () => {}
    mockedRequestSupport.mockReturnValue(
      new Promise((r) => {
        resolve = r
      })
    )

    render(<ChatPanel />)
    await submit()

    expect(screen.getByRole('status')).toHaveTextContent(/thinking/i)

    resolve({ success: true, data: reply })

    expect(await screen.findByText(/how a food feels/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /turning it into a soup/i })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('surfaces the failure message when the assistant is unreachable', async () => {
    mockedRequestSupport.mockResolvedValue({
      success: false,
      error: "Couldn't reach the assistant. Check that the local AI service is running.",
    })

    render(<ChatPanel />)
    await submit()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/couldn't reach the assistant/i)
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('retries the last situation after a failure', async () => {
    mockedRequestSupport.mockResolvedValue({ success: false, error: 'Service unavailable.' })

    render(<ChatPanel />)
    const user = await submit('He skipped lunch')

    mockedRequestSupport.mockResolvedValue({ success: true, data: reply })
    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(await screen.findByText(/how a food feels/i)).toBeInTheDocument()
    expect(mockedRequestSupport).toHaveBeenLastCalledWith(
      expect.objectContaining({ currentSituation: 'He skipped lunch' })
    )
  })

  it('shows a safety notice above the advice when the agent returns one', async () => {
    mockedRequestSupport.mockResolvedValue({
      success: true,
      data: { ...reply, safetyNotice: 'If this continues, speak to a health professional.' },
    })

    render(<ChatPanel />)
    await submit()

    expect(await screen.findByText(/speak to a health professional/i)).toBeInTheDocument()
  })

  it('acknowledges feedback once a rating is given', async () => {
    render(<ChatPanel />)
    const user = await submit()
    await screen.findByText(/how was my help/i)

    await user.click(screen.getByRole('button', { name: /very helpful/i }))

    expect(screen.getByText(/keep this in mind for the future/i)).toBeInTheDocument()
    expect(screen.queryByText(/how was my help/i)).not.toBeInTheDocument()
  })

  it('toggles the context drawer from the menu button', async () => {
    const user = userEvent.setup()
    render(<ChatPanel />)

    expect(screen.queryByText(/ben's info/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /show ben's info/i }))

    expect(screen.getByText(/ben's info/i)).toBeInTheDocument()
    expect(screen.getByText(/sleep: 6.5 hours/i)).toBeInTheDocument()
  })
})
