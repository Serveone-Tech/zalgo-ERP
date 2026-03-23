import { useState, useRef } from "react";
import {
  useStudents,
  useCreateStudent,
  useDeleteStudent,
} from "@/hooks/use-students";
import { BranchSelect, parseBranchId } from "@/components/branch-select";
import { useBranches } from "@/hooks/use-branches";
import { useCourses } from "@/hooks/use-courses";
import { ImportDialog, type FieldDef } from "@/components/import-dialog";
import { format } from "date-fns";
import { useLocation, useSearch } from "wouter";
import {
  DateFilter,
  DateFilterValue,
  filterFromSearch,
  buildApiParams,
} from "@/components/date-filter";
import { usePermission } from "@/hooks/use-permission";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, User, Camera, Upload, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBranch } from "@/contexts/branch";
import type { Course, Student } from "@shared/schema";

const STUDENT_FIELDS: FieldDef[] = [
  {
    key: "name",
    label: "Student Name",
    required: true,
    sample: "Priya Sharma",
  },
  {
    key: "enrollmentNo",
    label: "Enrollment No",
    required: true,
    sample: "BSC2026-001",
  },
  { key: "email", label: "Email", sample: "priya@example.com" },
  { key: "phone", label: "Mobile", required: true, sample: "9123456789" },
  { key: "parentName", label: "Parent Name", sample: "Ramesh Sharma" },
  { key: "parentPhone", label: "Parent Mobile", sample: "9988776655" },
  { key: "address", label: "Address", sample: "123, Model Town, Delhi" },
  { key: "courseInterested", label: "Course", sample: "JEE Main & Advanced" },
];

