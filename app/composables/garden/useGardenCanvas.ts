import { ref, reactive } from 'vue'

export const useGardenCanvas = (resetZoom: () => void) => {
  const background = ref<HTMLImageElement | null>(null)
  const backgroundConfig = reactive({
    x: 0,
    y: 0,
    image: null as HTMLImageElement | null,
    width: 0,
    height: 0,
  })

  const loadBackgroundImage = (imageUrl: string) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous' // For CORS if needed
    img.src = imageUrl
    img.onload = () => {
      background.value = img
      backgroundConfig.image = img
      backgroundConfig.width = img.naturalWidth
      backgroundConfig.height = img.naturalHeight

      setTimeout(() => {
        resetZoom()
      }, 100)
    }
    img.onerror = () => {
      console.error('Failed to load background image:', imageUrl)
    }
  }

  const handleBackgroundClick = (
    event: Event,
    onBackgroundClick?: (x: number, y: number) => void,
  ) => {
    if (!onBackgroundClick) return

    const stage = event.target.getStage()
    const pointer = stage.getPointerPosition()

    const isBackgroundClick = event.target.attrs?.name === 'background' || !event.target.attrs?.name

    if (isBackgroundClick && pointer) {
      onBackgroundClick(pointer.x, pointer.y)
    }
  }

  return {
    background,
    backgroundConfig,
    loadBackgroundImage,
    handleBackgroundClick,
  }
}
