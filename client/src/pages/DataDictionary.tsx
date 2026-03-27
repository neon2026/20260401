import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Search, Edit2, Save, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface TableWithColumns {
  id: number;
  tableName: string;
  tableAlias?: string;
  tableComment?: string;
  comment?: string;
  columns: Array<{
    id: number;
    columnName: string;
    columnAlias?: string;
    columnComment?: string;
    dataType?: string;
    comment?: string;
  }>;
  columnCount?: number;
}

export default function DataDictionary() {
  const [connectionId, setConnectionId] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [expandedTableId, setExpandedTableId] = useState<number | null>(null);
  const [editingTableId, setEditingTableId] = useState<number | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null);
  const [tableCommentInput, setTableCommentInput] = useState("");
  const [columnCommentInput, setColumnCommentInput] = useState("");

  const connections = trpc.database.listConnections.useQuery();
  const tables = trpc.dictionary.getTablesSummary.useQuery(
    { connectionId: connectionId || 0 },
    { enabled: connectionId !== null }
  );
  const tableDetails = trpc.dictionary.getTableDetails.useQuery(
    { tableId: expandedTableId || 0 },
    { enabled: expandedTableId !== null }
  );

  const updateTableCommentMutation = trpc.dictionary.updateTableComment.useMutation();
  const updateColumnCommentMutation = trpc.dictionary.updateColumnComment.useMutation();

  // 搜索和筛选
  const filteredTables = useMemo(() => {
    if (!tables.data) return [];
    if (!searchKeyword) return tables.data;

    return tables.data.filter(
      (t) =>
        t.tableName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        t.tableAlias?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        t.tableComment?.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  }, [tables.data, searchKeyword]);

  const handleSelectConnection = (id: number) => {
    setConnectionId(id);
    setExpandedTableId(null);
    setSearchKeyword("");
  };

  const handleEditTableComment = (tableId: number, currentComment: string | undefined) => {
    setEditingTableId(tableId);
    setTableCommentInput(currentComment || "");
  };

  const handleSaveTableComment = async () => {
    if (editingTableId === null) return;

    try {
      await updateTableCommentMutation.mutateAsync({
        tableId: editingTableId,
        comment: tableCommentInput,
      });
      toast.success("表注释已更新");
      setEditingTableId(null);
      // 刷新表详情
      if (expandedTableId === editingTableId) {
        tables.refetch();
      }
    } catch (error) {
      toast.error("更新失败: " + (error as Error).message);
    }
  };

  const handleEditColumnComment = (columnId: number, currentComment: string | undefined) => {
    setEditingColumnId(columnId);
    setColumnCommentInput(currentComment || "");
  };

  const handleSaveColumnComment = async () => {
    if (editingColumnId === null) return;

    try {
      await updateColumnCommentMutation.mutateAsync({
        columnId: editingColumnId,
        comment: columnCommentInput,
      });
      toast.success("字段注释已更新");
      setEditingColumnId(null);
      // 刷新表详情
      if (expandedTableId) {
        tableDetails.refetch();
      }
    } catch (error) {
      toast.error("更新失败: " + (error as Error).message);
    }
  };

  const currentTableDetails = expandedTableId && tableDetails.data ? tableDetails.data : null;

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">数据字典</h1>
        <p className="text-slate-600 mt-1 text-sm">
          查看和管理数据库表结构，编辑表和字段的注释以帮助 AI 更好地理解数据含义
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 连接选择 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">选择数据库连接</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {connections.data?.map((conn) => (
                  <Button
                    key={conn.id}
                    variant={connectionId === conn.id ? "default" : "outline"}
                    onClick={() => handleSelectConnection(conn.id)}
                  >
                    {conn.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {connectionId && (
            <>
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="搜索表名、别名或注释..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 表列表 */}
              <div className="space-y-3">
                {tables.isLoading ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>加载中...</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : filteredTables.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-slate-600">
                        {searchKeyword ? "未找到匹配的表" : "暂无表数据"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredTables.map((table) => (
                    <Card key={table.id} className="overflow-hidden">
                      <div
                        className="p-4 bg-white cursor-pointer hover:bg-slate-50 flex items-center justify-between"
                        onClick={() =>
                          setExpandedTableId(expandedTableId === table.id ? null : table.id)
                        }
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-mono font-semibold text-slate-900">
                              {table.tableName}
                            </h3>
                            {table.tableAlias && (
                              <span className="text-sm text-slate-600">({table.tableAlias})</span>
                            )}
                          </div>
                          {table.tableComment && (
                            <p className="text-sm text-slate-600 mt-1">{table.tableComment}</p>
                          )}
                          {table.comment && (
                            <p className="text-sm text-blue-600 mt-1 font-semibold">
                              注释: {table.comment}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            {table.columnCount} 个字段
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTableComment(table.id, table.comment || undefined);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {expandedTableId === table.id ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* 展开的字段列表 */}
                      {expandedTableId === table.id && currentTableDetails && (
                        <div className="border-t border-slate-200 bg-slate-50 p-4">
                          <div className="space-y-3">
                            {currentTableDetails.columns.map((column) => (
                              <div
                                key={column.id}
                                className="bg-white p-3 rounded border border-slate-200"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <code className="text-sm font-semibold text-slate-900">
                                        {column.columnName}
                                      </code>
                                      {column.columnAlias && (
                                        <span className="text-xs text-slate-600">
                                          ({column.columnAlias})
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-slate-600 mt-1">
                                      {column.dataType}
                                    </div>
                                    {column.columnComment && (
                                      <p className="text-sm text-slate-600 mt-1">
                                        {column.columnComment}
                                      </p>
                                    )}
                                    {column.comment && (
                                      <p className="text-sm text-blue-600 mt-1 font-semibold">
                                        注释: {column.comment}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleEditColumnComment(column.id, column.comment || undefined)
                                    }
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 编辑表注释对话框 */}
      <Dialog open={editingTableId !== null} onOpenChange={() => setEditingTableId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑表注释</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-900">注释</label>
              <Textarea
                value={tableCommentInput}
                onChange={(e) => setTableCommentInput(e.target.value)}
                placeholder="输入表的业务含义和用途..."
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-slate-600 mt-1">
                {tableCommentInput.length}/1000
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTableId(null)}>
              取消
            </Button>
            <Button
              onClick={handleSaveTableComment}
              disabled={updateTableCommentMutation.isPending}
            >
              {updateTableCommentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑字段注释对话框 */}
      <Dialog open={editingColumnId !== null} onOpenChange={() => setEditingColumnId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑字段注释</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-900">注释</label>
              <Textarea
                value={columnCommentInput}
                onChange={(e) => setColumnCommentInput(e.target.value)}
                placeholder="输入字段的业务含义和用途..."
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-slate-600 mt-1">
                {columnCommentInput.length}/1000
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingColumnId(null)}>
              取消
            </Button>
            <Button
              onClick={handleSaveColumnComment}
              disabled={updateColumnCommentMutation.isPending}
            >
              {updateColumnCommentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
