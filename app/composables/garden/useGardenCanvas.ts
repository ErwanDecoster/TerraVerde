import { ref, reactive } from 'vue'

export const useGardenCanvas = (resetZoom: () => void) => {
  const background = ref<HTMLImageElement | null>(null)
  const backgroundCenterX = ref(0)
  const backgroundCenterY = ref(0)
  const backgroundOffsetX = ref(0)
  const backgroundOffsetY = ref(0)

  const normalizeRotation = (rotationDegrees: number) => {
    if (!Number.isFinite(rotationDegrees)) return 0
    return Math.max(0, Math.min(360, rotationDegrees))
  }

  const normalizeOffset = (offset: number) => {
    if (!Number.isFinite(offset)) return 0
    return offset
  }

  const applyBackgroundPosition = () => {
    backgroundConfig.x = backgroundCenterX.value + backgroundOffsetX.value
    backgroundConfig.y = backgroundCenterY.value + backgroundOffsetY.value
  }

  const backgroundConfig = reactive({
    x: 0,
    y: 0,
    image: null as HTMLImageElement | null,
    width: 0,
    height: 0,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
  })

  const loadBackgroundImage = (
    imageUrl: string,
    rotationDegrees = 0,
    offsetX = 0,
    offsetY = 0,
  ) => {
    const img = new globalThis.Image()
    img.crossOrigin = 'anonymous' // For CORS if needed
    img.src = imageUrl
    img.onload = () => {
      background.value = img
      backgroundConfig.image = img
      backgroundConfig.width = img.naturalWidth
      backgroundConfig.height = img.naturalHeight
      backgroundConfig.offsetX = img.naturalWidth / 2
      backgroundConfig.offsetY = img.naturalHeight / 2
      backgroundCenterX.value = img.naturalWidth / 2
      backgroundCenterY.value = img.naturalHeight / 2
      backgroundOffsetX.value = normalizeOffset(offsetX)
      backgroundOffsetY.value = normalizeOffset(offsetY)
      applyBackgroundPosition()
      backgroundConfig.rotation = normalizeRotation(rotationDegrees)

      setTimeout(() => {
        resetZoom()
      }, 100)
    }
    img.onerror = () => {
      console.error('Failed to load background image:', imageUrl)
    }
  }

  const setBackgroundRotation = (rotationDegrees: number) => {
    backgroundConfig.rotation = normalizeRotation(rotationDegrees)
  }

  const setBackgroundOffset = (offsetX: number, offsetY: number) => {
    backgroundOffsetX.value = normalizeOffset(offsetX)
    backgroundOffsetY.value = normalizeOffset(offsetY)
    applyBackgroundPosition()
  }

  const handleBackgroundClick = (
    event: Event,
    onBackgroundClick?: (x: number, y: number) => void,
  ) => {
    if (!onBackgroundClick) return

    const target = event.target as (EventTarget & {
      getStage?: () => { getPointerPosition: () => { x: number, y: number } | null }
      attrs?: { name?: string }
    }) | null

    if (!target?.getStage) return

    const stage = target.getStage()
    const pointer = stage.getPointerPosition()

    const targetName = target.attrs?.name
    const isBackgroundClick = targetName === 'background' || !targetName

    if (isBackgroundClick && pointer) {
      onBackgroundClick(pointer.x, pointer.y)
    }
  }

  return {
    background,
    backgroundConfig,
    loadBackgroundImage,
    setBackgroundRotation,
    setBackgroundOffset,
    handleBackgroundClick,
  }
}
