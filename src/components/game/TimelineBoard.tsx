'use client';

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { TimelineCard } from '@/types/game';

function DraggableCard({ disabled }: { disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: 'new-song', disabled });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="newCard"
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.75 : 1,
        touchAction: 'none'
      }}
    >
      <div className="newCardArt">?</div>
      <strong>{disabled ? 'Tiempo terminado' : 'Arrastra o toca una posición'}</strong>
    </div>
  );
}

function slotLabel(cards: TimelineCard[], index: number) {
  if (cards.length === 0) return 'Primera posición';
  if (index === 0) return `Antes de ${cards[0].song.release_year}`;
  if (index === cards.length) {
    return `Después de ${cards[cards.length - 1].song.release_year}`;
  }

  const previous = cards[index - 1].song.release_year;
  const next = cards[index].song.release_year;
  return previous === next ? `Junto a ${previous}` : `Entre ${previous} y ${next}`;
}

function Drop({
  index,
  selected,
  label,
  locked,
  onPlace
}: {
  index: number;
  selected: number | null;
  label: string;
  locked: boolean;
  onPlace: (index: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${index}`,
    disabled: locked
  });
  const active = isOver || selected === index;

  return (
    <button
      type="button"
      ref={setNodeRef}
      className={`dropZone ${active ? 'active' : ''}`}
      aria-label={`Colocar canción: ${label}`}
      title={label}
      disabled={locked}
      onClick={() => onPlace(index)}
    >
      <span>{selected === index ? '✓' : '+'}</span>
      <small>{label}</small>
    </button>
  );
}

export function TimelineBoard({
  cards,
  selected,
  onPlace,
  locked
}: {
  cards: TimelineCard[];
  selected: number | null;
  onPlace: (index: number) => void;
  locked: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 12 }
    })
  );

  function end(event: DragEndEvent) {
    if (!event.over || locked) return;
    const index = Number(String(event.over.id).replace('slot-', ''));
    if (Number.isInteger(index)) onPlace(index);
  }

  const selectedLabel =
    selected === null ? null : slotLabel(cards, selected);

  return (
    <DndContext sensors={sensors} onDragEnd={end}>
      <DraggableCard disabled={locked} />
      <div className="timelineWrap">
        <div className="timeline">
          {cards.map((card, index) => (
            <div className="timelineSegment" key={card.id}>
              {index === 0 && (
                <Drop
                  index={0}
                  selected={selected}
                  label={slotLabel(cards, 0)}
                  locked={locked}
                  onPlace={onPlace}
                />
              )}
              <article className="timelineCard">
                <div className="timelineArt">
                  {card.song.image_url ? (
                    <img src={card.song.image_url} alt="" />
                  ) : (
                    '♪'
                  )}
                </div>
                <b>{card.song.title}</b>
                <small>{card.song.artist}</small>
                <div className="timelineYear">{card.song.release_year}</div>
              </article>
              <Drop
                index={index + 1}
                selected={selected}
                label={slotLabel(cards, index + 1)}
                locked={locked}
                onPlace={onPlace}
              />
            </div>
          ))}
        </div>
      </div>
      {selectedLabel && (
        <div className="lockedAnswer" aria-live="polite">
          ✓ Selección conservada: <strong>{selectedLabel}</strong>. Puedes
          desplazar la pantalla sin perderla.
        </div>
      )}
    </DndContext>
  );
}
