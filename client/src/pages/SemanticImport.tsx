import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Upload, Check, AlertCircle, Loader2 } from "lucide-react";

interface InferredSemantic {
  tableName: string;
  chineseAlias: string;
  tableDescription: string;
  columns: Array<{
    columnName: string;
    chineseAlias: string;
    columnDescription: string;
    dataType: string;
    nullable: boolean;
  }>;
}

export default function SemanticImport() {
  const [connectionId, setConnectionId] = useState<number | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [previewData, setPreviewData] = useState<InferredSemantic[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const importMutation = trpc.semantic.importResults.useMutation();
  const connections = trpc.database.listConnections.useQuery();

  const handleJsonPaste = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed)) {
        setPreviewData(parsed);
        toast.success("JSON 解析成功");
      } else if (parsed.tables && Array.isArray(parsed.tables)) {
        setPreviewData(parsed.tables);
        toast.success("JSON 解析成功");
      } else {
        toast.error("JSON 格式不正确，应该是数组或包含 tables 字段的对象");
      }
    } catch (error) {
      toast.error("JSON 解析失败: " + (error as Error).message);
    }
  };

  const handleImport = async () => {
    if (!connectionId || !previewData) {
      toast.error("请选择连接并提供有效的 JSON 数据");
      return;
    }

    setIsImporting(true);
    try {
      const result = await importMutation.mutateAsync({
        connectionId,
        results: previewData,
      });

      toast.success(
        `导入完成: ${result.imported} 个新表，${result.updated} 个更新，${result.failed} 个失败`
      );
      setJsonInput("");
      setPreviewData(null);
    } catch (error) {
      toast.error("导入失败: " + (error as Error).message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">语义导入</h1>
        <p className="text-slate-600 mt-1 text-sm">
          将 AI 推断的语义结果导入系统，支持 JSON 格式的数据
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <div className="max-w-4xl mx-auto space-y-6">
          <Tabs defaultValue="import" className="w-full">
            <TabsList>
              <TabsTrigger value="import">导入数据</TabsTrigger>
              <TabsTrigger value="preview">预览结果</TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>选择数据库连接</CardTitle>
                  <CardDescription>
                    选择要导入语义信息的数据库连接
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {connections.data?.map((conn) => (
                      <label
                        key={conn.id}
                        className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name="connection"
                          value={conn.id}
                          checked={connectionId === conn.id}
                          onChange={(e) => setConnectionId(Number(e.target.value))}
                        />
                        <span>{conn.name}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>粘贴 JSON 数据</CardTitle>
                  <CardDescription>
                    粘贴从 AI 推断脚本获得的 JSON 数据
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder={`粘贴 JSON 数据，格式如下：
[
  {
    "tableName": "USERS",
    "chineseAlias": "用户表",
    "tableDescription": "存储系统用户信息",
    "columns": [
      {
        "columnName": "USER_ID",
        "chineseAlias": "用户ID",
        "columnDescription": "用户唯一标识",
        "dataType": "NUMBER",
        "nullable": false
      }
    ]
  }
]`}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <Button onClick={handleJsonPaste} variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    解析 JSON
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {previewData ? (
                <>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-900">
                            已解析 {previewData.length} 个表
                          </p>
                          <p className="text-sm text-blue-700">
                            共{" "}
                            {previewData.reduce((sum, t) => sum + t.columns.length, 0)}{" "}
                            个字段
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    {previewData.map((table, idx) => (
                      <Card key={idx}>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {table.tableName}
                            <span className="text-sm font-normal text-gray-600 ml-2">
                              ({table.chineseAlias})
                            </span>
                          </CardTitle>
                          <CardDescription>{table.tableDescription}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-gray-700">字段：</p>
                            <div className="space-y-1">
                              {table.columns.map((col, colIdx) => (
                                <div
                                  key={colIdx}
                                  className="text-sm p-2 bg-gray-50 rounded"
                                >
                                  <div className="font-mono text-gray-900">
                                    {col.columnName}
                                    <span className="text-gray-600 ml-2">
                                      ({col.chineseAlias})
                                    </span>
                                  </div>
                                  <div className="text-gray-600 text-xs">
                                    {col.columnDescription} • {col.dataType}
                                    {col.nullable ? " (可空)" : " (非空)"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Button
                    onClick={handleImport}
                    disabled={isImporting || !connectionId}
                    className="w-full"
                    size="lg"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        导入中...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        确认导入
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Card className="bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-gray-600">
                      <AlertCircle className="w-5 h-5" />
                      <p>请先在"导入数据"标签页中解析 JSON 数据</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
