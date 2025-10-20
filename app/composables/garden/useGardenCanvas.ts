import { ref, reactive, nextTick } from 'vue'
import type { GardenData } from '~/types/garden'

export const useGardenCanvas = (resetZoom: () => void) => {
  // Image de fond
  const background = ref<HTMLImageElement | null>(null)
  const backgroundConfig = reactive({
    x: 0,
    y: 0,
    image: null as HTMLImageElement | null,
    width: 0,
    height: 0,
  })

  // Load background image
  const loadBackgroundImage = (imageUrl: string, garden: GardenData) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous' // For CORS if needed
    img.src = imageUrl
    img.onload = () => {
      background.value = img
      backgroundConfig.image = img
      backgroundConfig.width = img.naturalWidth
      backgroundConfig.height = img.naturalHeight

      // Update stage size if dimensions not available from garden data
      if (!garden?.image_width || !garden?.image_height) {
        // Keep stage size but ensure background config has image dimensions
        backgroundConfig.width = img.naturalWidth
        backgroundConfig.height = img.naturalHeight
      }
      else {
        backgroundConfig.width = garden.image_width
        backgroundConfig.height = garden.image_height
      }

      // Appliquer le zoom initial pour ajuster la carte à la vue avec un délai
      nextTick(() => {
        // Attendre un peu plus longtemps pour s'assurer que le stage est prêt
        setTimeout(() => {
          resetZoom()
        }, 100)
      })
    }
    img.onerror = () => {
      console.error('Failed to load background image:', imageUrl)
    }
  }

  // Handle background click to add plant
  const handleBackgroundClick = (
    event: Event,
    onBackgroundClick?: (x: number, y: number) => void,
  ) => {
    // Only handle if we have a callback and the click is on the background (not on a plant)
    if (!onBackgroundClick) return

    const stage = event.target.getStage()
    const pointer = stage.getPointerPosition()

    // Check if the click target is the background image or stage
    const isBackgroundClick = event.target.attrs?.name === 'background' || !event.target.attrs?.name

    if (isBackgroundClick && pointer) {
      // Call the callback with the click coordinates
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
