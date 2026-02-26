import { useState } from "react";
import { useCourses, useCreateCourse, useDeleteCourse } from "@/hooks/use-courses";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, BookOpen, Trash2 } from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function CoursesPage() {
  const { data: courses, isLoading } = useCourses();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const deleteMutation = useDeleteCourse();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    if(confirm("Are you sure you want to delete this course?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast({ title: "Course deleted" })
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Courses & Batches</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage institute offerings</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-md shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">Create Course</DialogTitle>
            </DialogHeader>
            <CourseForm onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-muted-foreground">Loading courses...</p>
        ) : courses?.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-card rounded-2xl border border-border border-dashed">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">No courses defined yet.</p>
          </div>
        ) : (
          courses?.map((course) => (
            <div key={course.id} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-1">{course.name}</h3>
              <p className="text-muted-foreground text-sm mb-4 line-clamp-2 min-h-[40px]">{course.description || "No description provided."}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Duration</p>
                  <p className="text-sm font-medium">{course.duration}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Fee</p>
                  <p className="text-sm font-bold text-primary">₹{course.fee.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg h-8 w-8"
                onClick={() => handleDelete(course.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CourseForm({ onSuccess }: { onSuccess: () => void }) {
  const createMutation = useCreateCourse();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      duration: formData.get("duration") as string,
      fee: Number(formData.get("fee")),
      status: "Active",
    }, {
      onSuccess: () => {
        toast({ title: "Course created successfully" });
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Course Name *</Label>
        <Input id="name" name="name" required className="rounded-xl" placeholder="e.g. Class 11 PCM Batch" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" className="rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration *</Label>
          <Input id="duration" name="duration" required className="rounded-xl" placeholder="e.g. 1 Year" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fee">Total Fee (₹) *</Label>
          <Input id="fee" name="fee" type="number" required className="rounded-xl" min="0" />
        </div>
      </div>
      <Button type="submit" className="w-full rounded-xl mt-4" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Creating..." : "Create Course"}
      </Button>
    </form>
  );
}
