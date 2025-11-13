<template>
  <div class="space-y-2">
    <div
      v-if="editor"
      class="flex flex-wrap gap-1 text-xs"
    >
      <UButton
        size="xs"
        variant="soft"
        :disabled="!can('toggleBold')"
        :class="{ 'is-active': editor.isActive('bold') }"
        @click="cmd('toggleBold')"
      >
        B
      </UButton>
      <UButton
        size="xs"
        variant="soft"
        :disabled="!can('toggleItalic')"
        :class="{ 'is-active': editor.isActive('italic') }"
        @click="cmd('toggleItalic')"
      >
        I
      </UButton>
      <UButton
        size="xs"
        variant="soft"
        :disabled="!can('toggleStrike')"
        :class="{ 'is-active': editor.isActive('strike') }"
        @click="cmd('toggleStrike')"
      >
        S
      </UButton>
      <UButton
        size="xs"
        variant="soft"
        :disabled="!can('toggleCode')"
        :class="{ 'is-active': editor.isActive('code') }"
        @click="cmd('toggleCode')"
      >
        Code
      </UButton>
      <UButton
        size="xs"
        variant="soft"
        :class="{ 'is-active': editor.isActive('bulletList') }"
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        • List
      </UButton>
      <UButton
        size="xs"
        variant="soft"
        :class="{ 'is-active': editor.isActive('orderedList') }"
        @click="editor.chain().focus().toggleOrderedList().run()"
      >
        1. List
      </UButton>
      <UButton
        size="xs"
        variant="soft"
        :class="{ 'is-active': editor.isActive('blockquote') }"
        @click="editor.chain().focus().toggleBlockquote().run()"
      >
        ❝
      </UButton>
      <UButton
        size="xs"
        variant="soft"
        :class="{ 'is-active': editor.isActive('codeBlock') }"
        @click="editor.chain().focus().toggleCodeBlock().run()"
      >
        { }
      </UButton>
      <UButton
        size="xs"
        variant="soft"
        :disabled="!can('undo')"
        @click="editor.chain().focus().undo().run()"
      >
        ↺
      </UButton>
      <UButton
        size="xs"
        variant="soft"
        :disabled="!can('redo')"
        @click="editor.chain().focus().redo().run()"
      >
        ↻
      </UButton>
      <UButton
        size="xs"
        variant="soft"
        color="neutral"
        @click="clearContent"
      >
        Clear
      </UButton>
    </div>

    <div
      :class="[
        'rounded-md border p-2 focus-within:ring-1 focus-within:ring-primary-500',
        disabled && 'opacity-60 pointer-events-none',
      ]"
    >
      <TiptapEditorContent
        :editor="editor"
        class="prose max-w-none min-h-24 grid *:outline-none"
      />
      <div
        v-if="placeholder && isEmpty"
        class="text-gray-400 absolute pointer-events-none -mt-6 ml-1 text-sm"
      >
        {{ placeholder }}
      </div>
    </div>

    <div
      v-if="maxLength"
      class="text-right text-xs text-gray-500"
    >
      {{ currentLength }} / {{ maxLength }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string | null
  maxLength?: number
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  maxLength: undefined,
  placeholder: '',
  disabled: false,
})

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [TiptapStarterKit],
  onUpdate({ editor }) {
    const html = editor.getHTML()
    if (props.maxLength) {
      // Count plain text length for display; zod form will enforce as well
      if (getPlainText(html).length > props.maxLength) {
        // If exceeded, revert last change
        editor.commands.undo()
        return
      }
    }
    emit('update:modelValue', sanitizeEmpty(html))
  },
})

// Helpers
function getPlainText(html: string) {
  if (typeof window === 'undefined') return html
  const el = document.createElement('div')
  el.innerHTML = html
  return el.textContent || ''
}

function sanitizeEmpty(html: string) {
  // Normalize empty states to '' (tipTap empty doc is <p></p>)
  if (html === '<p></p>' || html === '<p></p>\n') return ''
  return html
}

const currentLength = computed(
  () =>
    getPlainText(editor?.value?.getHTML?.() || props.modelValue || '').length,
)
const isEmpty = computed(() => currentLength.value === 0)

// Watch external model changes
watch(
  () => props.modelValue,
  (val) => {
    const html = val || ''
    if (editor.value && html !== editor.value.getHTML()) {
      editor.value.commands.setContent(html, false)
    }
  },
)

function cmd(action: string) {
  // Generic command executor for simple mark toggles
  // @ts-expect-error dynamic call
  editor.value?.chain().focus()[action]().run()
}

function can(action: string) {
  // @ts-expect-error dynamic call
  return !!editor.value?.can().chain().focus()[action]().run()
}

function clearContent() {
  editor.value?.commands.clearContent(true)
  emit('update:modelValue', '')
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<!-- <style scoped>
.is-active {
  background-color: var(--color-primary-600, #2563eb);
  color: white;
}
@media (prefers-color-scheme: dark) {
  .is-active {
    background-color: var(--color-primary-500, #3b82f6);
  }
}
</style> -->
