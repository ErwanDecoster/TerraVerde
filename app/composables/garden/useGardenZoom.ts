import { reactive, type Ref } from "vue";

interface BackgroundConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  [key: string]: unknown;
}

interface KonvaStage {
  scaleX: () => number;
  scaleY: () => number;
  x: () => number;
  y: () => number;
  width: () => number;
  height: () => number;
  scale: (scale: { x: number; y: number }) => void;
  position: (pos: { x: number; y: number }) => void;
  batchDraw: () => void;
  getPointerPosition: () => { x: number; y: number } | null;
}

export const useGardenZoom = (
  stageRef: Ref<{ getStage: () => KonvaStage } | null>,
  backgroundConfig: Ref<BackgroundConfig>,
) => {
  const getBackgroundBounds = (bgConfig: BackgroundConfig) => {
    const width = bgConfig.width || 0;
    const height = bgConfig.height || 0;
    if (!width || !height) return null;

    const centerX = bgConfig.x || width / 2;
    const centerY = bgConfig.y || height / 2;
    const offsetX = bgConfig.offsetX ?? width / 2;
    const offsetY = bgConfig.offsetY ?? height / 2;
    const rotationDeg = bgConfig.rotation || 0;

    const topLeft = { x: centerX - offsetX, y: centerY - offsetY };
    const corners = [
      { x: topLeft.x, y: topLeft.y },
      { x: topLeft.x + width, y: topLeft.y },
      { x: topLeft.x + width, y: topLeft.y + height },
      { x: topLeft.x, y: topLeft.y + height },
    ];

    const rotationRad = (rotationDeg * Math.PI) / 180;
    const cos = Math.cos(rotationRad);
    const sin = Math.sin(rotationRad);

    const rotatedCorners = corners.map((corner) => {
      const dx = corner.x - centerX;
      const dy = corner.y - centerY;
      return {
        x: centerX + dx * cos - dy * sin,
        y: centerY + dx * sin + dy * cos,
      };
    });

    const minX = Math.min(...rotatedCorners.map((p) => p.x));
    const maxX = Math.max(...rotatedCorners.map((p) => p.x));
    const minY = Math.min(...rotatedCorners.map((p) => p.y));
    const maxY = Math.max(...rotatedCorners.map((p) => p.y));

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  const stageConfig = reactive({
    width: globalThis.window === undefined ? 800 : globalThis.window.innerWidth,
    height:
      globalThis.window === undefined
        ? 600
        : globalThis.window.innerHeight - 80,
    draggable: true,
    scaleX: 1,
    scaleY: 1,
  });

  const handleWheel = (e: {
    evt: WheelEvent;
    target: { getStage: () => KonvaStage };
  }) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    newScale = Math.max(0.1, Math.min(newScale, 10));

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.position(newPos);

    stageConfig.scaleX = newScale;
    stageConfig.scaleY = newScale;

    stage.batchDraw();
  };

  const zoomTo = (scaleMultiplier: number) => {
    if (!stageRef?.value) return;

    const stage = stageRef.value.getStage();
    const oldScale = stage.scaleX();
    const newScale = Math.max(0.1, Math.min(oldScale * scaleMultiplier, 10));

    const centerX = stageConfig.width / 2;
    const centerY = stageConfig.height / 2;

    const mousePointTo = {
      x: (centerX - stage.x()) / oldScale,
      y: (centerY - stage.y()) / oldScale,
    };

    const newPos = {
      x: centerX - mousePointTo.x * newScale,
      y: centerY - mousePointTo.y * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
    stageConfig.scaleX = newScale;
    stageConfig.scaleY = newScale;
    stage.batchDraw();
  };

  const zoomIn = () => zoomTo(1.2);
  const zoomOut = () => zoomTo(1 / 1.2);

  const resetZoom = () => {
    if (!stageRef?.value) {
      return;
    }

    const stage = stageRef.value.getStage();
    if (!stage) {
      return;
    }

    const stageWidth = stage.width() || stageConfig.width;
    const stageHeight = stage.height() || stageConfig.height;

    const bgConfig = backgroundConfig?.value;
    if (!bgConfig) {
      return;
    }

    const bounds = getBackgroundBounds(bgConfig);
    if (!bounds?.width || !bounds?.height) return;

    const scaleToFitWidth = stageWidth / bounds.width;
    const scaleToFitHeight = stageHeight / bounds.height;

    const scale = Math.min(scaleToFitWidth, scaleToFitHeight, 1);
    const scaledImageWidth = bounds.width * scale;
    const scaledImageHeight = bounds.height * scale;

    const x = (stageWidth - scaledImageWidth) / 2 - bounds.minX * scale;
    const y = (stageHeight - scaledImageHeight) / 2 - bounds.minY * scale;

    stage.scale({ x: scale, y: scale });
    stage.position({ x, y });

    stageConfig.scaleX = scale;
    stageConfig.scaleY = scale;

    stage.batchDraw();
  };

  const handleResize = () => {
    if (globalThis.window !== undefined) {
      stageConfig.width = globalThis.window.innerWidth;
      stageConfig.height = globalThis.window.innerHeight - 80;

      setTimeout(() => {
        resetZoom();
      }, 100);
    }
  };

  return {
    stageConfig,
    handleWheel,
    zoomIn,
    zoomOut,
    resetZoom,
    handleResize,
  };
};
