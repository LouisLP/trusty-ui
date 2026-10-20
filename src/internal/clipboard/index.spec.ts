import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyText } from './index'

// jsdom implements neither `navigator.clipboard` nor `document.execCommand`, so each test stubs exactly the route it is exercising.
function stubClipboard(writeText: ((text: string) => Promise<void>) | undefined) {
  vi.stubGlobal('navigator', { ...navigator, clipboard: writeText ? { writeText } : undefined })
}

function stubExecCommand(result: boolean | (() => boolean)) {
  const execCommand = vi.fn(typeof result === 'function' ? result : () => result)
  Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand, writable: true })
  return execCommand
}

afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(document, 'execCommand')
})

describe('copyText', () => {
  it('uses the Clipboard API when it is available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboard(writeText)
    const execCommand = stubExecCommand(true)

    await expect(copyText('hello')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello')
    expect(execCommand).not.toHaveBeenCalled()
  })

  // The bug this module exists for: an insecure context has no `navigator.clipboard` at all, so a direct `.writeText` throws on click.
  it('falls back to execCommand outside a secure context', async () => {
    stubClipboard(undefined)
    const execCommand = stubExecCommand(true)

    await expect(copyText('hello')).resolves.toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
  })

  it('falls back to execCommand when the Clipboard API is refused', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('NotAllowedError'))
    stubClipboard(writeText)
    const execCommand = stubExecCommand(true)

    await expect(copyText('hello')).resolves.toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
  })

  it('reports failure when neither route works', async () => {
    stubClipboard(undefined)
    stubExecCommand(false)

    await expect(copyText('hello')).resolves.toBe(false)
  })

  it('reports failure instead of throwing when execCommand is missing', async () => {
    stubClipboard(undefined)

    await expect(copyText('hello')).resolves.toBe(false)
  })

  it('selects the text and cleans up after itself', async () => {
    stubClipboard(undefined)
    let selected: string | undefined
    stubExecCommand(() => {
      // The textarea is in the document, holding the text, only while the browser's copy command runs.
      selected = document.querySelector('textarea')?.value
      return true
    })

    const button = document.createElement('button')
    document.body.appendChild(button)
    button.focus()

    await copyText('hello')

    expect(selected).toBe('hello')
    expect(document.querySelector('textarea')).toBeNull()
    expect(document.activeElement).toBe(button)

    button.remove()
  })
})
