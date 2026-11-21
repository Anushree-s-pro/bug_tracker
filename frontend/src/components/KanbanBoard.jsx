import { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { STATUSES } from '../api.js';
import { Avatar, PriorityBadge, TypeBadge } from './Badges.jsx';

const ACCENT = { TODO: 'border-t-slate-400', IN_PROGRESS: 'border-t-blue-500', DONE: 'border-t-emerald-500' };

function Card({ issue, onOpen, overlay = false }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: issue.id, data: { issue } });
  const drag = overlay ? {} : { ...listeners, ...attributes };
  return (
    <div ref={overlay ? undefined : setNodeRef} {...drag}
         onClick={() => !overlay && onOpen(issue)}
         className={`group cursor-grab rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-indigo-300 hover:shadow-md active:cursor-grabbing ${
           isDragging ? 'opacity-30' : ''} ${overlay ? 'rotate-2 shadow-2xl ring-2 ring-indigo-400' : ''}`}>
      <div className="mb-2.5 text-sm font-medium leading-snug text-slate-900">{issue.title}</div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <TypeBadge type={issue.type} />
        <PriorityBadge priority={issue.priority} />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-slate-400">{issue.issueKey}</span>
        <Avatar user={issue.assignee} />
      </div>
    </div>
  );
}

function Column({ status, issues, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.key });
  return (
    <div ref={setNodeRef}
         className={`flex min-h-[360px] flex-col rounded-xl border border-t-4 border-slate-200 p-3 transition ${ACCENT[status.key]} ${
           isOver ? 'bg-indigo-50/80 ring-2 ring-indigo-300' : 'bg-slate-100/70'}`}>
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{status.label}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 shadow-sm">{issues.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5">
        {issues.map((i) => <Card key={i.id} issue={i} onOpen={onOpen} />)}
        {issues.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 py-10 text-xs text-slate-400">
            Drop issues here
          </div>
        )}
      </div>
    </div>
  );
}

/** Drag & drop Kanban built with @dnd-kit. onMove(issue, newStatus) persists the change. */
export default function KanbanBoard({ issues, onOpen, onMove }) {
  const [active, setActive] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleEnd = ({ active: a, over }) => {
    setActive(null);
    if (!over) return;
    const issue = issues.find((i) => i.id === a.id);
    if (issue && issue.status !== over.id) onMove(issue, over.id);
  };

  return (
    <DndContext sensors={sensors}
                onDragStart={({ active: a }) => setActive(issues.find((i) => i.id === a.id))}
                onDragEnd={handleEnd} onDragCancel={() => setActive(null)}>
      <div className="grid gap-4 md:grid-cols-3">
        {STATUSES.map((s) => (
          <Column key={s.key} status={s} issues={issues.filter((i) => i.status === s.key)} onOpen={onOpen} />
        ))}
      </div>
      <DragOverlay>{active ? <Card issue={active} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}
