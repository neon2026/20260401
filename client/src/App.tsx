import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DatabaseConnection from "./pages/DatabaseConnection";
import AIQuery from "./pages/AIQuery";
import MetadataExtraction from "./pages/MetadataExtraction";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "./const";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Oracle AI Query</h1>
          <p className="text-slate-600 mb-8">用自然语言查询您的数据库</p>
          <a href={getLoginUrl()} className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            登录
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 导航栏 */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold">
            <span className="text-blue-600">Oracle</span> AI Query
          </div>
          <div className="flex gap-8">
            <a href="/" className="text-slate-600 hover:text-slate-900 transition">
              首页
            </a>
            <a href="/database-connection" className="text-slate-600 hover:text-slate-900 transition">
              数据库连接
            </a>
            <a href="/metadata-extraction" className="text-slate-600 hover:text-slate-900 transition">
              元数据提取
            </a>
            <a href="/ai-query" className="text-slate-600 hover:text-slate-900 transition">
              AI 问答
            </a>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/database-connection"} component={DatabaseConnection} />
          <Route path={"/metadata-extraction"} component={MetadataExtraction} />
          <Route path={"/ai-query"} component={AIQuery} />
          <Route path={"/404"} component={NotFound} />
          {/* Final fallback route */}
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
