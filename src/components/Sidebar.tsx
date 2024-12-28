'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ImageIcon, ImagePlusIcon, TagsIcon, TrashIcon, FolderIcon, ChevronRightIcon } from 'lucide-react'

interface Group {
  id: string
  title: string
  description: string | null
}

const navigation = [
  {
    name: 'Load & Optimize',
    href: '/',
    icon: ImagePlusIcon,
  },
  {
    name: 'Photos',
    href: '/gallery',
    icon: ImageIcon,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])

  useEffect(() => {
    if (isGroupsExpanded) {
      fetch('/api/groups/get-groups')
        .then(res => res.json())
        .then(data => setGroups(data.groups))
        .catch(error => console.error('Error fetching groups:', error))
    }
  }, [isGroupsExpanded])

  return (
    <div className="flex h-full w-[200px] flex-col bg-zinc-900">
      <div className="flex h-14 items-center border-b border-zinc-700 px-4">
        <span className="text-lg font-bold text-white">Photo Phriend</span>
      </div>
      <nav className="flex flex-col flex-1 px-2 py-4">
        <div className="flex-1 space-y-1">
          {/* Main Navigation */}
          {navigation.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium',
                  isActive
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            )
          })}

          {/* Groups Section */}
          <div>
            <div className="flex">
              <Link
                href="/groups"
                className={cn(
                  'group flex flex-1 items-center gap-2 rounded-l-md px-2 py-2 text-sm font-medium',
                  pathname.startsWith('/groups')
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                )}
              >
                <FolderIcon className="h-5 w-5 shrink-0" />
                <span className="flex-1 text-left">Groups</span>
              </Link>
              <button
                onClick={() => setIsGroupsExpanded(!isGroupsExpanded)}
                className={cn(
                  'rounded-r-md px-2 py-2',
                  pathname.startsWith('/groups')
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                )}
              >
                <ChevronRightIcon 
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform",
                    isGroupsExpanded && "rotate-90"
                  )}
                />
              </button>
            </div>

            {/* Groups List */}
            {isGroupsExpanded && (
              <div className="space-y-1 mt-1 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800">
                <Link
                  href="/groups"
                  className={cn(
                    'group flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium sticky top-0 bg-zinc-900 z-10',
                    pathname === '/groups'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  )}
                >
                  All Groups
                </Link>
                {groups.slice(0, 10).map((group) => (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className={cn(
                      'group flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium',
                      pathname === `/groups/${group.id}`
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    )}
                  >
                    {group.title}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Keywords Section */}
          <Link
            href="/keywords"
            className={cn(
              'group flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium',
              pathname === '/keywords'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            )}
          >
            <TagsIcon className="h-5 w-5 shrink-0" />
            Keywords
          </Link>
        </div>

        {/* Trash at bottom */}
        <div className="pt-4 border-t border-zinc-700">
          <Link
            href="/trash"
            className={cn(
              'group flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium',
              pathname === '/trash'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            )}
          >
            <TrashIcon className="h-5 w-5 shrink-0" />
            Trash
          </Link>
        </div>
      </nav>
    </div>
  )
} 