import { useState } from "react";
import { useCourses, useCreateCourse, useDeleteCourse, useCourseStudents } from "@/hooks/use-courses";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, BookOpen, Trash2, Users, Mail, MessageSquare, Send } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@shared/routes";

export default function CoursesPage() {
  const { data: courses, isLoading } = useCourses();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
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
        
        <div className="flex gap-2">
          <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl">
                <Send className="w-4 h-4 mr-2" />
                Bulk Message
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>Send Bulk Message</DialogTitle>
              </DialogHeader>
              <MessagingForm 
                recipientType="Bulk" 
                courses={courses || []} 
                onSuccess={() => setIsBulkOpen(false)} 
              />
            </DialogContent>
          </Dialog>

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

              <div className="mt-4 pt-4 border-t border-border/40 flex justify-between">
                <Dialog open={selectedCourseId === course.id} onOpenChange={(open) => setSelectedCourseId(open ? course.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-lg">
                      <Users className="w-4 h-4 mr-2" />
                      View Students
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-3xl rounded-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-display">Enrolled Students - {course.name}</DialogTitle>
                    </DialogHeader>
                    <CourseStudentList courseId={course.id} />
                  </DialogContent>
                </Dialog>
                
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg h-8 w-8"
                  onClick={() => handleDelete(course.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CourseStudentList({ courseId }: { courseId: number }) {
  const { data: results, isLoading } = useCourseStudents(courseId);
  const [messagingTarget, setMessagingTarget] = useState<{ id: number, name: string, type: 'Student' | 'Parent' } | null>(null);

  if (isLoading) return <p className="text-muted-foreground py-8 text-center">Loading students...</p>;
  if (!results || results.length === 0) return <p className="text-muted-foreground py-8 text-center">No students enrolled in this course yet.</p>;

  return (
    <div className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map(({ student }) => (
            <TableRow key={student.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={student.profilePicture || ""} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.email || 'No Email'}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                <div>
                  <p>S: {student.phone}</p>
                  <p className="text-xs text-muted-foreground">P: {student.parentPhone}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 px-2 text-blue-600 hover:bg-blue-50"
                    onClick={() => setMessagingTarget({ id: student.id, name: student.name, type: 'Student' })}
                  >
                    Student
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 px-2 text-purple-600 hover:bg-purple-50"
                    onClick={() => setMessagingTarget({ id: student.id, name: student.parentName || student.name, type: 'Parent' })}
                  >
                    Parent
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!messagingTarget} onOpenChange={(open) => !open && setMessagingTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Send Message to {messagingTarget?.name} ({messagingTarget?.type})</DialogTitle>
          </DialogHeader>
          {messagingTarget && (
            <MessagingForm 
              recipientId={messagingTarget.id} 
              recipientType={messagingTarget.type} 
              onSuccess={() => setMessagingTarget(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MessagingForm({ recipientId, recipientType, courses, onSuccess }: { recipientId?: number, recipientType: 'Student' | 'Teacher' | 'Parent' | 'Bulk', courses?: any[], onSuccess: () => void }) {
  const { toast } = useToast();
  const [type, setType] = useState<'Email' | 'SMS' | 'WhatsApp'>('WhatsApp');
  const [isSending, setIsSending] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await fetch(api.communications.send.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId,
          recipientType,
          courseId: selectedCourse ? Number(selectedCourse) : undefined,
          type,
          subject: formData.get('subject'),
          content: formData.get('content')
        })
      });

      if (res.ok) {
        toast({ title: `Message sent via ${type}` });
        onSuccess();
      } else {
        throw new Error('Failed to send');
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="flex flex-wrap gap-2">
        <Button 
          type="button" 
          variant={type === 'WhatsApp' ? 'default' : 'outline'} 
          className="flex-1 rounded-xl"
          onClick={() => setType('WhatsApp')}
        >
          <SiWhatsapp className="w-4 h-4 mr-2" /> WhatsApp
        </Button>
        <Button 
          type="button" 
          variant={type === 'Email' ? 'default' : 'outline'} 
          className="flex-1 rounded-xl"
          onClick={() => setType('Email')}
        >
          <Mail className="w-4 h-4 mr-2" /> Email
        </Button>
        <Button 
          type="button" 
          variant={type === 'SMS' ? 'default' : 'outline'} 
          className="flex-1 rounded-xl"
          onClick={() => setType('SMS')}
        >
          <MessageSquare className="w-4 h-4 mr-2" /> SMS
        </Button>
      </div>

      {recipientType === 'Bulk' && courses && (
        <div className="space-y-2">
          <Label htmlFor="courseId">Select Course/Batch</Label>
          <select 
            id="courseId"
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            required
          >
            <option value="">Choose a course...</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {type === 'Email' && (
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" name="subject" required className="rounded-xl" placeholder="Message subject" />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="content">Message Content</Label>
        <Textarea id="content" name="content" required className="rounded-xl min-h-[120px]" placeholder="Type your message here..." />
      </div>

      <Button type="submit" className="w-full rounded-xl" disabled={isSending}>
        {isSending ? "Sending..." : "Send Message"}
      </Button>
    </form>
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
