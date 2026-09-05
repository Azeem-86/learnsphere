import { useApp } from "@/lib/app-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Building2,
  GraduationCap,
  Award,
  FileText,
  Trophy,
  Settings,
  LogOut,
  Bell,
  Menu,
  ChevronDown,
  BarChart3,
  PenTool,
  CheckCircle2,
  UserPlus,
  Search,
  Home,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useState, type ReactNode } from "react";

interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/dashboard" },
  { label: "Organizations", icon: <Building2 size={20} />, href: "/dashboard/organizations", roles: ["super_admin", "org_admin"] },
  { label: "Members", icon: <Users size={20} />, href: "/dashboard/members", roles: ["super_admin", "org_admin"] },
  { label: "Courses", icon: <BookOpen size={20} />, href: "/dashboard/courses" },
  { label: "My Courses", icon: <GraduationCap size={20} />, href: "/dashboard/my-courses", roles: ["learner"] },
  { label: "Course Builder", icon: <PenTool size={20} />, href: "/dashboard/course-builder", roles: ["instructor", "org_admin"] },
  { label: "Assignments", icon: <FileText size={20} />, href: "/dashboard/assignments" },
  { label: "Grades", icon: <BarChart3 size={20} />, href: "/dashboard/grades", roles: ["learner"] },
  { label: "Certificates", icon: <Award size={20} />, href: "/dashboard/certificates" },
  { label: "Settings", icon: <Settings size={20} />, href: "/dashboard/settings" },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, selectedOrg } = useApp();
  const location = useLocation();
  const role = profile?.role ?? "learner";

  const filteredItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary clay-sm">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            LearnSphere
          </h1>
        </div>
      </div>

      {/* Org indicator */}
      {selectedOrg && (
        <div className="mx-4 mb-3">
          <div className="clay-inset px-3 py-2.5">
            <p className="text-xs font-medium text-muted-foreground">Organization</p>
            <p className="text-sm font-semibold text-foreground truncate">{selectedOrg.name}</p>
          </div>
        </div>
      )}

      <Separator className="mx-4 opacity-50" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? location.pathname === "/dashboard"
                : location.pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "clay-tab-active"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                )}
              >
                <span className={cn(isActive ? "text-white" : "text-muted-foreground")}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User card at bottom */}
      <div className="border-t border-border/50 p-4">
        <div className="clay-inset flex items-center gap-3 px-3 py-2.5">
          <Avatar className="clay-avatar h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {profile?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{profile?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {profile?.role?.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { profile } = useApp();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const notifications = useQuery(api.notifications.getUserNotifications);
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const markAllRead = useMutation(api.notifications.markAllAsRead);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="clay-sidebar hidden lg:flex w-64 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 clay-sidebar border-r-0">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Nav */}
        <header className="clay-flat flex h-16 items-center justify-between border-b border-border/50 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 clay-sidebar border-r-0">
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="hidden sm:flex items-center clay-inset px-3 py-1.5">
              <Search className="h-4 w-4 text-muted-foreground mr-2" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm outline-none w-40 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative clay-sm rounded-2xl">
                  <Bell className="h-4 w-4" />
                  {(unreadCount ?? 0) > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 clay-card border-0">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {(unreadCount ?? 0) > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => markAllRead()}
                    >
                      Mark all read
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="max-h-72">
                  {notifications?.length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      No notifications yet
                    </p>
                  )}
                  {notifications?.slice(0, 10).map((n: any) => (
                    <DropdownMenuItem key={n._id} className="flex flex-col items-start gap-1 py-3 cursor-default">
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-sm font-medium">{n.title}</span>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{n.message}</span>
                    </DropdownMenuItem>
                  ))}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 clay-sm rounded-2xl px-3">
                  <Avatar className="clay-avatar h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {profile?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">{profile?.name}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 clay-card border-0">
                <DropdownMenuLabel>
                  <p className="font-semibold">{profile?.name}</p>
                  <p className="text-xs text-muted-foreground font-normal">{profile?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
