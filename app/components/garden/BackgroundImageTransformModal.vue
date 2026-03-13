<script setup lang="ts">
interface Props {
  open: boolean;
  pixelsPerMeters: number;
  defaultZoom?: number | null;
  defaultCenterX?: number | null;
  defaultCenterY?: number | null;
  rotation: number;
  offsetX: number;
  offsetY: number;
  livePreview?: boolean;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (
    e: "update:defaultZoom" | "update:defaultCenterX" | "update:defaultCenterY",
    value: number | null,
  ): void;
  (
    e:
      | "update:pixelsPerMeters"
      | "update:rotation"
      | "update:offsetX"
      | "update:offsetY",
    value: number,
  ): void;
}

type NullableNumericInput = number | string | null | undefined;

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const openModel = computed({
  get: () => props.open,
  set: (value: boolean) => emit("update:open", value),
});

const pixelsPerMetersModel = computed({
  get: () => props.pixelsPerMeters,
  set: (value: number) => emit("update:pixelsPerMeters", Number(value)),
});

const defaultZoomModel = computed({
  get: () => props.defaultZoom ?? null,
  set: (value: NullableNumericInput) => {
    if (value === "" || value === null || value === undefined) {
      emit("update:defaultZoom", null);
      return;
    }

    const parsed = Number(value);
    emit(
      "update:defaultZoom",
      Number.isFinite(parsed) ? Math.trunc(parsed) : null,
    );
  },
});

const defaultCenterXModel = computed({
  get: () => props.defaultCenterX ?? null,
  set: (value: NullableNumericInput) => {
    if (value === "" || value === null || value === undefined) {
      emit("update:defaultCenterX", null);
      return;
    }

    const parsed = Number(value);
    emit(
      "update:defaultCenterX",
      Number.isFinite(parsed) ? Math.trunc(parsed) : null,
    );
  },
});

const defaultCenterYModel = computed({
  get: () => props.defaultCenterY ?? null,
  set: (value: NullableNumericInput) => {
    if (value === "" || value === null || value === undefined) {
      emit("update:defaultCenterY", null);
      return;
    }

    const parsed = Number(value);
    emit(
      "update:defaultCenterY",
      Number.isFinite(parsed) ? Math.trunc(parsed) : null,
    );
  },
});

const rotationModel = computed({
  get: () => props.rotation,
  set: (value: number) => emit("update:rotation", Number(value)),
});

const offsetXModel = computed({
  get: () => props.offsetX,
  set: (value: number) => emit("update:offsetX", Number(value)),
});

const offsetYModel = computed({
  get: () => props.offsetY,
  set: (value: number) => emit("update:offsetY", Number(value)),
});

const panelPosition = reactive({ x: 0, y: 0 });
const dragStart = reactive({ x: 0, y: 0 });
const isDragging = ref(false);

const onDragMove = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return;

  if ("touches" in event) {
    const touch = event.touches[0];
    if (!touch) return;
    panelPosition.x = touch.clientX - dragStart.x;
    panelPosition.y = touch.clientY - dragStart.y;
    return;
  }

  panelPosition.x = event.clientX - dragStart.x;
  panelPosition.y = event.clientY - dragStart.y;
};

const stopDrag = () => {
  if (!isDragging.value) return;
  isDragging.value = false;
  globalThis.window.removeEventListener("mousemove", onDragMove);
  globalThis.window.removeEventListener("mouseup", stopDrag);
  globalThis.window.removeEventListener("touchmove", onDragMove);
  globalThis.window.removeEventListener("touchend", stopDrag);
};

const startDrag = (event: MouseEvent | TouchEvent) => {
  isDragging.value = true;

  if ("touches" in event) {
    const touch = event.touches[0];
    if (!touch) return;
    dragStart.x = touch.clientX - panelPosition.x;
    dragStart.y = touch.clientY - panelPosition.y;
    globalThis.window.addEventListener("touchmove", onDragMove, {
      passive: true,
    });
    globalThis.window.addEventListener("touchend", stopDrag);
    return;
  }

  dragStart.x = event.clientX - panelPosition.x;
  dragStart.y = event.clientY - panelPosition.y;
  globalThis.window.addEventListener("mousemove", onDragMove);
  globalThis.window.addEventListener("mouseup", stopDrag);
};

onBeforeUnmount(() => {
  stopDrag();
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="openModel"
      class="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      <button
        type="button"
        class="absolute inset-0 bg-transparent"
        aria-label="Close"
        @click="openModel = false"
      />

      <div
        class="border-default bg-default relative w-full max-w-md rounded-xl border shadow-2xl"
        :style="{
          transform: `translate(${panelPosition.x}px, ${panelPosition.y}px)`,
        }"
      >
        <div
          class="border-default flex cursor-move items-center justify-between border-b px-4 py-3 select-none"
          @mousedown="startDrag"
          @touchstart="startDrag"
        >
          <div>
            <h3 class="text-sm font-semibold">Map Transform Settings</h3>
            <p class="text-muted text-xs">
              Adjust map position, rotation and scale.
            </p>
          </div>
          <UButton
            variant="ghost"
            size="sm"
            icon="i-heroicons-x-mark-20-solid"
            @click="openModel = false"
          />
        </div>

        <div class="grid grid-cols-2 gap-4 p-4">
          <UFormField
            label="Scale (Pixels per Meters)"
            description="Plant marker size updates with this value"
            class="col-span-2"
            required
          >
            <UInput
              v-model.number="pixelsPerMetersModel"
              type="number"
              min="1"
              max="100"
              step="1"
              placeholder="20"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Default Center Zoom (%)"
            description="Optional. Used by the center/reset button"
            class="col-span-2"
          >
            <UInput
              v-model="defaultZoomModel"
              type="number"
              min="10"
              max="1000"
              step="1"
              placeholder="Auto fit (empty)"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Default Center X Offset"
            description="0 keeps horizontal center; positive moves right"
            class="col-span-1"
          >
            <UInput
              v-model="defaultCenterXModel"
              type="number"
              step="1"
              placeholder="0"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Default Center Y Offset"
            description="0 keeps vertical center; positive moves down"
            class="col-span-1"
          >
            <UInput
              v-model="defaultCenterYModel"
              type="number"
              step="1"
              placeholder="0"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Rotation (Degrees)"
            description="Rotate the map around its center"
            class="col-span-2"
            required
          >
            <UInput
              v-model.number="rotationModel"
              type="number"
              min="0"
              max="360"
              step="1"
              placeholder="0"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Offset X (Pixels)"
            description="Move map left/right"
            class="col-span-1"
            required
          >
            <UInput
              v-model.number="offsetXModel"
              type="number"
              min="-5000"
              max="5000"
              step="1"
              placeholder="0"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Offset Y (Pixels)"
            description="Move map up/down"
            class="col-span-1"
            required
          >
            <UInput
              v-model.number="offsetYModel"
              type="number"
              min="-5000"
              max="5000"
              step="1"
              placeholder="0"
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="livePreview"
            icon="i-heroicons-eye-20-solid"
            color="info"
            variant="subtle"
            title="Live preview enabled"
            description="Changes are applied on the map before save."
            class="col-span-2"
          />
        </div>

        <div class="border-default flex justify-end border-t px-4 py-3">
          <UButton variant="ghost" @click="openModel = false"> Close </UButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
