import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import DatabaseConnection from "./pages/DatabaseConnection";
import MetadataExtraction from "./pages/MetadataExtraction";
import QueryHistory from "./pages/QueryHistory";
import DataDictionary from "./pages/DataDictionary";

import ExecutionLogs from "./pages/ExecutionLogs";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "./const";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">AI 数据咨询</h1>
          <p className="text-slate-600 mb-8">用自然语言查询您的数据库</p>
          <a href={getLoginUrl()} className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            登录
          </a>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/database-connection" component={DatabaseConnection} />
        <Route path="/metadata-extraction" component={MetadataExtraction} />
        <Route path="/query-history" component={QueryHistory} />
        <Route path="/data-dictionary" component={DataDictionary} />

        <Route path="/execution-logs" component={ExecutionLogs} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
