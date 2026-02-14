import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const shortcuts = [
  { category: 'Navigation', items: [
    { keys: ['⌘', 'K'], description: 'Open command palette' },
    { keys: ['G', 'D'], description: 'Go to Dashboard' },
    { keys: ['G', 'A'], description: 'Go to Architectures' },
    { keys: ['G', 'B'], description: 'Go to Agents' },
    { keys: ['G', 'O'], description: 'Go to Observability' },
  ]},
  { category: 'Actions', items: [
    { keys: ['C'], description: 'Create new (context-aware)' },
    { keys: ['E'], description: 'Edit selected item' },
    { keys: ['⌘', 'S'], description: 'Save changes' },
    { keys: ['⌘', 'Enter'], description: 'Submit form' },
    { keys: ['Esc'], description: 'Close dialog/panel' },
  ]},
  { category: 'Search & Filter', items: [
    { keys: ['/'], description: 'Focus search' },
    { keys: ['F'], description: 'Toggle filters' },
    { keys: ['⌘', 'F'], description: 'Find in page' },
  ]},
  { category: 'Interface', items: [
    { keys: ['?'], description: 'Show keyboard shortcuts' },
    { keys: ['['], description: 'Toggle sidebar' },
    { keys: [']'], description: 'Toggle details panel' },
  ]},
];

export default function KeyboardShortcuts({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-600">{item.description}</span>
                    <div className="flex gap-1">
                      {item.keys.map((key, keyIdx) => (
                        <Badge
                          key={keyIdx}
                          variant="outline"
                          className="font-mono text-xs px-2 py-0.5"
                        >
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}