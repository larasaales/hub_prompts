import React from 'react';

interface PromptEditorProps {
  content: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

export default function PromptEditor({ content, onChange, readOnly }: PromptEditorProps) {
  return (
    <textarea
      value={content}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={readOnly}
      placeholder="Escreva seu prompt aqui..."
      className={`w-full min-h-[160px] p-4 rounded-xl backdrop-blur-md bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 resize-y shadow-inner ${readOnly ? 'cursor-default focus:border-white/10' : ''}`}
    />
  );
}
