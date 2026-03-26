import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SemanticImport() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">语义导入</h1>
        <p className="text-slate-600 mt-1 text-sm">导入数据字典和语义层定义</p>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>语义导入</CardTitle>
              <CardDescription>此功能正在开发中</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">敬请期待...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
