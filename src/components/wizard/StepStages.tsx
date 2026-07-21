"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, X } from "lucide-react";
import { fieldStyle, inputCls, type DraftStage } from "./draft";

function StageRowItem({
  stage,
  index,
  onPatch,
  onRemove,
}: {
  stage: DraftStage;
  index: number;
  onPatch: (patch: Partial<DraftStage>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      className="card flex items-center gap-2 p-2"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
        position: "relative",
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      <button
        type="button"
        aria-label={`Reorder stage ${stage.name || index + 1}`}
        className="shrink-0 cursor-grab touch-none rounded-[6px] p-1 transition-colors hover:bg-[var(--accent-soft)] active:cursor-grabbing"
        style={{ color: "var(--ink-muted)" }}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} strokeWidth={1.5} />
      </button>
      <span className="w-4 shrink-0 text-center font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
        {index + 1}
      </span>
      <input
        value={stage.name}
        onChange={(e) => onPatch({ name: e.target.value })}
        placeholder="Stage name (e.g. Design, Build, Launch)"
        className={`${inputCls} h-8 min-w-0 flex-1`}
        style={fieldStyle}
      />
      <input
        type="date"
        value={stage.targetDate}
        onChange={(e) => onPatch({ targetDate: e.target.value })}
        aria-label="Stage target date"
        className={`${inputCls} h-8 w-[128px] shrink-0 font-mono text-[11px]`}
        style={fieldStyle}
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove stage"
        className="shrink-0 rounded-[6px] p-1 transition-colors hover:bg-[var(--health-red-soft)] hover:text-[var(--health-red-text)]"
        style={{ color: "var(--ink-muted)" }}
      >
        <X size={13} strokeWidth={2} />
      </button>
    </div>
  );
}

export function StepStages({
  stages,
  onChange,
}: {
  stages: DraftStage[];
  onChange: (stages: DraftStage[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = stages.findIndex((s) => s.id === active.id);
    const to = stages.findIndex((s) => s.id === over.id);
    if (from < 0 || to < 0) return;
    onChange(arrayMove(stages, from, to));
  };

  const addStage = () => onChange([...stages, { id: crypto.randomUUID(), name: "", targetDate: "" }]);

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[13px]" style={{ color: "var(--ink-secondary)" }}>
        Write this project&apos;s stages in order. The first becomes{" "}
        <span className="font-mono text-[11.5px]">current</span> on create. Drag to reorder.
      </p>

      {stages.length === 0 ? (
        <div
          className="rounded-[10px] border border-dashed px-4 py-6 text-center text-[13px]"
          style={{ borderColor: "var(--line-strong)", color: "var(--ink-muted)" }}
        >
          No stages yet — the project will be created as <span className="font-mono text-[11.5px]">planned</span>.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {stages.map((s, i) => (
                <StageRowItem
                  key={s.id}
                  stage={s}
                  index={i}
                  onPatch={(patch) => onChange(stages.map((x) => (x.id === s.id ? { ...x, ...patch } : x)))}
                  onRemove={() => onChange(stages.filter((x) => x.id !== s.id))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <button
        type="button"
        onClick={addStage}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] border border-dashed text-[13px] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        style={{ borderColor: "var(--line-strong)", color: "var(--ink-secondary)" }}
      >
        <Plus size={14} strokeWidth={2} /> Add stage
      </button>
    </div>
  );
}
