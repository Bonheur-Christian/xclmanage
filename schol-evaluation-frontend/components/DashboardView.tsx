import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Download,
  FileText,
  Table,
  BarChart3,
  TrendingUp,
  Users,
  Award,
  AlertTriangle,
} from "lucide-react";

interface DashboardViewProps {
  schoolData: any;
  evaluationData: any;
}

const DashboardView = ({ schoolData, evaluationData }: DashboardViewProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Calculate metrics
  const calculateMetrics = () => {
    const roles = ["headteacher", "dos", "dod"];
    const metrics: any = {};

    roles.forEach((role) => {
      const data = evaluationData[role];
      if (data && data.responses) {
        const scores = Object.values(data.responses) as number[];
        const total = scores.reduce((sum, score) => sum + score, 0);
        const average = scores.length > 0 ? total / scores.length : 0;

        metrics[role] = {
          totalScore: total,
          averageScore: average,
          maxPossible: scores.length * 5,
          percentage: (average / 5) * 100,
          responseCount: scores.length,
          distribution: scores.reduce((acc: any, score) => {
            acc[score] = (acc[score] || 0) + 1;
            return acc;
          }, {}),
        };
      }
    });

    return metrics;
  };

  const metrics = calculateMetrics();

  // Chart data
  const overviewData = [
    {
      role: "Headteacher",
      score: metrics.headteacher?.averageScore.toFixed(1) || 0,
      percentage: metrics.headteacher?.percentage || 0,
    },
    {
      role: "DOS",
      score: metrics.dos?.averageScore.toFixed(1) || 0,
      percentage: metrics.dos?.percentage || 0,
    },
    {
      role: "DOD",
      score: metrics.dod?.averageScore.toFixed(1) || 0,
      percentage: metrics.dod?.percentage || 0,
    },
  ];

  const pieChartData = overviewData.map((item, index) => ({
    name: item.role,
    value: parseFloat(item.score),
    color: ["#3B82F6", "#10B981", "#8B5CF6"][index],
  }));

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 80)
      return {
        level: "Excellent",
        color: "bg-green-500",
        textColor: "text-green-700",
      };
    if (percentage >= 60)
      return {
        level: "Good",
        color: "bg-blue-500",
        textColor: "text-blue-700",
      };
    if (percentage >= 40)
      return {
        level: "Fair",
        color: "bg-yellow-500",
        textColor: "text-yellow-700",
      };
    return {
      level: "Needs Improvement",
      color: "bg-red-500",
      textColor: "text-red-700",
    };
  };

  const exportToPDF = () => {
    // Mock PDF export
    alert("PDF export functionality would be implemented here");
  };

  const exportToExcel = () => {
    // Mock Excel export
    console.log("Exporting to Excel...");
    alert("Excel export functionality would be implemented here");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{schoolData.schoolName}</h1>
              <p className="opacity-90">Leadership Evaluation Results</p>
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <span>{schoolData.district} District</span>
                <span>•</span>
                <span>{schoolData.status}</span>
                <span>•</span>
                <span>
                  {new Date(evaluationData.completedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={exportToPDF}
                className="bg-white/20 hover:bg-white/30"
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                onClick={exportToExcel}
                className="bg-white/20 hover:bg-white/30"
              >
                <Table className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {(
                    (metrics.headteacher?.averageScore +
                      metrics.dos?.averageScore +
                      metrics.dod?.averageScore) /
                      3 || 0
                  ).toFixed(1)}
                </div>
                <div className="text-sm text-blue-700">Overall Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {Math.max(
                    metrics.headteacher?.averageScore || 0,
                    metrics.dos?.averageScore || 0,
                    metrics.dod?.averageScore || 0,
                  ).toFixed(1)}
                </div>
                <div className="text-sm text-green-700">Highest Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-900">
                  {(
                    (metrics.headteacher?.percentage +
                      metrics.dos?.percentage +
                      metrics.dod?.percentage) /
                      3 || 0
                  ).toFixed(0)}
                  %
                </div>
                <div className="text-sm text-purple-700">Performance</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-900">
                  {Object.keys(evaluationData).length - 2}
                </div>
                <div className="text-sm text-orange-700">Leaders Evaluated</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full xl:grid-cols-4 md:grid-cols-2 grid-cols-1 ">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="recommendations">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Leadership Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={overviewData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="role" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip formatter={(value) => [`${value}/5.0`, "Score"]} />
                    <Bar dataKey="score" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {overviewData.map((item, index) => {
              const performance = getPerformanceLevel(item.percentage);
              return (
                <Card key={item.role} className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {item.score}/5.0
                      </div>
                      <div className="text-lg font-semibold text-gray-700 mb-2">
                        {item.role}
                      </div>
                      <Badge className={`${performance.color} text-white`}>
                        {performance.level}
                      </Badge>
                      <div className="mt-4">
                        <div className={`w-full bg-gray-200 rounded-full h-2`}>
                          <div
                            className={`${performance.color} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {item.percentage.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {["headteacher", "dos", "dod"].map((role) => {
              const roleData = metrics[role];
              if (!roleData) return null;

              const roleLabels = {
                headteacher: "Headteacher",
                dos: "Deputy Head (Studies)",
                dod: "Deputy Head (Discipline)",
              };

              return (
                <Card key={role} className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <CardTitle className="flex items-center justify-between">
                      <span>{roleLabels[role as keyof typeof roleLabels]}</span>
                      <Badge variant="outline">
                        {roleData.averageScore.toFixed(2)}/5.0
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {roleData.totalScore}
                        </div>
                        <div className="text-sm text-gray-600">Total Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {roleData.averageScore.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600">Average</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {roleData.responseCount}
                        </div>
                        <div className="text-sm text-gray-600">Questions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {roleData.percentage.toFixed(0)}%
                        </div>
                        <div className="text-sm text-gray-600">Performance</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700">
                        Response Distribution:
                      </h4>
                      {[0, 1, 2, 3, 4, 5].map((score) => (
                        <div
                          key={score}
                          className="flex items-center space-x-3"
                        >
                          <span className="w-16 text-sm">{score} points:</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${((roleData.distribution[score] || 0) / roleData.responseCount) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="w-12 text-sm text-gray-600">
                            {roleData.distribution[score] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Leadership Roles Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={overviewData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 5]} />
                  <YAxis dataKey="role" type="category" width={150} />
                  <Tooltip formatter={(value) => [`${value}/5.0`, "Score"]} />
                  <Bar dataKey="score" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Performance Benchmarks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {overviewData.map((item, index) => {
                  const performance = getPerformanceLevel(item.percentage);
                  return (
                    <div
                      key={item.role}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium">{item.role}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">
                          {item.score}/5.0
                        </span>
                        <Badge
                          className={`${performance.color} text-white text-xs`}
                        >
                          {performance.level}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Areas for Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overviewData
                    .sort((a, b) => a.percentage - b.percentage)
                    .map((item, index) => (
                      <div
                        key={item.role}
                        className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg"
                      >
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                          <div className="font-medium text-yellow-800">
                            {item.role}
                          </div>
                          <div className="text-sm text-yellow-700">
                            Current: {item.score}/5.0 (
                            {item.percentage.toFixed(0)}%)
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-800">Strengths</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {overviewData
                    .filter((item) => item.percentage >= 70)
                    .map((item) => (
                      <div
                        key={item.role}
                        className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg"
                      >
                        <Award className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium text-green-800">
                            {item.role}
                          </div>
                          <div className="text-sm text-green-700">
                            Strong performance at {item.score}/5.0
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-orange-200">
              <CardHeader className="bg-orange-50">
                <CardTitle className="text-orange-800">
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">
                      Professional Development
                    </h4>
                    <p className="text-sm text-blue-700">
                      Focus on leadership training for roles scoring below
                      3.5/5.0
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2">
                      Communication Enhancement
                    </h4>
                    <p className="text-sm text-purple-700">
                      Improve feedback mechanisms and regular communication
                      channels
                    </p>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h4 className="font-medium text-indigo-800 mb-2">
                      Policy Review
                    </h4>
                    <p className="text-sm text-indigo-700">
                      Review and update school policies based on evaluation
                      feedback
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center space-x-4">
        <Button
          onClick={exportToPDF}
          size="lg"
          className="bg-red-600 hover:bg-red-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export PDF Report
        </Button>
        <Button
          onClick={exportToExcel}
          size="lg"
          className="bg-green-600 hover:bg-green-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Excel Data
        </Button>
      </div>
    </div>
  );
};

export default DashboardView;
