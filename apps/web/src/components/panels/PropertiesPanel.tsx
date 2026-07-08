import React, { useState } from 'react';
import { Settings2, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { WorkspaceType } from '../workspace/Workspace';

interface PropertiesPanelProps {
  workspaceType: WorkspaceType;
}

export function PropertiesPanel({ workspaceType }: PropertiesPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['transform', 'appearance']));

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 text-center text-xs text-white/40">
        Select an element to view its properties
      </div>

      <Section
        id="transform"
        title="Transform"
        expanded={expandedSections.has('transform')}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          <PropertyGroup label="Position">
            <InputRow>
              <NumberInput
                label="X"
                value={0}
                unit="px"
              />
              <NumberInput
                label="Y"
                value={0}
                unit="px"
              />
            </InputRow>
          </PropertyGroup>

          <PropertyGroup label="Scale">
            <InputRow>
              <NumberInput
                label="X"
                value={100}
                unit="%"
              />
              <NumberInput
                label="Y"
                value={100}
                unit="%"
              />
            </InputRow>
          </PropertyGroup>

          <PropertyGroup label="Rotation">
            <NumberInput
              label=""
              value={0}
              unit="deg"
              min={-360}
              max={360}
            />
          </PropertyGroup>

          <PropertyGroup label="Opacity">
            <Slider value={100} min={0} max={100} step={1} />
          </PropertyGroup>
        </div>
      </Section>

      <Section
        id="appearance"
        title="Appearance"
        expanded={expandedSections.has('appearance')}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          <PropertyGroup label="Blend Mode">
            <Select
              value="normal"
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'multiply', label: 'Multiply' },
                { value: 'screen', label: 'Screen' },
                { value: 'overlay', label: 'Overlay' },
                { value: 'soft-light', label: 'Soft Light' },
              ]}
            />
          </PropertyGroup>
        </div>
      </Section>

      {workspaceType === 'video' && (
        <Section
          id="timing"
          title="Timing"
          expanded={expandedSections.has('timing')}
          onToggle={toggleSection}
        >
          <div className="space-y-3">
            <PropertyGroup label="Speed">
              <Slider value={100} min={10} max={400} step={5} />
            </PropertyGroup>

            <PropertyGroup label="Duration">
              <InputRow>
                <NumberInput
                  label="Start"
                  value={0}
                  unit="s"
                />
                <NumberInput
                  label="End"
                  value={5}
                  unit="s"
                />
              </InputRow>
            </PropertyGroup>
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  id,
  title,
  expanded,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  expanded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-white/60" />
        ) : (
          <ChevronRight className="w-4 h-4 text-white/60" />
        )}
        <span className="text-xs font-medium text-white/80 uppercase tracking-wide">{title}</span>
      </button>
      {expanded && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function PropertyGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-white/60">{label}</label>
      </div>
      {children}
    </div>
  );
}

function InputRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

function NumberInput({
  label,
  value,
  unit,
  min,
  max,
}: {
  label?: string;
  value: number;
  unit: string;
  min?: number;
  max?: number;
}) {
  const [currentValue, setCurrentValue] = useState(value);

  return (
    <div className="flex items-center gap-1">
      {label && <span className="text-[10px] text-white/40 w-4">{label}</span>}
      <input
        type="number"
        value={currentValue}
        onChange={(e) => setCurrentValue(Number(e.target.value))}
        min={min}
        max={max}
        className="flex-1 min-w-0 bg-surface-elevated border border-border rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      <span className="text-[10px] text-white/40 w-6 text-right">{unit}</span>
    </div>
  );
}

function Slider({
  value,
  min,
  max,
  step,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
}) {
  const [currentValue, setCurrentValue] = useState(value);

  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        value={currentValue}
        onChange={(e) => setCurrentValue(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="flex-1 h-1.5 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-primary-500"
      />
      <input
        type="number"
        value={currentValue}
        onChange={(e) => setCurrentValue(Number(e.target.value))}
        min={min}
        max={max}
        className="w-14 bg-surface-elevated border border-border rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
    </div>
  );
}

function Select({
  value,
  options,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
}) {
  const [currentValue, setCurrentValue] = useState(value);

  return (
    <select
      value={currentValue}
      onChange={(e) => setCurrentValue(e.target.value)}
      className="w-full bg-surface-elevated border border-border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
