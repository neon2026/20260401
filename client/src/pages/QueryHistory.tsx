import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

export default function QueryHistory() {
  // 获取第一个连接作为默认值
  const listConnections = trpc.database.listConnections.useQuery();
  const connectionId = listConnections.data?.[0]?.id || 0;
  const queryHistoryQuery = trpc.query.getHistory.useQuery({ connectionId }, { enabled: connectionId > 0 });

  const handleCopy = (sql: string) => {
    navigator.clipboard.writeText(sql);
    toast.success("已复制到剪贴板");
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">查询历史</h1>
        <p className="text-slate-600 mt-1 text-sm">查看您之前执行过的所有查询</p>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        {queryHistoryQuery.isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : queryHistoryQuery.data?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">暂无查询历史</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {queryHistoryQuery.data?.map((item: any) => (
              <Card key={item.id} className="bg-white">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{item.userQuestion}</CardTitle>
                      <CardDescription>
                        {new Date(item.createdAt || new Date()).toLocaleString("zh-CN")}
                      </CardDescription>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.executionStatus === "success"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {item.executionStatus === "success" ? "成功" : "失败"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">生成的 SQL</p>
                    <div className="bg-slate-900 text-emerald-400 p-3 rounded text-xs overflow-x-auto">
                      <pre>{item.generatedSQL}</pre>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleCopy(item.generatedSQL)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      复制 SQL
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
