"use client"

import { 
  Calendar, 
  Home, 
  Inbox, 
  Package, 
  Settings, 
  ChevronDown,
  ChevronUp,
  Plus,
  MoreHorizontal,
  User2,
  Folder,
  File,
  LogOut
} from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useState, useEffect } from "react"
import { apiRequest } from "@/lib/api"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/components/ui/sidebar"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Registros de Produção",
    url: "/dashboard/production",
    icon: Calendar,
  },
  {
    title: "Consumo de Materiais",
    url: "/dashboard/materials",
    icon: Inbox,
  },
  {
    title: "Solicitações",
    url: "/dashboard/requests",
    icon: Package,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

// Projects with submenu
const projects = [
  {
    title: "Engenharia",
    url: "#",
    icon: Folder,
    items: [
      { title: "Consumo por peça", url: "/dashboard/engineering/consumption" },
      { title: "Formulários 8D", url: "/dashboard/engineering/8d-forms" },
      { title: "Análise de Problemas", url: "#" },
      { title: "Qualidade", url: "#" },
    ],
  },
  {
    title: "Administração",
    url: "#",
    icon: Folder,
    items: [
      { title: "Gerenciar Solicitações", url: "/dashboard/admin/requests" },
      { title: "Sistema de Planejamento", url: "/dashboard/admin/planning" },
      { title: "Usuários", url: "#" },
      { title: "Relatórios", url: "#" },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { setOpen } = useSidebar()
  const [noActionCount, setNoActionCount] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Função para verificar se o usuário tem permissão para ver um item
  const hasPermission = (requiredRoles: string[]) => {
    if (!user) return false
    return requiredRoles.includes(user.papel)
  }

  // Buscar contagem de solicitações sem ação
  const fetchNoActionCount = async () => {
    try {
      const data = await apiRequest('/item-requests')
      const noActionRequests = data.filter((request: Record<string, unknown>) => !request.assigned_to)
      setNoActionCount(noActionRequests.length)
    } catch (error) {
      console.error('Erro ao buscar contagem de solicitações sem ação:', error)
    }
  }

  useEffect(() => {
    if (user && (user.papel === 'admin' || user.papel === 'manager')) {
      fetchNoActionCount()
      // Atualizar a cada 30 segundos
      const interval = setInterval(fetchNoActionCount, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  // Filtrar itens do menu baseado no papel do usuário
  const filteredItems = items.filter(item => {
    switch (item.title) {
      case 'Dashboard':
        return hasPermission(['admin', 'manager', 'operator', 'viewer'])
      case 'Registros de Produção':
        return hasPermission(['admin', 'manager', 'operator'])
      case 'Consumo de Materiais':
        return hasPermission(['admin', 'manager', 'operator', 'viewer'])
      case 'Solicitações':
        return hasPermission(['admin', 'manager', 'operator'])
      case 'Settings':
        return hasPermission(['admin', 'manager'])
      default:
        return hasPermission(['admin', 'manager'])
    }
  })

  // Filtrar projetos baseado no papel do usuário
  const filteredProjects = projects.filter(project => {
    return hasPermission(['admin', 'manager'])
  })

  // Handlers para hover
  const handleMouseEnter = () => {
    setIsHovered(true)
    setOpen(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setOpen(false)
  }
  
  return (
    <Sidebar 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      collapsible="icon"
    >
      <SidebarHeader>
        <div className="flex items-center justify-between px-2 py-1">
          <h2 className="text-lg font-semibold group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden transition-opacity duration-200">
            Plascar
          </h2>
          <div className="group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden transition-opacity duration-200">
            <ModeToggle />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url))
                return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                  {item.badge && (
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarSeparator />
        
        {/* Projects with Collapsible Groups and Submenus */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                Projects
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredProjects.map((project) => (
                    <Collapsible key={project.title} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
                            <project.icon />
                            <span>{project.title}</span>
                            <ChevronDown className="ml-auto transition-transform group-data-[state=closed]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {project.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <a href={subItem.url}>
                                    <File />
                                    <span>{subItem.title}</span>
                                    {subItem.title === 'Gerenciar Solicitações' && noActionCount > 0 && (
                                      <SidebarMenuBadge className="ml-auto">{noActionCount}</SidebarMenuBadge>
                                    )}
                                  </a>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
      
      {/* Footer with DropdownMenu */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> {user?.nome || 'Usuário'}
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem onClick={() => {
                  // Implementar logout
                  localStorage.removeItem('token')
                  window.location.href = '/login'
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}