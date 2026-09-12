import { ReactNode } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableItemWrapperProps {
  id: string;
  children: (dragHandle: ReactNode) => ReactNode;
}

/**
 * Wraps a single item, providing drag transform/transition styles and a
 * drag handle. Consumers render their own markup via the children render
 * prop and just place `dragHandle` wherever they want the grip icon.
 */
const SortableItemWrapper = ({ id, children }: SortableItemWrapperProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const dragHandle = (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none p-1 -m-1"
      aria-label="Drag to reorder"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {children(dragHandle)}
    </div>
  );
};

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (newItems: T[]) => void;
  children: (item: T, dragHandle: ReactNode) => ReactNode;
  /** Wraps the whole list \u2014 defaults to a plain fragment-like div */
  as?: "div" | "flex-wrap" | "grid";
  className?: string;
  disabled?: boolean;
}

/**
 * Generic drag-and-drop reorder list built on @dnd-kit. Pass items with a
 * stable `id`, a render function for each item (given a drag handle to
 * place wherever fits the layout), and a callback that receives the full
 * reordered array \u2014 the caller is responsible for persisting sort_order.
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  children,
  as = "div",
  className,
  disabled = false,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (disabled) {
    return (
      <div className={className}>
        {items.map((item) => (
          <div key={item.id}>{children(item, null)}</div>
        ))}
      </div>
    );
  }

  const strategy =
    as === "flex-wrap" || as === "grid" ? rectSortingStrategy : verticalListSortingStrategy;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={strategy}>
        <div className={className}>
          {items.map((item) => (
            <SortableItemWrapper key={item.id} id={item.id}>
              {(dragHandle) => children(item, dragHandle)}
            </SortableItemWrapper>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
