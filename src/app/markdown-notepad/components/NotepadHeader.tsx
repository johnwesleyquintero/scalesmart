'use client';

import React from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Badge } from '@/components/ui/badge';

const NotepadHeader: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold mb-2">Markdown Notepad Dashboard</h1>
      <div className="flex justify-center items-center gap-2">
        <p className="text-muted-foreground">
          Manage your notes, categories, and search through your markdown
          content.
        </p>
        <Badge variant={isOnline ? 'default' : 'destructive'}>
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
      </div>
    </div>
  );
};

export default NotepadHeader;
