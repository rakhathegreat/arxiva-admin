import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

interface SidebarNavItem {
  title: string
  id: string
  adminOnly?: boolean
}

interface SidebarNavGroup {
  groupLabel?: string
  items: SidebarNavItem[]
}

interface SidebarNavProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'> {
  groups: SidebarNavGroup[]
  activeId: string
  onSelect: (id: string) => void
  isAdmin: boolean
}

export function SidebarNav({ className, groups, activeId, onSelect, isAdmin, ...props }: SidebarNavProps) {
  return (
    <nav
      className={cn("flex flex-col gap-5 p-3", className)}
      {...props}
    >
      {groups.map((group, groupIdx) => {
        const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);

        if (visibleItems.length === 0) return null;

        return (
          <div key={groupIdx} className="flex flex-col gap-1">
            {group.groupLabel && (
              <h4 className="meta-label px-2 pb-1">
                {group.groupLabel}
              </h4>
            )}
            <div className="flex flex-wrap gap-1 lg:flex-col lg:flex-nowrap">
              {visibleItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 justify-start rounded-md px-2 text-left text-[13px] active:translate-y-0!",
                    activeId === item.id
                      ? "bg-foreground/[0.06] font-medium text-foreground hover:bg-foreground/[0.08]"
                      : "font-normal text-muted-foreground hover:bg-muted/60! hover:text-foreground"
                  )}
                  onClick={() => onSelect(item.id)}
                >
                  <span className="truncate">{item.title}</span>
                </Button>
              ))}
            </div>
          </div>
        )
      })}
    </nav>
  )
}
