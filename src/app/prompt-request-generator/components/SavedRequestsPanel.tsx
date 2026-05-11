'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FolderOpen,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Clock,
  Tag,
  ChevronDown,
  BookMarked,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SavedRequest } from './types';

interface SavedRequestsPanelProps {
  loading: boolean;
  savedRequests?: SavedRequest[];
  selectedSavedRequestId?: string | null;
  handleLoadRequest: (id: string) => void;
  handleDeleteRequest: (id: string) => void;
  handleUpdateRequest: (id: string, name: string) => void;
  handleUpdateRequestData?: (id: string) => void;
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export const SavedRequestsPanel: React.FC<SavedRequestsPanelProps> = ({
  loading,
  savedRequests = [],
  selectedSavedRequestId,
  handleLoadRequest,
  handleDeleteRequest,
  handleUpdateRequest,
  handleUpdateRequestData,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch('');
      setEditingId(null);
    }
  }, [open]);

  const filtered = savedRequests.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  const startEditing = (e: React.MouseEvent, req: SavedRequest) => {
    e.stopPropagation();
    setEditingId(req.id);
    setEditName(req.name);
  };

  const commitEdit = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (editingId && editName.trim()) {
      handleUpdateRequest(editingId, editName.trim());
      setEditingId(null);
    }
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const count = savedRequests.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={loading}
              className={cn(
                'h-8 w-8 relative text-muted-foreground hover:text-foreground transition-colors',
                open && 'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
              )}
              aria-label="Open saved requests"
            >
              <FolderOpen className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white leading-none">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          Saved Requests {count > 0 ? `(${count})` : ''}
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        align="end"
        className="w-[340px] p-0 shadow-xl border-border/60"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50 bg-muted/30 rounded-t-md">
          <div className="flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-semibold text-foreground">
              Saved Requests
            </span>
            {count > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
              >
                {count}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground"
            onClick={() => setOpen(false)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Search */}
        {count > 0 && (
          <div className="px-3 py-2 border-b border-border/40">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search saved requests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-input rounded-md pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-purple-500/60 placeholder:text-muted-foreground/60"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* List */}
        <div className="max-h-[320px] overflow-y-auto py-1">
          {count === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <FolderOpen className="h-8 w-8 opacity-30" />
              <p className="text-sm">No saved requests yet</p>
              <p className="text-xs opacity-60">
                Save your prompts to access them here
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-1 text-muted-foreground">
              <Search className="h-5 w-5 opacity-30" />
              <p className="text-sm">No results for &quot;{search}&quot;</p>
            </div>
          ) : (
            filtered.map((req) => {
              const isSelected = req.id === selectedSavedRequestId;
              const isEditing = editingId === req.id;

              return (
                <div
                  key={req.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!isEditing) {
                      handleLoadRequest(req.id);
                      setOpen(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isEditing) {
                      handleLoadRequest(req.id);
                      setOpen(false);
                    }
                  }}
                  className={cn(
                    'group flex flex-col gap-1 px-3 py-2.5 mx-1 rounded-md cursor-pointer transition-all duration-150',
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/30 ring-1 ring-purple-200 dark:ring-purple-800/50'
                      : 'hover:bg-muted/50',
                    isEditing && 'cursor-default',
                  )}
                >
                  {isEditing ? (
                    <div
                      className="flex items-center gap-1.5 w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit(e);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 bg-background border border-input rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="Request name..."
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 flex-shrink-0"
                        onClick={commitEdit}
                        aria-label="Save name"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0"
                        onClick={cancelEdit}
                        aria-label="Cancel edit"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0 mt-0.5" />
                          )}
                          <span
                            className={cn(
                              'text-sm font-medium truncate',
                              isSelected
                                ? 'text-purple-700 dark:text-purple-300'
                                : 'text-foreground',
                            )}
                          >
                            {req.name}
                          </span>
                        </div>
                        {/* Actions — visible on hover or when selected */}
                        <div
                          className={cn(
                            'flex items-center gap-0.5 flex-shrink-0 transition-opacity duration-150',
                            isSelected
                              ? 'opacity-100'
                              : 'opacity-0 group-hover:opacity-100',
                          )}
                        >
                          {/* Update data button — only for selected */}
                          {isSelected && handleUpdateRequestData && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateRequestData(req.id);
                                    setOpen(false);
                                  }}
                                  aria-label="Update with current form data"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                Update with current form
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
                                onClick={(e) => startEditing(e, req)}
                                aria-label={`Rename ${req.name}`}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              Rename
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRequest(req.id);
                                }}
                                aria-label={`Delete ${req.name}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              Delete
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-2 pl-0">
                        {req.data?.category && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Tag className="h-2.5 w-2.5" />
                            <span className="truncate max-w-[120px]">
                              {req.data.category === 'custom'
                                ? req.data.customCategory || 'Custom'
                                : req.data.category}
                            </span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
                          <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                          {formatRelativeTime(req.timestamp)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {count > 0 && (
          <div className="px-3 py-2 border-t border-border/40 bg-muted/20 rounded-b-md">
            <p className="text-[10px] text-muted-foreground text-center">
              {filtered.length} of {count} request{count !== 1 ? 's' : ''}
              {search ? ` matching "${search}"` : ''}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
