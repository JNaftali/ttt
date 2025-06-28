import { useState } from "react";
import { Button } from "react-aria-components";
import "./EventList.css";

interface Event {
  name: string;
  req: string[];
  consumes: string[];
  duration: number;
}

interface EventListProps {
  events: Event[];
  onReorder: (reorderedEvents: Event[]) => void;
  onRemoveEvent: (eventName: string) => void;
}

export function EventList({
  events,
  onReorder,
  onRemoveEvent,
}: EventListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", "");
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reorderedEvents = [...events];
    const [draggedEvent] = reorderedEvents.splice(draggedIndex, 1);
    reorderedEvents.splice(dropIndex, 0, draggedEvent);

    onReorder(reorderedEvents);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="event-list">
      <h3>Events ({events.length})</h3>
      {events.length === 0 ? (
        <p className="no-events">No events created yet</p>
      ) : (
        <div className="event-items">
          {events.map((event, index) => (
            <div
              key={`${event.name}-${index}`}
              className={`event-item ${draggedIndex === index ? "dragging" : ""} ${dragOverIndex === index ? "drag-over" : ""}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              role="listitem"
              tabIndex={0}
            >
              <div className="drag-handle" aria-label="Drag to reorder">
                ⋮⋮
              </div>
              <div className="event-item-content">
                <div className="event-name">{event.name}</div>
                <div className="event-details">
                  <span className="event-duration">
                    Duration: {event.duration}s
                  </span>
                  {event.req.length > 0 && (
                    <span className="event-requires">
                      Requires: {event.req.join(", ")}
                    </span>
                  )}
                  {event.consumes.length > 0 && (
                    <span className="event-consumes">
                      Consumes: {event.consumes.join(", ")}
                    </span>
                  )}
                </div>
              </div>
              <Button
                className="remove-event-btn"
                onPress={() => onRemoveEvent(event.name)}
                aria-label={`Remove ${event.name} event`}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
