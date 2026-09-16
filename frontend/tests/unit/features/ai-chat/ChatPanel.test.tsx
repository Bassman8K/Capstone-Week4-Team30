import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatPanel } from '@/features/ai-chat/components/ChatPanel'

describe('ChatPanel', () => {
  it('starts empty with the send button disabled', () => {
    render(<ChatPanel />)

    expect(screen.getByText(/describe what's happening/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })

  it('runs a situation through to a mocked recommendation', async () => {
    const user = userEvent.setup()
    render(<ChatPanel />)

    await user.type(
      screen.getByRole('textbox', { name: /describe what's happening/i }),
      "Ben isn't eating his dinner"
    )
    await user.click(screen.getByRole('button', { name: /send/i }))

    // The carer's message is echoed back immediately...
    expect(screen.getByText("Ben isn't eating his dinner")).toBeInTheDocument()
    // ...with a loading state while the assistant "thinks"...
    expect(screen.getByRole('status')).toHaveTextContent(/thinking/i)

    // ...then the structured reply lands.
    expect(await screen.findByText(/texture/i, {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /turning it into a soup/i })).toBeInTheDocument()
    expect(screen.getByText(/how was my help/i)).toBeInTheDocument()
  })

  it('acknowledges feedback once a rating is given', async () => {
    const user = userEvent.setup()
    render(<ChatPanel />)

    await user.type(screen.getByRole('textbox', { name: /describe/i }), 'He skipped lunch')
    await user.click(screen.getByRole('button', { name: /send/i }))
    await screen.findByText(/how was my help/i, {}, { timeout: 3000 })

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
