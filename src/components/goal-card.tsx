import {Pencil, Pin, Target, Trash2} from 'lucide-react';
import type {Goal} from '@/lib/finance';
import {goalCovers, type GoalCover} from '@/lib/goal-covers';

export function GoalCoverArt({cover = 'abstract'}: {cover?: GoalCover}) {
  const image = goalCovers[cover].image;
  return (
    <div className="goal-cover-art" aria-hidden="true">
      {image ? <img src={image} alt="" loading="lazy" decoding="async" /> : <Target size={27} strokeWidth={1.2} />}
    </div>
  );
}

export function GoalCard({goal, format, hidden, onEdit, onDelete}: {
  goal: Goal;
  format: (value: number) => string;
  hidden: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const remaining = Math.max(0, goal.target - goal.saved);
  const percentage = Math.min(100, Math.round(goal.saved / goal.target * 100));
  return (
    <article className="goal-visual-card card">
      <GoalCoverArt cover={goal.cover} />
      <div className="goal-card-content">
        <div className="goal-card-heading">
          <h3>{goal.name}</h3>
          {goal.featured && <Pin size={15} aria-label="Em destaque" />}
        </div>
        <p className="goal-card-values"><strong>{format(goal.saved)}</strong><span>de {format(goal.target)}</span></p>
        {!hidden && <progress aria-label={`Progresso de ${goal.name}`} value={Math.min(goal.saved, goal.target)} max={goal.target} />}
        <p className="goal-card-progress">
          <span>{hidden ? 'Valores ocultos' : remaining === 0 ? 'Meta atingida' : `Faltam ${format(remaining)}`}</span>
          {!hidden && <span>{percentage}%</span>}
        </p>
        <div className="goal-card-actions">
          <button className="text-button" onClick={onEdit} aria-label={`Editar meta ${goal.name}`}><Pencil size={14} />Editar meta</button>
          {onDelete && <button className="icon-button" aria-label={`Excluir meta ${goal.name}`} onClick={onDelete}><Trash2 size={16} /></button>}
        </div>
      </div>
    </article>
  );
}

export function GoalCoverPicker({selected = 'abstract'}: {selected?: GoalCover}) {
  return (
    <fieldset className="goal-cover-picker">
      <legend>Capa da meta</legend>
      <div className="goal-cover-options">
        {Object.entries(goalCovers).map(([id, cover]) => (
          <label key={id}>
            <input type="radio" name="cover" value={id} defaultChecked={id === selected} />
            <GoalCoverArt cover={id as GoalCover} />
            <span>{cover.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
