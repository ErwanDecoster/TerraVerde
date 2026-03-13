export const useBulkPlantSelection = (
  onSelectionCompleted: (selectedIds: string[]) => void,
) => {
  const isSelectionKeyPressed = ref(false);
  const selectedPlantIds = ref<string[]>([]);

  const isSelected = (plantId: string) => {
    return selectedPlantIds.value.includes(plantId);
  };

  const clearSelection = () => {
    selectedPlantIds.value = [];
  };

  const toggleSelection = (plantId: string) => {
    if (isSelected(plantId)) {
      selectedPlantIds.value = selectedPlantIds.value.filter(
        (id) => id !== plantId,
      );
      return;
    }

    selectedPlantIds.value = [...selectedPlantIds.value, plantId];
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Shift") return;
    isSelectionKeyPressed.value = true;
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.key !== "Shift") return;
    isSelectionKeyPressed.value = false;

    if (selectedPlantIds.value.length > 1) {
      onSelectionCompleted(selectedPlantIds.value);
    }
  };

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    clearSelection();
  };

  const mount = () => {
    globalThis.window.addEventListener("keydown", handleKeyDown);
    globalThis.window.addEventListener("keyup", handleKeyUp);
    globalThis.window.addEventListener("keydown", handleEscape);
  };

  const unmount = () => {
    globalThis.window.removeEventListener("keydown", handleKeyDown);
    globalThis.window.removeEventListener("keyup", handleKeyUp);
    globalThis.window.removeEventListener("keydown", handleEscape);
  };

  return {
    isSelectionKeyPressed,
    selectedPlantIds,
    isSelected,
    toggleSelection,
    clearSelection,
    mount,
    unmount,
  };
};
