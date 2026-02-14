import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DetailsPanel({ open, onClose, title, tabs, children }) {
  if (!open) return null;

  return (
    <div className="w-96 border-l border-slate-200 bg-white flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {tabs ? (
        <Tabs defaultValue={tabs[0]?.id} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start rounded-none border-b px-4">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent
              key={tab.id}
              value={tab.id}
              className="flex-1 overflow-y-auto m-0 p-4"
            >
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      )}
    </div>
  );
}