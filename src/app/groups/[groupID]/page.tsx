'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

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

  const handleRemovePhoto = async (photoId: string) => {
    try {
      const response = await fetch('/api/groups/delete-from-group', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          photoIds: [photoId]
        })
      });

      if (response.ok) {
        // Remove photo from local state
        setPhotos(photos.filter(photo => photo.id !== photoId));
      }
    } catch (error) {
      console.error('Error removing photo from group:', error);
    }
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
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{group.title}</h1>
        {group.description && (
          <p className="text-muted-foreground">{group.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group aspect-square">
            <Image
              src={photo.details.optimized.path}
              alt={photo.filename}
              fill
              className="rounded-lg object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemovePhoto(photo.id)}
              >
                Remove from Group
              </Button>
            </div>
          </div>
        ))}
      </div>

      {photos.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          No photos in this group yet.
        </div>
      )}
    </div>
  );
}
