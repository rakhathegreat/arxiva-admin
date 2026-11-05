"use client";

import * as React from "react";
import { Bell, Check, Info, AlertTriangle, XCircle } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { cn } from "@/shared/lib/utils";
import { getBaseUrl, getHeaders } from "@/shared/lib/api";

type NotificationItem = {
	id: string;
	title: string;
	message: string;
	type: string;
	date: string;
	isRead: boolean;
};

export function Notifications() {
	const [open, setOpen] = React.useState(false);
	const [items, setItems] = React.useState<NotificationItem[]>([]);

	const fetchNotifications = React.useCallback(async () => {
		try {
			const res = await fetch(`${getBaseUrl()}/notifications`, {
				method: "GET",
				headers: getHeaders(),
			});
			if (res.ok) {
				const data = await res.json();
				if (data.success && Array.isArray(data.data)) {
					const mapped = data.data.map((n: any) => ({
						...n,
						date: n.createdAt || n.date,
					}));
					setItems(mapped);
				}
			}
		} catch (error) {
			console.error("Failed to fetch notifications:", error);
		}
	}, []);

	React.useEffect(() => {
		fetchNotifications();
		// Optional: setup a polling interval if you want real-time updates
		const interval = setInterval(fetchNotifications, 10000);
		return () => clearInterval(interval);
	}, [fetchNotifications]);

	const unreadCount = items.filter((n) => !n.isRead).length;

	const markAllAsRead = async () => {
		try {
			const res = await fetch(`${getBaseUrl()}/notifications/read-all`, {
				method: "PATCH",
				headers: getHeaders(),
			});
			if (res.ok) {
				fetchNotifications();
			}
		} catch (error) {
			console.error("Failed to mark all as read:", error);
		}
	};

	const markAsRead = async (id: string) => {
		try {
			const res = await fetch(`${getBaseUrl()}/notifications/${id}/read`, {
				method: "PATCH",
				headers: getHeaders(),
			});
			if (res.ok) {
				fetchNotifications();
			}
		} catch (error) {
			console.error("Failed to mark as read:", error);
		}
	};

	const getIconProps = (type: string) => {
		switch (type) {
			case "warning":
				return { icon: AlertTriangle, color: "text-foreground", bg: "bg-foreground/5" };
			case "success":
				return { icon: Check, color: "text-success", bg: "bg-success/10" };
			case "error":
				return { icon: XCircle, color: "text-background", bg: "bg-foreground" };
			case "info":
			default:
				return { icon: Info, color: "text-charcoal", bg: "bg-muted" };
		}
	};

	const formatTime = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleString("id-ID", {
			day: "numeric",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					className="relative group rounded-md p-0 cursor-pointer"
				>
					<Bell className="size-4 text-primary transition-colors group-hover:text-foreground" />
					{unreadCount > 0 && (
						<span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5 rounded-full bg-foreground ring-2 ring-background">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/40 opacity-75"></span>
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[320px] p-0 md:w-95" align="end" sideOffset={8}>
				<div className="flex items-center justify-between px-4 py-3 gap-3">
					<div className="flex items-center gap-2">
						<p className="font-normal text-sm">Notifikasi</p>
						{unreadCount > 0 && (
							<Badge variant="quiet" size="sm" tone="indigo">
								{unreadCount} baru
							</Badge>
						)}
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={markAllAsRead}
						className="text-xs text-muted-foreground hover:text-foreground rounded-md cursor-pointer transition-colors"
					>
						Tandai sudah dibaca
					</Button>
				</div>
				<ScrollArea className="h-100">
					{items.length === 0 ? (
						<div className="flex h-90 flex-col items-center justify-center text-center text-sm gap-3 p-4">
							<div className="flex items-center justify-center rounded-md bg-muted size-8">
								<Bell className="size-4 text-muted-foreground fill-muted-foreground" />
							</div>
							<p className="text-center text-sm text-muted-foreground">
								You're all caught up!
							</p>
						</div>
					) : (
						<div className="flex flex-col gap-1 p-2">
							{items.map((notification) => {
								const { icon: Icon, color, bg } = getIconProps(notification.type);
								return (
									<button
										key={notification.id}
										onClick={() => markAsRead(notification.id)}
										className={cn(
											"flex items-start gap-3 rounded-md p-3 text-left transition-all hover:bg-accent focus:bg-accent outline-none cursor-pointer",
											!notification.isRead && "bg-muted/40",
										)}
									>
										<div
											className={cn(
												"flex size-9 shrink-0 items-center justify-center rounded-full mt-0.5",
												bg,
												color,
											)}
										>
											<Icon className="size-4.5" />
										</div>
										<div className="flex flex-col gap-1 flex-1 min-w-0">
											<p
												className={cn(
													"text-sm leading-tight text-foreground",
													!notification.isRead
														? "font-medium"
														: "font-normal",
												)}
											>
												{notification.title}
											</p>
											<p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
												{notification.message}
											</p>
											<p className="text-[10px] font-medium text-muted-foreground/60 mt-1">
												{formatTime(notification.date)}
											</p>
										</div>
										{!notification.isRead && (
											<div className="ml-auto mt-1 flex size-2 shrink-0 rounded-full bg-primary" />
										)}
									</button>
								);
							})}
						</div>
					)}
				</ScrollArea>
			</PopoverContent>
		</Popover>
	);
}
