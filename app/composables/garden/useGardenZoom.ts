import { reactive, type Ref } from 'vue'

interface BackgroundConfig {
  width: number
  height: number
  [key: string]: unknown
}

interface KonvaStage {
  scaleX: () => number
  scaleY: () => number
  x: () => number
  y: () => number
  width: () => number
  height: () => number
  scale: (scale: { x: number, y: number }) => void
  position: (pos: { x: number, y: number }) => void
  batchDraw: () => void
  getPointerPosition: () => { x: number, y: number } | null
}

export const useGardenZoom = (
  stageRef: Ref<{ getStage: () => KonvaStage } | null>,
  backgroundConfig: Ref<BackgroundConfig>,
) => {
  const stageConfig = reactive({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight - 80 : 600,
    draggable: true,
    scaleX: 1,
    scaleY: 1,
  })

  const handleWheel = (e: { evt: WheelEvent, target: { getStage: () => KonvaStage } }) => {
    e.evt.preventDefault()

    const scaleBy = 1.1
    const stage = e.target.getStage()
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()

    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    let newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy

    newScale = Math.max(0.1, Math.min(newScale, 10))

    stage.scale({ x: newScale, y: newScale })

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }

    stage.position(newPos)

    stageConfig.scaleX = newScale
    stageConfig.scaleY = newScale

    stage.batchDraw()
  }

  const zoomTo = (scaleMultiplier: number) => {
    if (!stageRef?.value) return

    const stage = stageRef.value.getStage()
    const oldScale = stage.scaleX()
    const newScale = Math.max(0.1, Math.min(oldScale * scaleMultiplier, 10))

    const centerX = stageConfig.width / 2
    const centerY = stageConfig.height / 2

    const mousePointTo = {
      x: (centerX - stage.x()) / oldScale,
      y: (centerY - stage.y()) / oldScale,
    }

    const newPos = {
      x: centerX - mousePointTo.x * newScale,
      y: centerY - mousePointTo.y * newScale,
    }

    stage.scale({ x: newScale, y: newScale })
    stage.position(newPos)
    stageConfig.scaleX = newScale
    stageConfig.scaleY = newScale
    stage.batchDraw()
  }

  const zoomIn = () => zoomTo(1.2)
  const zoomOut = () => zoomTo(1 / 1.2)

  const resetZoom = () => {
    if (!stageRef?.value) {
      console.log('Stage ref not available for reset zoom')
      return
    }

    const stage = stageRef.value.getStage()
    if (!stage) {
      console.log('Stage not available for reset zoom')
      return
    }

    const stageWidth = stage.width() || stageConfig.width
    const stageHeight = stage.height() || stageConfig.height

    const bgConfig = backgroundConfig?.value || {}
    const imageWidth = bgConfig.width || stageWidth
    const imageHeight = bgConfig.height || stageHeight

    console.log('Reset zoom - Stage:', stageWidth, 'x', stageHeight, 'Image:', imageWidth, 'x', imageHeight)

    if (!bgConfig.width || !bgConfig.height) {
      console.log('Background dimensions not available, skipping reset')
      return
    }

    const scaleToFitWidth = stageWidth / imageWidth
    const scaleToFitHeight = stageHeight / imageHeight

    const scale = Math.min(scaleToFitWidth, scaleToFitHeight, 1)
    const scaledImageWidth = imageWidth * scale
    const scaledImageHeight = imageHeight * scale

    const x = Math.max(0, (stageWidth - scaledImageWidth) / 2)
    const y = Math.max(0, (stageHeight - scaledImageHeight) / 2)

    console.log('Applying - Scale:', scale, 'Position:', x, y)

    stage.scale({ x: scale, y: scale })
    stage.position({ x, y })

    stageConfig.scaleX = scale
    stageConfig.scaleY = scale

    stage.batchDraw()
  }

  const handleResize = () => {
    if (typeof window !== 'undefined') {
      stageConfig.width = window.innerWidth
      stageConfig.height = window.innerHeight - 80

      setTimeout(() => {
        resetZoom()
      }, 100)
    }
  }

  return {
    stageConfig,
    handleWheel,
    zoomIn,
    zoomOut,
    resetZoom,
    handleResize,
  }
}
