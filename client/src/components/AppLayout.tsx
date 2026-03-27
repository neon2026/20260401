import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  History,
  BookOpen,
  Database,

  FileText,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  const menuItems = [
    {
      icon: MessageCircle,
      label: "AI 数据咨询",
      href: "/",
      badge: "主页",
    },
    {
      icon: History,
      label: "查询历史",
      href: "/query-history",
    },
    {
      icon: BookOpen,
      label: "数据字典",
      href: "/data-dictionary",
    },
    {
      icon: Database,
      label: "数据库连接",
      href: "/database-connection",
    },

    {
      icon: FileText,
      label: "执行日志",
      href: "/execution-logs",
    },
  ];

  const isActive = (href: string) => location === href;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* 左侧导航 */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 bg-white border-r border-slate-200 flex flex-col overflow-hidden`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <div className="text-xl font-bold text-slate-900">
            <span className="text-blue-600">AI</span> 数据咨询
          </div>
        </div>

        {/* 菜单项 */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => setLocation(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 用户信息和登出 */}
        <div className="border-t border-slate-200 p-4 space-y-3">
          <div className="px-4 py-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600">登录用户</p>
            <p className="text-sm font-medium text-slate-900 truncate">{user?.name || user?.email}</p>
          </div>
          <Button
            onClick={() => logout()}
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <LogOut className="h-4 w-4" />
            登出
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部工具栏 */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5 text-slate-600" />
            ) : (
              <Menu className="h-5 w-5 text-slate-600" />
            )}
          </button>
          <div className="flex-1" />
          <div className="text-sm text-slate-600">
            {new Date().toLocaleDateString("zh-CN")}
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
