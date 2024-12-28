'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table as TableIcon, Grid, LayoutGrid } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Group {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  first_photo: {
    id: string;
    filename: string;
    thumb_path: string;
  } | null;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'masonry' | 'masonry-zoomed'>('table');
  const [selectedGroups, setSelectedGroups] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all groups
  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups/get-groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Handle group creation
  const handleCreateGroup = async () => {
    if (!newGroupTitle.trim()) return;

    try {
      const response = await fetch('/api/groups/create-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newGroupTitle,
          description: newGroupDescription || null
        })
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        setNewGroupTitle('');
        setNewGroupDescription('');
        fetchGroups(); // Refresh the groups list
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleDeleteGroups = async (groupIds: number[]) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/groups/delete-group', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupIds
        })
      });

      if (response.ok) {
        setGroups(prevGroups => prevGroups.filter(group => !groupIds.includes(group.id)));
        setSelectedGroups(new Set());
      }
    } catch (error) {
      console.error('Error deleting groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedGroups.size === groups.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(groups.map(group => group.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedGroups(newSelected);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Photo Groups</h1>
          <div className="flex items-center gap-2 border rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="px-2"
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'masonry' ? 'secondary' : 'ghost'}
              size="sm"
              className="px-2"
              onClick={() => setViewMode('masonry')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'masonry-zoomed' ? 'secondary' : 'ghost'}
              size="sm"
              className="px-2"
              onClick={() => setViewMode('masonry-zoomed')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-x-2">
          {selectedGroups.size > 0 && (
            <Button
              onClick={() => handleDeleteGroups(Array.from(selectedGroups))}
              variant="destructive"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : `Delete ${selectedGroups.size} Group${selectedGroups.size > 1 ? 's' : ''}`}
            </Button>
          )}
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Create New Group
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedGroups.size === groups.length && groups.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Preview</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedGroups.has(group.id)}
                    onCheckedChange={() => toggleSelect(group.id)}
                  />
                </TableCell>
                <TableCell>
                  <Link href={`/groups/${group.id}`}>
                    <div className="relative w-16 h-16">
                      {group.first_photo ? (
                        <Image
                          src={group.first_photo.thumb_path}
                          alt={group.first_photo.filename}
                          fill
                          className="object-cover rounded"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-500">
                          No photos
                        </div>
                      )}
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/groups/${group.id}`} className="font-medium hover:underline">
                    {group.title}
                  </Link>
                </TableCell>
                <TableCell>{group.description || '-'}</TableCell>
                <TableCell>{new Date(group.updated_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button
                    onClick={() => handleDeleteGroups([group.id])}
                    variant="destructive"
                    size="sm"
                    disabled={isLoading}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className={`grid gap-4 ${viewMode === 'masonry' ? 'grid-cols-6' : 'grid-cols-3'}`}>
          {groups.map((group) => (
            <div key={group.id} className="group relative aspect-square">
              <Link 
                href={`/groups/${group.id}`}
                className="block relative aspect-square overflow-hidden rounded-lg cursor-pointer"
              >
                {group.first_photo ? (
                  <Image
                    src={group.first_photo.thumb_path}
                    alt={group.first_photo.filename}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes={viewMode === 'masonry' ? '(max-width: 1280px) 16vw, 200px' : '(max-width: 1280px) 33vw, 400px'}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                    No photos
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                    <h2 className="text-white text-lg font-semibold mb-1">{group.title}</h2>
                    {group.description && (
                      <p className="text-white/80 text-sm line-clamp-2">{group.description}</p>
                    )}
                    <p className="text-white/60 text-xs mt-1">
                      Updated {new Date(group.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
              <Checkbox
                checked={selectedGroups.has(group.id)}
                onCheckedChange={() => toggleSelect(group.id)}
                className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          ))}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Title
              </label>
              <Input
                id="title"
                value={newGroupTitle}
                onChange={(e) => setNewGroupTitle(e.target.value)}
                placeholder="Enter group title"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description (optional)
              </label>
              <Textarea
                id="description"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Enter group description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup}>
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 