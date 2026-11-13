import * as React from "react";
import { cn } from "@/shared/lib/utils";

interface ScrollShadowWrapperProps {
	children: React.ReactNode;
	className?: string;
	/** Gaya tambahan (mis. maxHeight hasil pengukuran tinggi tabel). */
	style?: React.CSSProperties;
	/** Kelas warna gradien, mis. `from-card` saat tabel berada di atas kartu putih. */
	fadeClassName?: string;
}

export function ScrollShadowWrapper({
	children,
	className,
	style,
	fadeClassName = "from-background",
}: ScrollShadowWrapperProps) {
	const [canScrollTop, setCanScrollTop] = React.useState(false);
	const [canScrollBottom, setCanScrollBottom] = React.useState(false);
	const [canScrollLeft, setCanScrollLeft] = React.useState(false);
	const [canScrollRight, setCanScrollRight] = React.useState(false);
	const [headerHeight, setHeaderHeight] = React.useState(40);
	const scrollRef = React.useRef<HTMLDivElement>(null);

	const checkScroll = () => {
		if (scrollRef.current) {
			const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } =
				scrollRef.current;
			setCanScrollTop(scrollTop > 0);
			setCanScrollBottom(Math.ceil(scrollTop + clientHeight) < scrollHeight);
			setCanScrollLeft(scrollLeft > 0);
			setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);

			const thead = scrollRef.current.querySelector("thead");
			if (thead) {
				setHeaderHeight(thead.offsetHeight);
			}
		}
	};

	React.useEffect(() => {
		checkScroll();
		const el = scrollRef.current;
		if (!el) return;
		const observer = new ResizeObserver(() => checkScroll());
		observer.observe(el);
		if (el.firstElementChild) observer.observe(el.firstElementChild);
		const thead = el.querySelector("thead");
		if (thead) observer.observe(thead);
		return () => observer.disconnect();
	}, [children]);

	return (
		<div className={cn("overflow-hidden relative flex-1 min-h-0", className)} style={style}>
			<div
				ref={scrollRef}
				className="overflow-auto h-full max-h-[65vh] lg:max-h-none overscroll-contain [&>div]:overflow-visible [&>div]:static"
				style={style?.maxHeight ? { maxHeight: style.maxHeight } : undefined}
				onScroll={checkScroll}
			>
				{children}
			</div>
			{canScrollTop && (
				<div
					className={cn(
						"absolute left-0 right-0 h-6 bg-linear-to-b to-transparent pointer-events-none z-30",
						fadeClassName,
					)}
					style={{ top: `${headerHeight}px` }}
				/>
			)}
			{canScrollBottom && (
				<div
					className={cn(
						"absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t to-transparent pointer-events-none rounded-b-md z-30",
						fadeClassName,
					)}
				/>
			)}
			{canScrollLeft && (
				<div
					className={cn(
						"absolute inset-y-0 left-0 w-6 bg-linear-to-r to-transparent pointer-events-none z-30",
						fadeClassName,
					)}
				/>
			)}
			{canScrollRight && (
				<div
					className={cn(
						"absolute inset-y-0 right-0 w-6 bg-linear-to-l to-transparent pointer-events-none z-30",
						fadeClassName,
					)}
				/>
			)}
		</div>
	);
}
