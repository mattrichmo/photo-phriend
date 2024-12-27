'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ImageIcon, ImagePlusIcon, TagsIcon, TrashIcon } from 'lucide-react'

const navigation = [
  {
    name: 'Optimize',
    href: '/',
    icon: ImagePlusIcon,
  },
  {
    name: 'Photos',
    href: '/gallery',
    icon: ImageIcon,
  },
  {
    name: 'Keywords',
    href: '/keywords',
    icon: TagsIcon,
  },
  {
    name: 'Trash',
    href: '/trash',
    icon: TrashIcon,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-[200px] flex-col bg-zinc-900">
      <div className="flex h-14 items-center border-b border-zinc-700 px-4">
        <span className="text-lg font-bold text-white">Photo Phriend</span>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
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
      </nav>
    </div>
  )
} 