'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Group {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Photo Groups</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          Create New Group
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <Link 
            key={group.id} 
            href={`/groups/${group.id}`}
            className="block p-4 border rounded-lg hover:border-primary transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">{group.title}</h2>
            {group.description && (
              <p className="text-muted-foreground mb-2">{group.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Updated {new Date(group.updated_at).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>

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