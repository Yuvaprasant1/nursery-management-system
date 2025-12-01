'use client'

import { useState, ReactNode, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useNursery } from '@/contexts/NurseryContext'
import { ROUTES } from '@/constants'
import { Tooltip } from '@/components/Tooltip'
import { 
  LayoutDashboard, 
  Package, 
  Sprout, 
  Leaf, 
  Receipt, 
  Settings, 
  Building2, 
  Palette,
  ChevronRight,
  ChevronLeft,
  X,
  Menu,
  LogOut
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

interface MenuItem {
  path: string
  label: string
  icon: LucideIcon
  children?: MenuItem[]
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { nursery } = useNursery()

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState))
    }
  }, [])

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  // Auto-expand admin menu if on admin route
  useEffect(() => {
    if (pathname.startsWith('/admin')) {
      setExpandedMenus(prev => new Set(prev).add('/admin'))
    }
  }, [pathname])

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const toggleMenu = (path: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }
  
  const menuItems: MenuItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/saplings', label: 'Sapling', icon: Sprout },
    { path: '/breeds', label: 'Breeds', icon: Leaf },
    { path: '/transactions', label: 'Transactions', icon: Receipt },
    {
      path: '/admin',
      label: 'Admin',
      icon: Settings,
      children: [
        { path: ROUTES.ADMIN_NURSERY, label: 'Nursery', icon: Building2 },
        { path: ROUTES.ADMIN_THEME, label: 'Theme Settings', icon: Palette },
      ],
    },
  ]
  
  const handleLogout = async () => {
    logout()
    router.push('/login')
  }
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  const getPageTitle = () => {
    // Check for exact match first
    const exactMatch = menuItems.find(item => item.path === pathname)
    if (exactMatch) return exactMatch.label

    // Check child items
    for (const item of menuItems) {
      if (item.children) {
        const childMatch = item.children.find(child => child.path === pathname)
        if (childMatch) return childMatch.label
      }
    }

    // Check if it's an admin route
    if (pathname.startsWith('/admin')) {
      if (pathname === ROUTES.ADMIN_NURSERY) return 'Nursery'
      if (pathname === ROUTES.ADMIN_THEME) return 'Theme Settings'
      return 'Admin'
    }

    return 'Dashboard'
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white shadow-2xl transform transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
        aria-hidden={!sidebarOpen}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary to-secondary">
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white truncate">
                  {nursery?.name || 'Nursery App'}
                </h1>
                {nursery?.location && (
                  <p className="text-xs text-white/80 truncate mt-0.5">{nursery.location}</p>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Tooltip content={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} position="bottom">
                <button
                  onClick={toggleSidebar}
                  className="hidden lg:flex text-white hover:text-white/80 p-1 rounded transition-colors"
                  aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </Tooltip>
              <Tooltip content="Close sidebar" position="bottom">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden text-white hover:text-white/80 ml-2"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </Tooltip>
            </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const hasChildren = item.children && item.children.length > 0
                const isExpanded = expandedMenus.has(item.path)
                const itemIsActive = isActive(item.path)
                const ItemIcon = item.icon

                return (
                  <li key={item.path}>
                    {hasChildren ? (
                      <>
                        <button
                          onClick={() => {
                            if (!sidebarCollapsed) {
                              toggleMenu(item.path)
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                            sidebarCollapsed ? 'justify-center' : ''
                          } ${
                            itemIsActive
                              ? 'bg-primary text-white shadow-md'
                              : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                          }`}
                        >
                          <ItemIcon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                          {!sidebarCollapsed && (
                            <>
                              <span className="font-medium truncate flex-1 text-left">{item.label}</span>
                              <ChevronRight
                                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                aria-hidden="true"
                              />
                            </>
                          )}
                        </button>
                        {!sidebarCollapsed && isExpanded && item.children && (
                          <ul className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                            {item.children.map((child) => {
                              const ChildIcon = child.icon
                              return (
                                <li key={child.path}>
                                  <Link
                                    href={child.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                                      isActive(child.path)
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                                    }`}
                                  >
                                    <ChildIcon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                                    <span className="font-medium truncate">{child.label}</span>
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                          sidebarCollapsed ? 'justify-center' : ''
                        } ${
                          itemIsActive
                            ? 'bg-primary text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                        }`}
                      >
                        <ItemIcon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                        {!sidebarCollapsed && <span className="font-medium truncate">{item.label}</span>}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
          
          <div className="p-4 border-t">
            {!sidebarCollapsed && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                    {user?.phone?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.phone || 'User'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  aria-label="Logout"
                >
                  Logout
                </button>
              </>
            )}
            {sidebarCollapsed && (
              <div className="flex flex-col items-center gap-2">
                <Tooltip content={user?.phone || 'User'} position="right">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                    {user?.phone?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </Tooltip>
                <Tooltip content="Logout" position="right">
                  <button
                    onClick={handleLogout}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    aria-label="Logout"
                  >
                    <LogOut className="w-5 h-5" aria-hidden="true" />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className={`transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      }`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Tooltip content="Open sidebar" position="bottom">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                  aria-label="Open sidebar"
                  aria-expanded={sidebarOpen}
                >
                  <Menu className="w-6 h-6" aria-hidden="true" />
                </button>
              </Tooltip>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  {getPageTitle()}
                </h2>
                {nursery?.name && (
                  <p className="text-xs text-gray-500 truncate">{nursery.name}</p>
                )}
              </div>
            </div>
            {nursery?.name && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                <span className="text-sm font-medium text-primary">{nursery.name}</span>
              </div>
            )}
          </div>
        </header>
        
        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

