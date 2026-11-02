import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb";
import { useLocation, useNavigate } from "react-router-dom";
import { Notifications } from "@/modules/dashboard/components/notifications";
import { Sun, Moon, LogOut, Bell, User } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useTheme } from "@/shared/theme/themeProvider";
import { useAuth } from "@/modules/auth/auth";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { cn } from "@/shared/lib/utils";

const AVATAR_GRADIENTS = [
	"bg-linear-to-tr from-violet-600 via-indigo-500 to-cyan-400",
	"bg-linear-to-tr from-amber-500 via-rose-500 to-purple-600",
	"bg-linear-to-tr from-emerald-400 via-teal-500 to-indigo-500",
	"bg-linear-to-tr from-blue-500 via-indigo-500 to-violet-600",
	"bg-linear-to-tr from-fuchsia-500 via-pink-500 to-rose-500",
	"bg-linear-to-tr from-sky-400 via-blue-500 to-indigo-600",
];

function getAvatarGradient(name?: string): string {
	if (!name) return AVATAR_GRADIENTS[0];
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
	return AVATAR_GRADIENTS[index];
}
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

export function SiteHeader({ className }: { className?: string }) {
	const location = useLocation();
	const path = location.pathname;
	const { theme, setTheme } = useTheme();
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

	const handleLogout = () => {
		logout();
		setIsLogoutDialogOpen(false);
		navigate("/login", { replace: true });
	};

	// Determine breadcrumbs based on route
	let parent = "Menu Utama";
	let pageName = "Dashboard";
	let parentLink = "#";
	let grandparent = "";

	if (path === "/barang-masuk") {
		parent = "Operasional";
		pageName = "Material Masuk";
	} else if (path === "/barang-keluar") {
		parent = "Operasional";
		pageName = "Distribusi Material";
	} else if (path === "/request") {
		parent = "Operasional";
		pageName = "Request";
	} else if (path === "/peminjaman-mitra") {
		parent = "Operasional";
		pageName = "Peminjaman Antar Mitra";
	} else if (path.startsWith("/request/")) {
		grandparent = "Operasional";
		parent = "Request";
		pageName = "Detail Permintaan";
		parentLink = "#/request";
	} else if (path === "/data-barang") {
		parent = "Inventori";
		pageName = "Data Material";
	} else if (path === "/data-transaksi") {
		parent = "Inventori";
		pageName = "Data Transaksi";
	} else if (path === "/lokasi-barang" || path.startsWith("/lokasi-barang/")) {
		parent = "Inventori";
		pageName = path.endsWith("/statistik") ? "Statistik Gudang" : "Lokasi Material";
	} else if (path === "/manajemen-data/kategori") {
		parent = "Manajemen Data";
		pageName = "Kategori Material";
	} else if (path === "/manajemen-data/model") {
		parent = "Manajemen Data";
		pageName = "Model Material";
	} else if (path === "/manajemen-data/merek") {
		parent = "Manajemen Data";
		pageName = "Merek Material";
	}

	return (
		<header
			className={`sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border bg-background/80 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) ${className || ""}`}
		>
			<div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
				<div className="flex min-w-0 items-center gap-1">
					{/* <SidebarTrigger className="-ml-1" />
					<Separator
						orientation="vertical"
						className="mx-2 data-[orientation=vertical]:h-4"
					/> */}
					<Breadcrumb className="flex-1 min-w-0">
						<BreadcrumbList className="flex-nowrap">
							{grandparent && (
								<>
									<BreadcrumbItem className="hidden md:block">
										<BreadcrumbLink
											href="#"
											className="text-sm hover:text-foreground"
										>
											{grandparent}
										</BreadcrumbLink>
									</BreadcrumbItem>
									<BreadcrumbSeparator className="hidden md:block" />
								</>
							)}
							<BreadcrumbItem className="hidden md:block">
								<BreadcrumbLink
									href={parentLink}
									className="text-sm hover:text-foreground"
								>
									{parent}
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className="hidden md:block" />
							<BreadcrumbItem className="min-w-0">
								<BreadcrumbPage className="text-sm font-medium">
									{pageName}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
				<div className="hidden md:flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => setTheme(theme === "light" ? "dark" : "light")}
						title="Ganti tema"
						className="relative rounded-md text-primary hover:text-foreground cursor-pointer"
					>
						<span className="grid place-items-center">
							<Sun className="col-start-1 row-start-1 size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
							<Moon className="col-start-1 row-start-1 size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
						</span>
						<span className="sr-only">Ganti tema</span>
					</Button>
					<Notifications />

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								className="ml-1 rounded-full p-0 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
							>
								<Avatar size="default" className="size-7">
									<AvatarImage src="" alt={user?.displayName || "User"} />
									<AvatarFallback
										className={cn(
											"text-[11px] font-semibold text-white tracking-wider",
											getAvatarGradient(user?.displayName),
										)}
									></AvatarFallback>
								</Avatar>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-56" align="end" forceMount>
							<DropdownMenuLabel className="py-2 font-normal">
								<div className="flex flex-col gap-1">
									<p className="text-sm font-medium leading-none">
										{user?.displayName || "User"}
									</p>
									<p className="meta-label">Akun</p>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem className="cursor-pointer">
									<User className="mr-2 h-4 w-4" />
									<span>Profil</span>
								</DropdownMenuItem>
								<DropdownMenuItem className="cursor-pointer">
									<Bell className="mr-2 h-4 w-4" />
									<span>Notifikasi</span>
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuItem
								variant="destructive"
								className="cursor-pointer"
								onClick={() => setIsLogoutDialogOpen(true)}
							>
								<LogOut className="mr-2 h-4 w-4" />
								<span>Keluar</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Konfirmasi logout</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin keluar dari akun {user?.displayName}?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="cursor-pointer">Batal</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							className="cursor-pointer"
							onClick={handleLogout}
						>
							<LogOut className="mr-1 h-4 w-4" />
							Ya, Keluar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</header>
	);
}
