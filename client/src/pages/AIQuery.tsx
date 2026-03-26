import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Send, Code } from "lucide-react";
import { Streamdown } from "streamdown";

export default function AIQuery() {
  const [connectionId, setConnectionId] = useState<number | null>(null);
  const [userQuestion, setUserQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const listConnections = trpc.database.listConnections.useQuery();
  const executeQuery = trpc.query.executeQuery.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connectionId) {
      toast.error("请先选择数据库连接");
      return;
    }

    if (!userQuestion.trim()) {
      toast.error("请输入问题");
      return;
    }

    setIsLoading(true);

    try {
      const response = await executeQuery.mutateAsync({
        connectionId,
        userQuestion,
      });

      setResult(response);
      toast.success("查询成功");
    } catch (error: any) {
      toast.error(error.message || "查询失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI 问答</h1>
        <p className="text-slate-600 mt-2">用自然语言提问，AI 自动生成 SQL 并返回结果</p>
      </div>

      {/* 查询表单 */}
      <Card>
        <CardHeader>
          <CardTitle>提问</CardTitle>
          <CardDescription>输入您的问题，系统将自动生成 SQL 查询</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="connection">选择数据库连接</Label>
              <Select value={connectionId?.toString() || ""} onValueChange={(value) => setConnectionId(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择连接..." />
                </SelectTrigger>
                <SelectContent>
                  {listConnections.data?.map((conn) => (
                    <SelectItem key={conn.id} value={conn.id.toString()}>
                      {conn.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="question">问题</Label>
              <div className="flex gap-2">
                <Input
                  id="question"
                  placeholder="例如：查询所有用户的信息"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading} size="icon">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 查询结果 */}
      {result && (
        <div className="space-y-4">
          {/* 生成的 SQL */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                生成的 SQL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg overflow-x-auto text-sm">
                {result.generatedSQL}
              </pre>
            </CardContent>
          </Card>

          {/* 查询结果 */}
          <Card>
            <CardHeader>
              <CardTitle>查询结果</CardTitle>
              <CardDescription>
                返回 {result.result.count} 行数据，耗时 {result.result.executionTimeMs}ms
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.result.count === 0 ? (
                <p className="text-slate-600 text-center py-8">暂无数据</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        {result.result.columns.map((col: string) => (
                          <th key={col} className="px-4 py-2 text-left font-semibold">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.result.rows.slice(0, 100).map((row: any, idx: number) => (
                        <tr key={idx} className="border-b hover:bg-slate-50">
                          {result.result.columns.map((col: string) => (
                            <td key={col} className="px-4 py-2">
                              {typeof row[col] === "object" ? JSON.stringify(row[col]) : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.result.rows.length > 100 && (
                    <p className="text-slate-600 text-center py-4">仅显示前 100 行，共 {result.result.count} 行</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