export default function StudentsPage() {
  const searchStr = useSearch();
  const { canWrite, canDelete } = usePermission("students");
  const { selectedBranchId } = useBranch();
  const [filter, setFilter] = useState<DateFilterValue>(() =>
    filterFromSearch(searchStr),
  );
  const apiParams = buildApiParams(filter);

  const queryParams = {
    ...(apiParams
      ? Object.fromEntries(new URLSearchParams(apiParams.slice(1)))
      : {}),
    ...(selectedBranchId ? { branchId: String(selectedBranchId) } : {}),
  };

  const { data: students, isLoading } = useStudents(
    Object.keys(queryParams).length ? queryParams : undefined,
  );

  const createStudent = useCreateStudent();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const deleteMutation = useDeleteStudent();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { data: branches = [] } = useBranches();
  const { data: courses = [] } = useCourses();

  const getBranchName = (id: number | null | undefined) =>
    branches.find((b) => b.id === id)?.name ?? "—";

  const handleBulkImport = async (rows: Record<string, string>[]) => {
    let success = 0;
    let failed = 0;
    for (const row of rows) {
      try {
        await new Promise<void>((resolve) => {
          createStudent.mutate(
            {
              name: row.name || "",
              enrollmentNo:
                row.enrollmentNo ||
                `BSC-${Date.now()}-${Math.floor(Math.random() * 999)}`,
              email: row.email || "",
              phone: row.phone || "",
              parentName: row.parentName || "",
              parentPhone: row.parentPhone || "",
              address: row.address || "",
              courseInterested: row.courseInterested || null,
              status: "Active",
            },
            {
              onSuccess: () => {
                success++;
                resolve();
              },
              onError: () => {
                failed++;
                resolve();
              },
            },
          );
        });
      } catch {
        failed++;
      }
    }
    return { success, failed };
  };

  const filtered = students?.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to remove this student?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast({ title: "Student removed" }),
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Students
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage enrolled students
          </p>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3 flex-wrap">
          <DateFilter value={filter} onChange={setFilter} />
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or reg no..."
              className="pl-9 bg-card border-border/50 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {canWrite && (
            <ImportDialog
              entityName="Students"
              fields={STUDENT_FIELDS}
              onImport={handleBulkImport}
            />
          )}

          {canWrite && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-md shadow-primary/20">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display">
                    Register Student
                  </DialogTitle>
                </DialogHeader>
                <StudentForm
                  courses={courses}
                  onSuccess={() => setIsAddOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold w-[100px]">Reg No</TableHead>
              <TableHead className="font-semibold">Student</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Course</TableHead>
              <TableHead className="font-semibold">Branch</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Joined</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              filtered?.map((student) => (
                <TableRow key={student.id} className="hover:bg-accent/30">
                  <TableCell className="font-medium text-xs text-muted-foreground">
                    {student.enrollmentNo}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={student.profilePicture || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{student.phone}</div>
                    <div className="text-xs text-muted-foreground">
                      E: {student.email || "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      P: {student.parentName} ({student.parentPhone})
                    </div>
                  </TableCell>
                  {/* ── Course column — ab student.courseInterested directly available hai ── */}
                  <TableCell className="text-sm text-muted-foreground">
                    {student.courseInterested || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getBranchName(student.branchId)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-emerald-200 text-emerald-700 bg-emerald-50"
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {student.createdAt
                      ? format(new Date(student.createdAt), "MMM d, yyyy")
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-lg text-muted-foreground hover:text-primary"
                        onClick={() => navigate(`/students/${student.id}`)}
                        data-testid={`btn-view-student-${student.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => handleDelete(student.id)}
                          data-testid={`btn-delete-student-${student.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StudentForm({
  courses,
  onSuccess,
}: {
  courses: Course[];
  onSuccess: () => void;
}) {
  const createMutation = useCreateStudent();
  const { toast } = useToast();
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [courseInterested, setCourseInterested] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast({
        title: "Camera Error",
        description: "Could not access camera",
        variant: "destructive",
      });
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        setProfilePic(canvasRef.current.toDataURL("image/jpeg"));
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((t) => t.stop());
    }
    setShowCamera(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePic(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate(
      {
        enrollmentNo: `BSC${Math.floor(1000 + Math.random() * 9000)}`,
        name: fd.get("name") as string,
        email: (fd.get("email") as string) || null,
        phone: fd.get("phone") as string,
        parentName: fd.get("parentName") as string,
        parentPhone: fd.get("parentPhone") as string,
        address: (fd.get("address") as string) || null,
        profilePicture: profilePic,
        status: "Active",
        branchId: parseBranchId(branchId),
        courseInterested: courseInterested || null, // ✅ ab payload mein jayega
      },
      {
        onSuccess: () => {
          toast({ title: "Student registered successfully" });
          onSuccess();
        },
      },
    );
  };

  const activeCourses = courses.filter((c) => c.status === "Active");

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
      <div className="flex flex-col items-center gap-4 mb-6">
        <Avatar className="w-24 h-24 border-2 border-primary/20">
          <AvatarImage src={profilePic || ""} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            <User className="w-12 h-12" />
          </AvatarFallback>
        </Avatar>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startCamera}
            className="rounded-lg"
          >
            <Camera className="w-4 h-4 mr-2" /> Capture
          </Button>
          <div className="relative">
            <Input
              type="file"
              accept="image/*"
              className="hidden"
              id="pic-upload"
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("pic-upload")?.click()}
              className="rounded-lg"
            >
              <Upload className="w-4 h-4 mr-2" /> Upload
            </Button>
          </div>
        </div>
      </div>

      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
          <video
            ref={videoRef}
            autoPlay
            className="max-w-full rounded-2xl bg-black"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-4 mt-6">
            <Button
              type="button"
              onClick={capturePhoto}
              className="rounded-full w-16 h-16 p-0 bg-white hover:bg-white/90"
            >
              <div className="w-12 h-12 rounded-full border-4 border-primary" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={stopCamera}
              className="rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input id="name" name="name" required className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Student Phone *</Label>
          <Input id="phone" name="phone" required className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" name="email" type="email" className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentName">Parent Name *</Label>
          <Input
            id="parentName"
            name="parentName"
            required
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentPhone">Parent Phone *</Label>
          <Input
            id="parentPhone"
            name="parentPhone"
            required
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" className="rounded-xl" />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Course Interested</Label>
          <Select value={courseInterested} onValueChange={setCourseInterested}>
            <SelectTrigger
              data-testid="select-courseInterested"
              className="rounded-xl"
            >
              <SelectValue placeholder="Select a course..." />
            </SelectTrigger>
            <SelectContent>
              {activeCourses.length > 0 ? (
                activeCourses.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="_none" disabled>
                  No active courses available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2">
          <BranchSelect value={branchId} onChange={setBranchId} />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full rounded-xl mt-2"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? "Registering..." : "Register Student"}
      </Button>
    </form>
  );
}
