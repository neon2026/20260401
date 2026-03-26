import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Home() {
  const [userQuestion, setUserQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);

  const listConnections = trpc.database.listConnections.useQuery();
  const executeQuery = trpc.query.executeQuery.useMutation();

  // 示例问题列表
  const exampleQuestions = [
    "查询所有用户的基本信息",
    "2024年每个月的销售额统计",
    "按部门统计员工人数",
    "查询最近30天的订单数据",
  ];

  const handleAskQuestion = async (question: string) => {
    let connId = selectedConnection;
    
    if (!connId && listConnections.data && listConnections.data.length > 0) {
      connId = listConnections.data[0].id;
      setSelectedConnection(connId);
    }

    if (!connId) {
      toast.error("请先配置数据库连接");
      return;
    }

    setUserQuestion(question);
    setIsLoading(true);

    try {
      const response = await executeQuery.mutateAsync({
        connectionId: connId,
        userQuestion: question,
      });

      setResult(response);
      toast.success("查询成功");
    } catch (error: any) {
      toast.error(error.message || "查询失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userQuestion.trim()) {
      handleAskQuestion(userQuestion);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* 顶部标题区 */}
      <div className="border-b border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">AI 数据咨询</h1>
        <p className="text-slate-600 mt-1 text-sm">用自然语言提问，AI 自动生成 SQL 并返回结果</p>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        {!result ? (
          // 初始状态：显示欢迎界面和示例问题
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">开始提问</h2>
              <p className="text-slate-600">
                我可以帮助您快速查询数据库中的信息。请输入您的问题，AI 会自动生成 SQL 并返回结果。
              </p>
            </div>

            {/* 示例问题 */}
            <div className="space-y-3 mb-8">
              {exampleQuestions.map((question, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-shadow bg-white"
                  onClick={() => handleAskQuestion(question)}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                    </div>
                    <p className="text-slate-700">{question}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-center text-sm text-slate-500">
              或在下方输入框中输入您的问题
            </p>
          </div>
        ) : (
          // 结果展示
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">您的问题</h3>
              <p className="text-slate-700 bg-white p-4 rounded-lg border border-slate-200">{userQuestion}</p>
            </div>

            {/* 生成的 SQL */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">生成的 SQL</h3>
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg overflow-x-auto text-sm border border-slate-800">
                {result.generatedSQL}
              </pre>
            </div>

            {/* 查询结果 */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                查询结果 ({result.result.count} 行)
              </h3>
              {result.result.count === 0 ? (
                <p className="text-slate-600 text-center py-8 bg-white rounded-lg border border-slate-200">暂无数据</p>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
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
                </div>
              )}
            </div>

            <Button
              onClick={() => setResult(null)}
              variant="outline"
              className="mt-6"
            >
              返回提问
            </Button>
          </div>
        )}
      </div>

      {/* 底部输入框 */}
      <div className="border-t border-slate-200 bg-white p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
          <Input
            placeholder="输入您的问题，例如：查询所有用户信息"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || !userQuestion.trim()}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
