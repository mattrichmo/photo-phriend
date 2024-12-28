'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { X, Table as TableIcon, Grid, LayoutGrid } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PhotoDetails {
  thumb: {
    path: string;
    width: number;
    height: number;
  } | null;
  optimized: {
    path: string;
    width: number;
    height: number;
  };
}

interface Photo {
  id: string;
  filename: string;
  details: PhotoDetails;
}

interface Group {
  id: number;
  title: string;
  description: string | null;
}

export default function GroupPage() {
  const params = useParams();
  const groupId = params.groupID;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'masonry' | 'masonry-zoomed'>('table');
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);

  // Fetch group details and photos
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/groups/${groupId}`);
        if (!response.ok) {
          console.error('Failed to fetch group data:', await response.text());
          return;
        }
        const data = await response.json();
        setGroup(data.group);
        setPhotos(data.photos);
      } catch (error) {
        console.error('Error fetching group data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId) {
      fetchGroupData();
    }
  }, [groupId]);

  const handleRemovePhotos = async (photoIds: string[]) => {
    try {
      const response = await fetch('/api/groups/delete-from-group', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          photoIds
        })
      });

      if (response.ok) {
        // Remove photos from local state
        setPhotos(photos.filter(photo => !photoIds.includes(photo.id)));
        setSelectedPhotos(new Set());
      }
    } catch (error) {
      console.error('Error removing photos from group:', error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map(photo => photo.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPhotos(newSelected);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-muted-foreground">Group not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Image Overlay */}
      {viewingPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full m-4">
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20"
              onClick={() => setViewingPhoto(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="relative w-full h-full">
              <Image
                src={viewingPhoto.details.optimized.path}
                alt={viewingPhoto.filename}
                fill
                className="object-contain"
                sizes="(max-width: 1280px) 100vw, 1280px"
                priority
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{group.title}</h1>
            {group.description && (
              <p className="text-muted-foreground">{group.description}</p>
            )}
          </div>
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
          {selectedPhotos.size > 0 && (
            <Button
              onClick={() => handleRemovePhotos(Array.from(selectedPhotos))}
              variant="destructive"
              size="sm"
            >
              Remove {selectedPhotos.size} from Group
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'table' ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedPhotos.size === photos.length && photos.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Preview</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {photos.map((photo) => (
              <TableRow key={photo.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedPhotos.has(photo.id)}
                    onCheckedChange={() => toggleSelect(photo.id)}
                  />
                </TableCell>
                <TableCell>
                  <div 
                    className="relative w-16 h-16 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setViewingPhoto(photo)}
                  >
                    {photo.details.thumb?.path ? (
                      <Image 
                        src={photo.details.thumb.path}
                        alt={photo.filename}
                        fill
                        className="object-contain rounded"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-500">
                        No preview
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{photo.filename}</TableCell>
                <TableCell className="text-right">
                  <Button
                    onClick={() => handleRemovePhotos([photo.id])}
                    variant="destructive"
                    size="sm"
                  >
                    Remove from Group
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className={`grid gap-4 ${viewMode === 'masonry' ? 'grid-cols-6' : 'grid-cols-3'}`}>
          {photos.map((photo) => (
            <div 
              key={photo.id} 
              className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer"
              onClick={() => setViewingPhoto(photo)}
            >
              <Image
                src={photo.details.optimized.path}
                alt={photo.filename}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes={viewMode === 'masonry' ? '(max-width: 1280px) 16vw, 200px' : '(max-width: 1280px) 33vw, 400px'}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm truncate">{photo.filename}</p>
                </div>
              </div>
              <Checkbox
                checked={selectedPhotos.has(photo.id)}
                onCheckedChange={() => toggleSelect(photo.id)}
                className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          No photos in this group yet.
        </div>
      )}
    </div>
  );
}
