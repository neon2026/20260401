import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Database, Wand2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MetadataExtraction() {
  const [connectionId, setConnectionId] = useState<number | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isInferring, setIsInferring] = useState(false);

  const listConnections = trpc.database.listConnections.useQuery();
  const getTableDefinitions = trpc.metadata.getTableDefinitions.useQuery(
    { connectionId: connectionId || 0 },
    { enabled: !!connectionId }
  );
  const getColumnDefinitions = trpc.metadata.getColumnDefinitions.useQuery(
    { tableId: 0 },
    { enabled: false }
  );

  const extractMetadata = trpc.metadata.extractTableMetadata.useMutation();
  const inferTableMeaning = trpc.metadata.inferTableMeaning.useMutation();

  const handleExtract = async () => {
    if (!connectionId) {
      toast.error("请先选择数据库连接");
      return;
    }

    setIsExtracting(true);

    try {
      const result = await extractMetadata.mutateAsync({ connectionId });
      toast.success(`成功提取 ${result.tablesCount} 个表，共 ${result.columnsCount} 个字段`);
      getTableDefinitions.refetch();
    } catch (error: any) {
      toast.error(error.message || "提取失败");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleInferTable = async (tableId: number) => {
    setIsInferring(true);

    try {
      const result = await inferTableMeaning.mutateAsync({ tableId });
      toast.success("AI 推断完成");
      getTableDefinitions.refetch();
    } catch (error: any) {
      toast.error(error.message || "推断失败");
    } finally {
      setIsInferring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">元数据提取与 AI 推断</h1>
        <p className="text-slate-600 mt-2">从数据库提取表结构，使用 AI 推断业务含义</p>
      </div>

      {/* 连接选择和提取按钮 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            步骤 1：提取元数据
          </CardTitle>
          <CardDescription>选择数据库连接并提取所有表的结构信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">选择数据库连接</label>
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

          <Button onClick={handleExtract} disabled={isExtracting || !connectionId} className="w-full">
            {isExtracting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                提取中...
              </>
            ) : (
              "提取元数据"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 表列表和 AI 推断 */}
      {getTableDefinitions.data && getTableDefinitions.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              步骤 2：AI 推断业务含义
            </CardTitle>
            <CardDescription>为每个表添加中文别名和业务注释</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tables" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tables">表列表</TabsTrigger>
                <TabsTrigger value="dictionary">数据字典</TabsTrigger>
              </TabsList>

              <TabsContent value="tables" className="space-y-4">
                {getTableDefinitions.data.map((table) => (
                  <div key={table.id} className="border rounded-lg p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{table.tableName}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          中文别名：<span className="font-medium">{table.tableAlias}</span>
                        </p>
                        {table.tableComment && (
                          <p className="text-sm text-slate-600 mt-1">
                            注释：<span className="font-medium">{table.tableComment}</span>
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleInferTable(table.id)}
                        disabled={isInferring}
                        variant="outline"
                        size="sm"
                      >
                        {isInferring ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            推断中...
                          </>
                        ) : (
                          "AI 推断"
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="dictionary" className="space-y-4">
                <p className="text-slate-600">数据字典管理功能即将推出</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
