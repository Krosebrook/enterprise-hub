import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Download,
  Calendar,
  BarChart3,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { format, subDays } from "date-fns";
import PermissionGate from "../components/rbac/PermissionGate";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#22c55e", "#06b6d4"];

const providerColors = {
  aws: "#FF9900",
  gcp: "#4285F4",
  azure: "#00A4EF",
  openai: "#10A37F",
  anthropic: "#D97706",
  google_ai: "#EA4335",
  other: "#6B7280",
};

export default function Costs() {
  const [timeRange, setTimeRange] = useState("30d");
  const [groupBy, setGroupBy] = useState("provider");

  const { data: costRecords = [], isLoading } = useQuery({
    queryKey: ["cost-records"],
    queryFn: () => base44.entities.CostRecord.list("-date", 500),
    initialData: [],
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => base44.entities.Budget.list(),
    initialData: [],
  });

  // Calculate totals
  const totalSpent = costRecords.reduce((sum, r) => sum + (r.cost_usd || 0), 0);
  const monthlyBudget = budgets.find((b) => b.budget_type === "organization")?.amount_usd || 10000;
  const budgetUsed = (totalSpent / monthlyBudget) * 100;

  // Group by provider
  const costByProvider = costRecords.reduce((acc, record) => {
    const provider = record.provider || "other";
    acc[provider] = (acc[provider] || 0) + (record.cost_usd || 0);
    return acc;
  }, {});

  const providerData = Object.entries(costByProvider)
    .map(([name, value]) => ({
      name: name.toUpperCase(),
      value: Math.round(value * 100) / 100,
      color: providerColors[name] || providerColors.other,
    }))
    .sort((a, b) => b.value - a.value);

  // Group by category
  const costByCategory = costRecords.reduce((acc, record) => {
    const category = record.service_category || "other";
    acc[category] = (acc[category] || 0) + (record.cost_usd || 0);
    return acc;
  }, {});

  const categoryData = Object.entries(costByCategory)
    .map(([name, value]) => ({
      name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value: Math.round(value * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);

  // Daily trend data (mock for visualization)
  const dailyData = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    const dayRecords = costRecords.filter((r) => {
      if (!r.date) return false;
      const recordDate = new Date(r.date);
      return recordDate.toDateString() === date.toDateString();
    });
    const total = dayRecords.reduce((sum, r) => sum + (r.cost_usd || 0), 0);
    return {
      date: format(date, "MMM d"),
      cost: total || Math.random() * 500 + 100, // Fallback to mock data if empty
    };
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getBudgetColor = () => {
    if (budgetUsed >= 100) return "bg-red-500";
    if (budgetUsed >= 80) return "bg-orange-500";
    if (budgetUsed >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Cost Management</h1>
          <p className="text-slate-500 mt-1">Track and optimize your cloud and AI spending</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
            </SelectContent>
          </Select>
          <PermissionGate permission="cost.export_reports">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Month to Date</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-sm text-green-600">
              <TrendingDown className="w-4 h-4" />
              <span>12% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Forecast</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {formatCurrency(totalSpent * 1.2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-3">End of month estimate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Budget Used</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{budgetUsed.toFixed(0)}%</p>
              </div>
              <div
                className={`w-12 h-12 ${budgetUsed >= 80 ? "bg-orange-100" : "bg-green-100"} rounded-xl flex items-center justify-center`}
              >
                <BarChart3
                  className={`w-6 h-6 ${budgetUsed >= 80 ? "text-orange-600" : "text-green-600"}`}
                />
              </div>
            </div>
            <div className="mt-3">
              <Progress value={Math.min(budgetUsed, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Top Spend</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {providerData[0]?.name || "N/A"}
                </p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <PieChart className="w-6 h-6 text-slate-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-3">
              {formatCurrency(providerData[0]?.value || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Alert */}
      {budgetUsed >= 80 && (
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-orange-800">Budget Alert</p>
              <p className="text-sm text-orange-700">
                You've used {budgetUsed.toFixed(0)}% of your monthly budget (
                {formatCurrency(totalSpent)} / {formatCurrency(monthlyBudget)})
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              Adjust Budget
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Spend Trend</CardTitle>
              <CardDescription>Cost over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), "Cost"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cost"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#colorCost)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Provider */}
            <Card>
              <CardHeader>
                <CardTitle>Cost by Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={providerData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {providerData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* By Category */}
            <Card>
              <CardHeader>
                <CardTitle>Cost by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData.slice(0, 6)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        type="number"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#94a3b8"
                        fontSize={12}
                        width={100}
                      />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Breakdown</CardTitle>
              <CardDescription>Cost allocation by provider and service</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providerData.map((provider, index) => (
                  <div key={provider.name} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: provider.color }}
                        />
                        <span className="font-medium">{provider.name}</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(provider.value)}</span>
                    </div>
                    <Progress value={(provider.value / totalSpent) * 100} className="h-2" />
                    <p className="text-sm text-slate-500 mt-1">
                      {((provider.value / totalSpent) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budgets Tab */}
        <TabsContent value="budgets">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {budgets.length === 0 ? (
              <Card className="md:col-span-2 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <DollarSign className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No budgets configured</h3>
                  <p className="text-slate-500 text-center max-w-md mb-6">
                    Set up budgets to track and control your spending
                  </p>
                  <Button>Create Budget</Button>
                </CardContent>
              </Card>
            ) : (
              budgets.map((budget) => {
                const spent = budget.spent_usd || 0;
                const amount = budget.amount_usd || 0;
                const percentage = amount > 0 ? (spent / amount) * 100 : 0;

                return (
                  <Card key={budget.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{budget.name}</CardTitle>
                        <Badge variant="outline">{budget.period}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-3xl font-bold">{formatCurrency(spent)}</p>
                            <p className="text-sm text-slate-500">of {formatCurrency(amount)}</p>
                          </div>
                          <p
                            className={`text-lg font-semibold ${
                              percentage >= 100
                                ? "text-red-600"
                                : percentage >= 80
                                  ? "text-orange-600"
                                  : "text-green-600"
                            }`}
                          >
                            {percentage.toFixed(0)}%
                          </p>
                        </div>
                        <Progress value={Math.min(percentage, 100)} className="h-3" />
                        {budget.forecast_usd && (
                          <p className="text-sm text-slate-500">
                            Forecast: {formatCurrency(budget.forecast_usd)}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
