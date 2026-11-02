import "./App.css";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "@/shared/theme/themeProvider";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { AppRoutes } from "@/routes/AppRoutes";
import { Toaster } from "@/shared/ui/sonner";
import { AuthProvider } from "@/modules/auth/auth";

function App() {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<TooltipProvider>
				<AuthProvider>
					<Router>
						<AppRoutes />
					</Router>
				</AuthProvider>
			</TooltipProvider>
			<Toaster position="top-right" />
		</ThemeProvider>
	);
}

export default App;