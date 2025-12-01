'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { ROUTES } from '@/constants'
import { useNursery } from '@/contexts/NurseryContext'
import { Building2, Palette, ChevronRight } from 'lucide-react'
import { Tooltip } from '@/components/Tooltip'

export default function AdminScreen() {
  const router = useRouter()
  const { nursery } = useNursery()

  const adminOptions = [
    {
      title: 'Nursery',
      description: 'Update nursery details including name, location, and phone',
      icon: Building2,
      path: ROUTES.ADMIN_NURSERY,
      color: 'from-blue-50 via-blue-100 to-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Theme Settings',
      description: 'Customize colors, fonts, and appearance settings',
      icon: Palette,
      path: ROUTES.ADMIN_THEME,
      color: 'from-purple-50 via-purple-100 to-purple-50',
      borderColor: 'border-purple-200',
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin</h1>
        <p className="text-gray-600 mt-1">Manage your nursery settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminOptions.map((option) => {
          const IconComponent = option.icon
          return (
            <div
              key={option.path}
              className={`card-hover bg-gradient-to-br ${option.color} ${option.borderColor} shadow-lg cursor-pointer rounded-lg p-6`}
              onClick={() => router.push(option.path)}
            >
              <div className="flex items-start gap-4">
                <Tooltip content={option.title} position="top">
                  <div className="flex-shrink-0 p-3 bg-white/50 rounded-lg">
                    <IconComponent className="w-8 h-8 text-gray-700" />
                  </div>
                </Tooltip>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{option.title}</h3>
                  <p className="text-gray-600 text-sm">{option.description}</p>
                  <div className="mt-4 flex items-center text-primary font-medium text-sm">
                    <span>Go to {option.title}</span>
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {nursery && (
        <Card className="bg-gray-50 border-gray-200">
          <div className="flex items-center gap-3">
            <Tooltip content="Nursery" position="top">
              <div className="p-2 bg-white rounded-lg">
                <Building2 className="w-6 h-6 text-gray-700" />
              </div>
            </Tooltip>
            <div>
              <h3 className="font-semibold text-gray-900">{nursery.name}</h3>
              {nursery.location && (
                <p className="text-sm text-gray-600 mt-1">{nursery.location}</p>
              )}
              {nursery.phone && (
                <p className="text-sm text-gray-600">{nursery.phone}</p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

