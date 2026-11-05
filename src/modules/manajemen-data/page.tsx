import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Box, CircleStar, Shapes } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const TABS = [
	{ value: "kategori", label: "Kategori", icon: Shapes },
	{ value: "model", label: "Model", icon: Box },
	{ value: "merek", label: "Merek", icon: CircleStar },
] as const;

export default function ManajemenDataPage() {
	const location = useLocation();

	return (
		<div className="mx-auto flex h-full w-full flex-col overflow-hidden">
			<div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
				<aside className="shrink-0 overflow-x-auto border-b border-border lg:w-60 lg:overflow-y-auto lg:border-r lg:border-b-0">
					<div className="flex flex-col gap-1 border-b border-border px-4 py-4">
						<h1 className="text-[15px] font-medium tracking-tight">Manajemen Data</h1>
						<p className="text-xs text-muted-foreground">
							Referensi material untuk modul inventori
						</p>
					</div>

					<div className="flex flex-col gap-1 p-3">
						<h2 className="meta-label px-2 pb-1">Registri Material</h2>
						<nav className="flex flex-wrap gap-1 lg:flex-col lg:flex-nowrap">
							{TABS.map((tab) => {
								const Icon = tab.icon;
								return (
									<NavLink
										key={tab.value}
										to={`/manajemen-data/${tab.value}`}
										className={({ isActive }) =>
											cn(
												"flex h-8 min-w-40 cursor-pointer items-center justify-start gap-2 rounded-md px-2 text-sm transition-colors lg:min-w-0",
												isActive
													? "bg-foreground/6 text-foreground"
													: "font-normal text-muted-foreground hover:bg-muted/60 hover:text-foreground",
											)
										}
									>
										<Icon className="size-4 shrink-0 opacity-70" />
										<span className="truncate">{tab.label}</span>
									</NavLink>
								);
							})}
						</nav>
					</div>
				</aside>

				<div
					key={location.pathname}
					className="w-full flex-1 overflow-y-auto animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none"
				>
					<Outlet />
				</div>
			</div>
		</div>
	);
}
