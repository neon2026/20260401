import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Zap } from "lucide-react";

export default function DatabaseConnection() {
  const [formData, setFormData] = useState({
    name: "",
    databaseType: "oracle",
    host: "",
    port: 1521,
    database: "",
    username: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);

  const listConnections = trpc.database.listConnections.useQuery();
  const createConnection = trpc.database.createConnection.useMutation();
  const deleteConnection = trpc.database.deleteConnection.useMutation();
  const analyzeTablesAutomatically = trpc.autoAnalysis.analyzeTablesAutomatically.useMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "port" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createConnection.mutateAsync(formData);
      toast.success("数据库连接已创建");
      setFormData({
        name: "",
        databaseType: "oracle",
        host: "",
        port: 1521,
        database: "",
        username: "",
        password: "",
      });
      listConnections.refetch();
    } catch (error: any) {
      toast.error(error.message || "连接失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeTables = async (connectionId: number) => {
    setAnalyzingId(connectionId);
    try {
      const result = await analyzeTablesAutomatically.mutateAsync({ connectionId });
      toast.success(`✅ 分析完成！已分析 ${result.tablesAnalyzed} 个表`);
      listConnections.refetch();
    } catch (error: any) {
      toast.error(error.message || "分析失败");
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDeleteConnection = async (connectionId: number) => {
    if (!confirm("确定要删除此数据库连接吗？这将同时删除所有关联的元数据和查询历史。")) {
      return;
    }

    try {
      await deleteConnection.mutateAsync({ connectionId });
      toast.success("数据库连接已删除");
      listConnections.refetch();
    } catch (error: any) {
      toast.error(error.message || "删除失败");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">数据库连接</h1>
        <p className="text-slate-600 mt-2">管理您的数据库连接配置</p>
      </div>

      {/* 创建新连接 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            创建新连接
          </CardTitle>
          <CardDescription>输入数据库连接信息</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">连接名称</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="如：测试Oracle库"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="databaseType">数据库类型</Label>
                <Select value={formData.databaseType} onValueChange={(value) => setFormData((prev) => ({ ...prev, databaseType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oracle">Oracle</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="host">主机名/IP</Label>
                <Input
                  id="host"
                  name="host"
                  placeholder="192.168.1.100"
                  value={formData.host}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="port">端口</Label>
                <Input
                  id="port"
                  name="port"
                  type="number"
                  value={formData.port}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="database">数据库名称/SID</Label>
                <Input
                  id="database"
                  name="database"
                  placeholder="orcl"
                  value={formData.database}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="neon"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  连接中...
                </>
              ) : (
                "创建连接"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 已有连接列表 */}
      <Card>
        <CardHeader>
          <CardTitle>已有连接</CardTitle>
          <CardDescription>您已配置的数据库连接</CardDescription>
        </CardHeader>
        <CardContent>
          {listConnections.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : listConnections.data?.length === 0 ? (
            <p className="text-slate-600 text-center py-8">暂无连接，请创建一个新连接</p>
          ) : (
            <div className="space-y-4">
              {listConnections.data?.map((conn) => (
                <div key={conn.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div>
                    <h3 className="font-semibold">{conn.name}</h3>
                    <p className="text-sm text-slate-600">
                      {conn.databaseType.toUpperCase()} - {conn.host}:{conn.port}/{conn.database}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleAnalyzeTables(conn.id)}
                      disabled={analyzingId === conn.id}
                    >
                      {analyzingId === conn.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          分析中...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          提取并分析
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteConnection(conn.id)}
                      disabled={deleteConnection.isPending}
                    >
                      {deleteConnection.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
