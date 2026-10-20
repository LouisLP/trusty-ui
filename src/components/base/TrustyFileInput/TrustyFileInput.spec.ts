import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { formatFileSize } from './TrustyFileInput.format'
import TrustyFileInput from './TrustyFileInput.vue'

function file(name: string, size = 1024, lastModified = 0) {
  const made = new File(['x'], name, { lastModified })
  // jsdom derives `size` from the blob parts, so it is pinned here instead.
  Object.defineProperty(made, 'size', { value: size })
  return made
}

/** jsdom refuses assignment to `input.files`, so a drop is what the tests use to feed files in. */
function drop(wrapper: ReturnType<typeof mount>, files: File[]) {
  return wrapper.get('.trusty-file-input-dropzone').trigger('drop', {
    dataTransfer: { files },
  })
}

describe('trustyFileInput', () => {
  it('renders one row per held file, with its name and size', () => {
    const wrapper = mount(TrustyFileInput, {
      props: { modelValue: [file('a.vue', 560128), file('b.png', 2048)] },
    })
    const rows = wrapper.findAll('.trusty-file-input-file')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.get('.trusty-file-input-name').text()).toBe('a.vue')
    expect(rows[0]!.get('.trusty-file-input-size').text()).toBe('547KB')
  })

  it('renders no file list while empty', () => {
    const wrapper = mount(TrustyFileInput)
    expect(wrapper.find('.trusty-file-input-files').exists()).toBe(false)
  })

  it('hides the description until one is given', () => {
    expect(mount(TrustyFileInput).find('.trusty-file-input-description').exists()).toBe(false)
    const wrapper = mount(TrustyFileInput, { props: { description: 'PNG up to 2MB' } })
    expect(wrapper.get('.trusty-file-input-description').text()).toBe('PNG up to 2MB')
  })

  it('commits dropped files', async () => {
    const wrapper = mount(TrustyFileInput, { props: { multiple: true } })
    await drop(wrapper, [file('a.png'), file('b.png')])
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toHaveLength(2)
  })

  it('replaces the held file when not multiple', async () => {
    const wrapper = mount(TrustyFileInput, { props: { modelValue: [file('old.png')] } })
    await drop(wrapper, [file('new.png'), file('extra.png')])
    const committed = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as File[]
    expect(committed.map(f => f.name)).toEqual(['new.png'])
  })

  it('appends to the held files when multiple, skipping ones already held', async () => {
    const held = file('a.png', 1024, 7)
    const wrapper = mount(TrustyFileInput, { props: { modelValue: [held], multiple: true } })
    await drop(wrapper, [file('a.png', 1024, 7), file('b.png')])
    const committed = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as File[]
    expect(committed.map(f => f.name)).toEqual(['a.png', 'b.png'])
  })

  it('ignores a drop while disabled', async () => {
    const wrapper = mount(TrustyFileInput, { props: { disabled: true } })
    await drop(wrapper, [file('a.png')])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('marks itself dragged-over between dragenter and drop', async () => {
    const wrapper = mount(TrustyFileInput)
    const zone = wrapper.get('.trusty-file-input-dropzone')
    expect(zone.attributes('data-drag-over')).toBeUndefined()

    await zone.trigger('dragenter')
    expect(zone.attributes('data-drag-over')).toBeDefined()

    // A nested dragenter/dragleave pair must not clear the state early.
    await zone.trigger('dragenter')
    await zone.trigger('dragleave')
    expect(zone.attributes('data-drag-over')).toBeDefined()

    await zone.trigger('dragleave')
    expect(zone.attributes('data-drag-over')).toBeUndefined()
  })

  it('stays calm on a dragenter while disabled', async () => {
    const wrapper = mount(TrustyFileInput, { props: { disabled: true } })
    const zone = wrapper.get('.trusty-file-input-dropzone')
    await zone.trigger('dragenter')
    expect(zone.attributes('data-drag-over')).toBeUndefined()
  })

  it('removes a file through its remove button, named after the file', async () => {
    const wrapper = mount(TrustyFileInput, {
      props: { modelValue: [file('a.png'), file('b.png')], multiple: true },
    })
    const remove = wrapper.get('.trusty-file-input-remove')
    expect(remove.attributes('aria-label')).toBe('Remove a.png')

    await remove.trigger('click')
    const committed = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as File[]
    expect(committed.map(f => f.name)).toEqual(['b.png'])
  })

  it('keeps the browse button out of the tab order and the a11y tree', () => {
    const browse = mount(TrustyFileInput).get('.trusty-file-input-browse')
    expect(browse.attributes('tabindex')).toBe('-1')
    expect(browse.attributes('aria-hidden')).toBe('true')
  })

  it('names the input "Files" when nothing else names it', () => {
    expect(mount(TrustyFileInput).get('input').attributes('aria-label')).toBe('Files')
  })

  // aria-label would beat the <label for> TrustyFormItem renders, so the fallback stands down.
  it('drops the fallback name once a field id or aria-labelledby arrives', () => {
    expect(mount(TrustyFileInput, { attrs: { id: 'files' } })
      .get('input').attributes('aria-label')).toBeUndefined()
    expect(mount(TrustyFileInput, { attrs: { 'aria-labelledby': 'files-label' } })
      .get('input').attributes('aria-label')).toBeUndefined()
  })

  it('lets a caller name the input themselves', () => {
    const wrapper = mount(TrustyFileInput, { attrs: { 'aria-label': 'Attachments' } })
    expect(wrapper.get('input').attributes('aria-label')).toBe('Attachments')
  })

  it('marks itself invalid on the input and on the dropzone', () => {
    const wrapper = mount(TrustyFileInput, { props: { invalid: true } })
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('.trusty-file-input-dropzone').attributes('data-invalid')).toBeDefined()
  })

  it('leaves the dropzone unmarked while valid', () => {
    const wrapper = mount(TrustyFileInput)
    expect(wrapper.get('.trusty-file-input-dropzone').attributes('data-invalid')).toBeUndefined()
  })

  it('passes accept, multiple and required down to the native input', () => {
    const wrapper = mount(TrustyFileInput, {
      props: { accept: 'image/*', multiple: true, required: true },
    })
    const input = wrapper.get('input')
    expect(input.attributes('accept')).toBe('image/*')
    expect(input.attributes('multiple')).toBeDefined()
    expect(input.attributes('required')).toBeDefined()
  })

  it('passes through id and aria-describedby attrs onto the input', () => {
    const wrapper = mount(TrustyFileInput, {
      attrs: { 'id': 'files', 'aria-describedby': 'files-hint' },
    })
    const input = wrapper.get('input')
    expect(input.attributes('id')).toBe('files')
    expect(input.attributes('aria-describedby')).toBe('files-hint')
  })

  it('disables the input, the browse button and every remove button', () => {
    const wrapper = mount(TrustyFileInput, {
      props: { modelValue: [file('a.png')], disabled: true },
    })
    expect(wrapper.get('.trusty-file-input-dropzone').attributes('data-disabled')).toBeDefined()
    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
    expect(wrapper.get('.trusty-file-input-browse').attributes('disabled')).toBeDefined()
    expect(wrapper.get('.trusty-file-input-remove').attributes('disabled')).toBeDefined()
  })
})

describe('formatFileSize', () => {
  it.each([
    [0, '0B'],
    [512, '512B'],
    [1024, '1KB'],
    [560128, '547KB'],
    [1536, '1.5KB'],
    [5 * 1024 ** 2, '5MB'],
    [3 * 1024 ** 4, '3TB'],
  ])('formats %i as %s', (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected)
  })

  it('falls back to a dash for a size it cannot read', () => {
    expect(formatFileSize(Number.NaN)).toBe('—')
    expect(formatFileSize(-1)).toBe('—')
  })
})
