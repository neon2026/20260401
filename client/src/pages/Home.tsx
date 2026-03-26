import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Database, Brain, Zap, Shield, TrendingUp, Code2 } from "lucide-react";
import { useState } from "react";

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-slate-900">
            <span className="text-blue-600">Oracle</span> AI Query
          </div>
          <div className="hidden md:flex gap-8">
            <a href="#problem" className="text-slate-600 hover:text-slate-900 transition">问题分析</a>
            <a href="#solution" className="text-slate-600 hover:text-slate-900 transition">解决方案</a>
            <a href="#architecture" className="text-slate-600 hover:text-slate-900 transition">架构设计</a>
            <a href="#implementation" className="text-slate-600 hover:text-slate-900 transition">实施方案</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-emerald-50" />
        <div className="container max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                大企业信息化系统孤岛
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600"> AI 解决方案</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                通过 AI + Oracle 直连，实现统一的自然语言数据查询。无需学习复杂的 SQL，直接提问即可获取所需数据。
              </p>
              <div className="flex gap-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  了解更多 <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  查看演示
                </Button>
              </div>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663478877210/NqrPUNEyvL6CBXeagzkVcz/hero-oracle-ai-XTVXG9QAnTtNx9TNNK2LGt.webp"
                alt="AI Oracle Integration"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 bg-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">系统孤岛问题</h2>
            <p className="text-xl text-slate-600">大企业面临的核心挑战</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Database,
                title: "数据孤岛",
                description: "多个信息化系统独立运作，数据分散存储，难以整合。用户需要在多个系统间切换查询数据。"
              },
              {
                icon: Brain,
                title: "知识孤岛",
                description: "缺乏系统文档，用户难以理解数据结构和业务含义。系统厂商已停止服务支持，无法获得原始文档。"
              },
              {
                icon: Zap,
                title: "效率低下",
                description: "手动查询容易出错，缺乏统一的数据标准。系统更新后，用户需要重新学习。学习成本高。"
              }
            ].map((item, index) => (
              <Card key={index} className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-slate-900">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">AI 驱动的统一查询系统</h2>
            <p className="text-xl text-slate-600">核心解决方案</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
              <img 
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663478877210/NqrPUNEyvL6CBXeagzkVcz/data-integration-de8npb8uotg79PL6rAEMF8.webp"
                alt="Data Integration"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-8">核心特点</h3>
              <div className="space-y-6">
                {[
                  { title: "直接连接 Oracle", desc: "系统直接连接到 Oracle 数据库，无需中间数据湖" },
                  { title: "语义层驱动", desc: "通过 AI 推断和人工修正，建立完整的语义层" },
                  { title: "自然语言查询", desc: "用户以自然语言提问，系统自动生成 SQL" },
                  { title: "统一数据视图", desc: "多个系统的数据统一在 Oracle 中" }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-600 font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{item.title}</h4>
                      <p className="text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Query Flow Section */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">自然语言查询流程</h2>
            <p className="text-xl text-slate-600">从提问到结果的完整过程</p>
          </div>

          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-xl mb-12">
            <img 
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663478877210/NqrPUNEyvL6CBXeagzkVcz/query-flow-B3BSz8s32yMytvnZT7x4dA.webp"
              alt="Query Flow"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "简单查询",
                example: "患者李明的所有收费记录",
                sql: "SELECT * FROM OUTP_LIST_BILL_PAYMENT WHERE patient_id = (SELECT patient_id FROM PATIENT WHERE patient_name = '李明')"
              },
              {
                title: "聚合查询",
                example: "按科室统计2024年的平均收费金额",
                sql: "SELECT dept.dept_name, AVG(bill.amount) as avg_amount FROM OUTP_LIST_BILL_PAYMENT bill..."
              }
            ].map((item, index) => (
              <Card key={index} className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-slate-900">{item.title}</CardTitle>
                  <CardDescription>用户提问: {item.example}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{item.sql}</pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="py-20 bg-slate-50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">系统架构</h2>
            <p className="text-xl text-slate-600">分层设计，清晰的数据流</p>
          </div>

          <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-xl mb-12">
            <img 
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663478877210/NqrPUNEyvL6CBXeagzkVcz/semantic-layer-diagram-d3bbGpaX77bbaHUmvnh239.webp"
              alt="Semantic Layer"
              className="w-full h-full object-cover"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="semantic">语义层</TabsTrigger>
              <TabsTrigger value="engine">查询引擎</TabsTrigger>
              <TabsTrigger value="database">数据库</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>系统分层架构</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600">系统采用四层架构设计，从用户交互到数据库操作，层层递进。</p>
                  <ul className="space-y-2 text-slate-600">
                    <li>• <strong>用户交互层</strong>：AI 问答界面、数据字典管理、查询历史</li>
                    <li>• <strong>语义层</strong>：表别名、字段别名、业务注释、关键字标签</li>
                    <li>• <strong>AI 查询引擎</strong>：自然语言理解、SQL 生成、结果格式化</li>
                    <li>• <strong>Oracle 数据库</strong>：业务表、元数据表、审计表</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="semantic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>语义层的核心要素</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-4 py-2 text-left">要素</th>
                          <th className="px-4 py-2 text-left">说明</th>
                          <th className="px-4 py-2 text-left">示例</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="px-4 py-2">表别名</td>
                          <td className="px-4 py-2">表的中文名称</td>
                          <td className="px-4 py-2 font-mono text-xs">门诊收费支付表</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="px-4 py-2">字段别名</td>
                          <td className="px-4 py-2">字段的中文名称</td>
                          <td className="px-4 py-2 font-mono text-xs">支付记录 ID</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">业务注释</td>
                          <td className="px-4 py-2">字段的业务含义</td>
                          <td className="px-4 py-2 font-mono text-xs">支付记录唯一标识</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engine" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>AI 查询引擎</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600">采用 LangChain + Claude/GPT-4 的组合，实现高准确率的 Text-to-SQL 转换。</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900"><strong>关键技术：</strong> Schema Linking、Context Retrieval、SQL Generation、Query Execution、Error Handling</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="database" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Oracle 数据库</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600">直接连接 Oracle 数据库，无需中间数据湖，降低系统复杂度。</p>
                  <ul className="space-y-2 text-slate-600">
                    <li>• <strong>业务表</strong>：HR、OE、INV、FIN 等模块的业务数据</li>
                    <li>• <strong>元数据表</strong>：表定义、字段定义、映射关系</li>
                    <li>• <strong>审计表</strong>：查询历史、修改记录、访问日志</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">技术栈选择</h2>
            <p className="text-xl text-slate-600">经过验证的最优技术组合</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { layer: "前端", tech: "React 19 + Tailwind CSS", reason: "现代、响应式、易维护" },
              { layer: "后端", tech: "Node.js/Express 或 Python FastAPI", reason: "轻量级、易部署" },
              { layer: "数据库连接", tech: "oracledb 或 cx_Oracle", reason: "原生支持、性能好" },
              { layer: "AI 引擎", tech: "Claude 3.5 / GPT-4", reason: "表结构理解能力强" },
              { layer: "Text-to-SQL", tech: "LangChain", reason: "成熟、易集成" },
              { layer: "缓存", tech: "Redis", reason: "提高查询性能" }
            ].map((item, index) => (
              <Card key={index} className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-slate-900">{item.layer}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-sm text-blue-600 mb-2">{item.tech}</p>
                  <p className="text-slate-600 text-sm">{item.reason}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Section */}
      <section id="implementation" className="py-20 bg-slate-50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">分阶段实施</h2>
            <p className="text-xl text-slate-600">从规划到上线的完整路线图</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { phase: "第 1 阶段", title: "语义层构建", duration: "2-4 周", tasks: ["提取元数据", "AI 推断", "人工审核"] },
              { phase: "第 2 阶段", title: "AI 查询引擎", duration: "4-6 周", tasks: ["开发引擎", "集成 LLM", "功能测试"] },
              { phase: "第 3 阶段", title: "前端 UI", duration: "2-3 周", tasks: ["构建界面", "结果展示", "用户体验"] },
              { phase: "第 4 阶段", title: "系统集成", duration: "1-2 周", tasks: ["集成测试", "性能优化", "上线部署"] }
            ].map((item, index) => (
              <Card key={index} className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardDescription className="text-emerald-600 font-semibold">{item.phase}</CardDescription>
                  <CardTitle className="text-slate-900">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-slate-600">
                    <p className="font-semibold mb-2">预计周期：{item.duration}</p>
                    <ul className="space-y-1">
                      {item.tasks.map((task, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">核心价值</h2>
            <p className="text-xl text-blue-100">为什么选择这个方案</p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {[
              { icon: Brain, title: "降低学习成本", desc: "无需学习复杂的 SQL 和数据库结构" },
              { icon: Zap, title: "提高工作效率", desc: "快速获取数据，支持自助分析" },
              { icon: Shield, title: "保证数据准确", desc: "AI 和人工相结合，确保准确性" },
              { icon: TrendingUp, title: "灵活扩展", desc: "支持新系统接入，逐步完善" },
              { icon: Code2, title: "成本可控", desc: "无需构建复杂数据湖，直接连接" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-8 w-8" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-blue-100">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">准备好了吗？</h2>
          <p className="text-xl text-slate-600 mb-8">开始您的 AI 驱动数据查询之旅</p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              获取完整方案 <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline">
              联系我们
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">关于我们</h3>
              <p className="text-sm">提供企业级 AI 数据查询解决方案</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">快速链接</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#problem" className="hover:text-white transition">问题分析</a></li>
                <li><a href="#solution" className="hover:text-white transition">解决方案</a></li>
                <li><a href="#architecture" className="hover:text-white transition">架构设计</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">资源</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">文档</a></li>
                <li><a href="#" className="hover:text-white transition">教程</a></li>
                <li><a href="#" className="hover:text-white transition">案例研究</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">联系方式</h3>
              <ul className="space-y-2 text-sm">
                <li>邮箱：info@example.com</li>
                <li>电话：+86 10 xxxx xxxx</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Oracle AI Query Solution. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
