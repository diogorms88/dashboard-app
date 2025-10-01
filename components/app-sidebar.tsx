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
      // Falha silenciosa - não queremos quebrar a sidebar por isso
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
      role="navigation"
      aria-label="Menu principal de navegação"
      id="navigation"
    >
      <SidebarHeader>
        <div className="flex items-center justify-between px-2 py-1">
          <h1 className="text-lg font-semibold group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden transition-opacity duration-200">
            Plascar
          </h1>
          <div className="group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden transition-opacity duration-200">
            <ModeToggle />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Aplicação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu role="menubar">
              {filteredItems.map((item) => {
                const isActive = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url))
                return (
                <SidebarMenuItem key={item.title} role="none">
                  <SidebarMenuButton asChild isActive={isActive}>
                    <a 
                      href={item.url}
                      role="menuitem"
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={`Navegar para ${item.title}`}
                    >
                      <item.icon aria-hidden="true" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                  {item.badge && (
                    <SidebarMenuBadge aria-label={`${item.badge} notificações`}>{item.badge}</SidebarMenuBadge>
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
              <CollapsibleTrigger 
                aria-expanded="true"
                aria-controls="projects-menu"
                aria-label="Expandir/recolher seção de projetos"
              >
                Projetos
                <ChevronDown className="ml-auto transition-transform group-data-[state=closed]/collapsible:rotate-180" aria-hidden="true" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent id="projects-menu">
              <SidebarGroupContent>
                <SidebarMenu role="menubar">
                  {filteredProjects.map((project) => (
                    <Collapsible key={project.title} className="group/collapsible">
                      <SidebarMenuItem role="none">
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            role="menuitem"
                            aria-expanded="false"
                            aria-controls={`${project.title.toLowerCase()}-submenu`}
                            aria-label={`Expandir/recolher ${project.title}`}
                          >
                            <project.icon aria-hidden="true" />
                            <span>{project.title}</span>
                            <ChevronDown className="ml-auto transition-transform group-data-[state=closed]/collapsible:rotate-180" aria-hidden="true" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent id={`${project.title.toLowerCase()}-submenu`}>
                          <SidebarMenuSub role="menu" aria-label={`Submenu ${project.title}`}>
                            {project.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title} role="none">
                                <SidebarMenuSubButton asChild>
                                  <a 
                                    href={subItem.url}
                                    role="menuitem"
                                    aria-label={`Navegar para ${subItem.title}`}
                                  >
                                    <File aria-hidden="true" />
                                    <span>{subItem.title}</span>
                                    {subItem.title === 'Gerenciar Solicitações' && noActionCount > 0 && (
                                      <SidebarMenuBadge 
                                        className="ml-auto"
                                        aria-label={`${noActionCount} solicitações pendentes`}
                                      >
                                        {noActionCount}
                                      </SidebarMenuBadge>
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
                <SidebarMenuButton
                  aria-label={`Menu do usuário ${user?.nome || 'Usuário'}`}
                  aria-expanded="false"
                  aria-haspopup="menu"
                >
                  <User2 aria-hidden="true" /> {user?.nome || 'Usuário'}
                  <ChevronUp className="ml-auto" aria-hidden="true" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
                role="menu"
                aria-label="Menu do usuário"
              >
                <DropdownMenuItem 
                  onClick={() => {
                    // Implementar logout
                    localStorage.removeItem('token')
                    window.location.href = '/login'
                  }}
                  role="menuitem"
                  aria-label="Sair da aplicação"
                >
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
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