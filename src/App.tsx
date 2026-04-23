import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Recommendations from "./pages/Recommendations.tsx";
import DestinationDetail from "./pages/DestinationDetail.tsx";
import Saved from "./pages/Saved.tsx";
import History from "./pages/History.tsx";
import Admin from "./pages/Admin.tsx";
import BucketList from "./pages/BucketList.tsx";
import TripTracker from "./pages/TripTracker.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/destination/:id" element={<DestinationDetail />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/history" element={<History />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/bucket-list" element={<BucketList />} />
              <Route path="/trip-tracker" element={<TripTracker />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
