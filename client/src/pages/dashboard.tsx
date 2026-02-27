import { useDashboardStats } from "@/hooks/use-dashboard";
import { 
  Users, 
  UserSquare2, 
  GraduationCap, 
  CreditCard,
  ArrowUpRight,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100/50 dark:bg-blue-900/20",
    },
    {
      title: "Active Enquiries",
      value: stats.activeLeads,
      icon: UserSquare2,
      color: "text-amber-600",
      bgColor: "bg-amber-100/50 dark:bg-amber-900/20",
    },
    {
      title: "Total Teachers",
      value: stats.totalTeachers,
      icon: GraduationCap,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100/50 dark:bg-emerald-900/20",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-100/50 dark:bg-purple-900/20",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">Welcome back. Here's what's happening at your institute today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-display font-bold text-foreground tracking-tight">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 border-border/50 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-card/50 pb-4">
            <CardTitle className="text-lg font-display font-bold text-foreground">Course Enrollment Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {stats.courseEnrollments?.map((course, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between">
                  <span className="font-medium text-foreground">{course.courseName}</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">{course.studentCount} Students</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-border/50 shadow-sm rounded-2xl overflow-hidden">
          {/* subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          <CardContent className="p-8 relative z-10 h-full flex flex-col justify-center">
            <GraduationCap className="w-12 h-12 mb-6 text-white/80" />
            <h3 className="text-2xl font-display font-bold mb-2 text-white">Badam Singh Classes</h3>
            <p className="text-white/80 text-sm leading-relaxed mb-8">
              Empowering students with quality education. Streamline your institute's operations with this comprehensive management system.
            </p>
            <div className="mt-auto">
              <div className="inline-flex items-center justify-center px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors cursor-pointer border border-white/10">
                Generate Reports
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
