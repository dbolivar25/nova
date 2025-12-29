"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
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
import { GripVertical } from "lucide-react";
import { cn } from "@/shared/lib/utils/index";

interface SortableItem {
  id: string;
  label: string;
}

interface SortableListProps {
  items: SortableItem[];
  onChange: (items: SortableItem[]) => void;
  disabled?: boolean;
  className?: string;
}

interface SortableItemComponentProps {
  item: SortableItem;
  disabled?: boolean;
}

function SortableItemComponent({ item, disabled }: SortableItemComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors",
        isDragging && "opacity-50 shadow-lg",
        !disabled && "cursor-grab active:cursor-grabbing"
      )}
    >
      <button
        type="button"
        className={cn(
          "touch-none text-muted-foreground hover:text-foreground transition-colors",
          disabled && "cursor-not-allowed opacity-50"
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
        <span className="sr-only">Drag to reorder</span>
      </button>
      <span className="flex-1 text-sm">{item.label}</span>
    </div>
  );
}

export function SortableList({
  items,
  onChange,
  disabled = false,
  className,
}: SortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        onChange(arrayMove(items, oldIndex, newIndex));
      }
    },
    [items, onChange]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={cn("space-y-2", className)}>
          {items.map((item) => (
            <SortableItemComponent key={item.id} item={item} disabled={disabled} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export type { SortableItem };
