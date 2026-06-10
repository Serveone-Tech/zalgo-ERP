import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardList,
  Plus,
  Loader2,
  Trash2,
  Eye,
  BarChart3,
  CheckCircle2,
  XCircle,
  Send,
  Clock,
  Users,
  Trophy,
  Edit2,
  ChevronDown,
  ChevronUp,
  Minus,
  Sparkles,
  PenLine,
  Globe,
  Lock,
  MonitorCheck,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Question {
  id: number;
  examId: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string | null;
  orderIndex: number;
}

const SUPPORTED_LANGUAGES = [
  { code: "English",  flag: "🇬🇧" },
  { code: "Hindi",    flag: "🇮🇳" },
  { code: "Hinglish", flag: "🇮🇳" },
  { code: "Gujarati", flag: "🇮🇳" },
  { code: "Marathi",  flag: "🇮🇳" },
  { code: "Bengali",  flag: "🇮🇳" },
  { code: "Tamil",    flag: "🇮🇳" },
  { code: "Telugu",   flag: "🇮🇳" },
  { code: "Kannada",  flag: "🇮🇳" },
  { code: "Urdu",     flag: "🇵🇰" },
  { code: "Punjabi",  flag: "🇮🇳" },
  { code: "Sanskrit", flag: "🇮🇳" },
];

interface OnlineExam {
  id: number;
  title: string;
  topic: string;
  description: string | null;
  language: string;
  durationMinutes: number;
  totalQuestions: number;
  marksPerQuestion: number;
  negativeMarking: boolean;
  negativeMarkValue: string;
  passingPercent: number;
  status: string;
  scheduledAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  questions?: Question[];
}

interface AttemptResult {
  attemptId: number;
  studentId: number;
  studentName: string;
  enrollmentNo: string;
  status: string;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  startedAt: string;
  submittedAt: string | null;
  timeSpentSeconds: number | null;
}

const api = async (url: string, opts?: RequestInit) => {
  const r = await fetch(url, { credentials: "include", ...opts });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.message || "Request failed");
  }
  if (r.status === 204) return {};
  return r.json();
};

// ── Blank question form ────────────────────────────────────────────────────────
const blankQ = () => ({
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: "A",
  explanation: "",
});

// ── Question Form (shared for Add / Edit) ─────────────────────────────────────
function QuestionForm({
  value,
  onChange,
  onSave,
  onCancel,
  saving,
  title,
}: {
  value: ReturnType<typeof blankQ>;
  onChange: (v: ReturnType<typeof blankQ>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  title: string;
}) {
  const set = (k: keyof ReturnType<typeof blankQ>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...value, [k]: e.target.value });

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">{title}</p>
      <div>
        <Label className="text-xs">Question *</Label>
        <Textarea
          value={value.question}
          onChange={set("question")}
          className="rounded-xl mt-1"
          rows={3}
          placeholder="Type the question here..."
        />
      </div>
      {(["A", "B", "C", "D"] as const).map((opt) => (
        <div key={opt}>
          <Label className="text-xs">Option {opt} *</Label>
          <Input
            value={value[`option${opt}` as keyof typeof value] as string}
            onChange={set(`option${opt}` as any)}
            className="rounded-xl mt-1"
            placeholder={`Enter option ${opt}`}
          />
        </div>
      ))}
      <div>
        <Label className="text-xs">Correct Option *</Label>
        <div className="flex gap-2 mt-1">
          {(["A", "B", "C", "D"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange({ ...value, correctOption: opt })}
              className={`w-12 h-10 rounded-xl font-bold text-sm border-2 transition-colors ${
                value.correctOption === opt
                  ? "bg-green-500 text-white border-green-500"
                  : "border-border hover:bg-muted"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-xs">Explanation (optional)</Label>
        <Textarea
          value={value.explanation}
          onChange={set("explanation")}
          className="rounded-xl mt-1"
          rows={2}
          placeholder="Why is this the correct answer?"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={saving || !value.question || !value.optionA || !value.optionB || !value.optionC || !value.optionD}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Question"}
        </Button>
      </div>
    </div>
  );
}

// ── Create Exam Dialog ─────────────────────────────────────────────────────────
function CreateExamDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (exam: OnlineExam) => void;
}) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [form, setForm] = useState({
    title: "",
    topic: "",
    description: "",
    language: "English",
    durationMinutes: 60,
    totalQuestions: 10,
    marksPerQuestion: 4,
    negativeMarking: false,
    negativeMarkValue: "1",
    passingPercent: 40,
    scheduledAt: "",
    expiresAt: "",
  });
  const [generating, setGenerating] = useState(false);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.topic.trim()) {
      toast({ title: "Title and Topic are required", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const exam = await api("/api/online-exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, mode }),
      });
      if (mode === "ai") {
        toast({ title: `Exam created! ${exam.questions?.length ?? 0} questions generated` });
      } else {
        toast({ title: "Exam created! Add questions manually." });
      }
      onCreated(exam);
      onClose();
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Create Online Exam
          </DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              mode === "ai" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            AI Auto-Generate
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              mode === "manual" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PenLine className="w-4 h-4" />
            Add Manually
          </button>
        </div>

        {mode === "ai" ? (
          <p className="text-xs text-muted-foreground -mt-1">
            AI will generate {form.totalQuestions} MCQ questions from your topic automatically.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground -mt-1">
            Exam will be created first, then you can add questions one by one.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Exam Title *</Label>
              <Input value={form.title} onChange={set("title")} placeholder="e.g. Physics Unit Test — Mechanics" className="rounded-xl" required />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>{mode === "ai" ? "Topic * (AI generates questions from this)" : "Topic *"}</Label>
              <Input value={form.topic} onChange={set("topic")} placeholder="e.g. Newton's Laws of Motion, Class 11 Physics" className="rounded-xl" required />
            </div>

            {/* Language selector */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" />
                Exam Language
                {mode === "ai" && <span className="text-xs text-muted-foreground font-normal">(AI generates questions in this language)</span>}
              </Label>
              <Select value={form.language} onValueChange={(v) => setForm((f) => ({ ...f, language: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.flag} {l.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={set("description")} placeholder="Optional instructions..." className="rounded-xl resize-none" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (minutes)</Label>
              <Input type="number" min={5} max={300} value={form.durationMinutes} onChange={set("durationMinutes")} className="rounded-xl" />
            </div>
            {mode === "ai" && (
              <div className="space-y-1.5">
                <Label>Total Questions (AI will generate this many)</Label>
                <Input type="number" min={1} max={50} value={form.totalQuestions} onChange={set("totalQuestions")} className="rounded-xl" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Marks per Question</Label>
              <Input type="number" min={1} max={20} value={form.marksPerQuestion} onChange={set("marksPerQuestion")} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Passing Percentage (%)</Label>
              <Input type="number" min={0} max={100} value={form.passingPercent} onChange={set("passingPercent")} className="rounded-xl" />
            </div>

            {/* Negative Marking */}
            <div className="md:col-span-2 rounded-xl border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Negative Marking</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Deduct marks for wrong answers</p>
                </div>
                <Switch
                  checked={form.negativeMarking}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, negativeMarking: v }))}
                />
              </div>
              {form.negativeMarking && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Marks deducted per wrong answer</Label>
                  <Input
                    type="number"
                    min={0.25}
                    max={form.marksPerQuestion}
                    step={0.25}
                    value={form.negativeMarkValue}
                    onChange={set("negativeMarkValue")}
                    className="rounded-xl max-w-[160px]"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Scheduled From</Label>
              <Input type="datetime-local" value={form.scheduledAt} onChange={set("scheduledAt")} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Expires At</Label>
              <Input type="datetime-local" value={form.expiresAt} onChange={set("expiresAt")} className="rounded-xl" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={generating} className="gap-2">
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{mode === "ai" ? "Generating Questions..." : "Creating..."}</>
              ) : mode === "ai" ? (
                <><Sparkles className="w-4 h-4" />Create & AI Generate</>
              ) : (
                <><PenLine className="w-4 h-4" />Create Exam</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Exam Detail Dialog (questions + publish) ───────────────────────────────────
function ExamDetailDialog({
  examId,
  open,
  onClose,
  onUpdated,
}: {
  examId: number | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editingQ, setEditingQ] = useState<Question | null>(null);
  const [editForm, setEditForm] = useState<ReturnType<typeof blankQ>>(blankQ());
  const [addingQ, setAddingQ] = useState(false);
  const [addForm, setAddForm] = useState<ReturnType<typeof blankQ>>(blankQ());
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const { data: exam, isLoading } = useQuery<OnlineExam>({
    queryKey: ["/api/online-exams", examId],
    queryFn: () => api(`/api/online-exams/${examId}`),
    enabled: !!examId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["/api/online-exams", examId] });
    onUpdated();
  };

  const publishMut = useMutation({
    mutationFn: () => api(`/api/online-exams/${examId}/publish`, { method: "POST" }),
    onSuccess: () => { toast({ title: "Exam published! Students can now see it." }); invalidate(); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const unpublishMut = useMutation({
    mutationFn: () => api(`/api/online-exams/${examId}/unpublish`, { method: "POST" }),
    onSuccess: () => { toast({ title: "Exam moved back to draft" }); invalidate(); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const regenMut = useMutation({
    mutationFn: () => api(`/api/online-exams/${examId}/regenerate`, { method: "POST" }),
    onSuccess: () => { toast({ title: "Questions regenerated by AI!" }); qc.invalidateQueries({ queryKey: ["/api/online-exams", examId] }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const saveQMut = useMutation({
    mutationFn: (q: Partial<Question>) =>
      api(`/api/online-exams/${examId}/questions/${q.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(q),
      }),
    onSuccess: () => { toast({ title: "Question updated" }); setEditingQ(null); qc.invalidateQueries({ queryKey: ["/api/online-exams", examId] }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const addQMut = useMutation({
    mutationFn: (q: ReturnType<typeof blankQ>) =>
      api(`/api/online-exams/${examId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(q),
      }),
    onSuccess: () => {
      toast({ title: "Question added" });
      setAddingQ(false);
      setAddForm(blankQ());
      qc.invalidateQueries({ queryKey: ["/api/online-exams", examId] });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteQMut = useMutation({
    mutationFn: (qid: number) =>
      api(`/api/online-exams/${examId}/questions/${qid}`, { method: "DELETE" }),
    onSuccess: () => { toast({ title: "Question deleted" }); qc.invalidateQueries({ queryKey: ["/api/online-exams", examId] }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  if (!examId) return null;

  const optLabel: Record<string, keyof Question> = {
    A: "optionA", B: "optionB", C: "optionC", D: "optionD",
  };

  const optBgColor: Record<string, string> = {
    A: "bg-blue-50 border-blue-200 text-blue-800",
    B: "bg-purple-50 border-purple-200 text-purple-800",
    C: "bg-orange-50 border-orange-200 text-orange-800",
    D: "bg-pink-50 border-pink-200 text-pink-800",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            {exam?.title ?? "Loading..."}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : exam ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div className="rounded-xl border p-3 text-center">
                <p className="text-2xl font-bold text-primary">{exam.questions?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Questions</p>
              </div>
              <div className="rounded-xl border p-3 text-center">
                <p className="text-2xl font-bold">{exam.durationMinutes}m</p>
                <p className="text-xs text-muted-foreground mt-0.5">Duration</p>
              </div>
              <div className="rounded-xl border p-3 text-center">
                <p className="text-2xl font-bold">{(exam.questions?.length ?? 0) * exam.marksPerQuestion}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total Marks</p>
              </div>
              <div className="rounded-xl border p-3 text-center">
                <p className="text-lg font-bold text-blue-600 flex items-center justify-center gap-1">
                  <Globe className="w-4 h-4" />{exam.language ?? "English"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Language</p>
              </div>
            </div>

            {exam.negativeMarking && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                <Minus className="w-4 h-4 shrink-0" />
                Negative marking: <strong>{exam.negativeMarkValue} mark</strong> deducted per wrong answer
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {exam.status === "draft" ? (
                <Button onClick={() => publishMut.mutate()} disabled={publishMut.isPending || (exam.questions?.length ?? 0) === 0} className="gap-1.5">
                  {publishMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publish Exam
                </Button>
              ) : (
                <Button variant="outline" onClick={() => unpublishMut.mutate()} disabled={unpublishMut.isPending} className="gap-1.5">
                  {unpublishMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Unpublish
                </Button>
              )}
              <Button variant="outline" onClick={() => regenMut.mutate()} disabled={regenMut.isPending} className="gap-1.5">
                {regenMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                AI Regenerate
              </Button>
              <Button variant="outline" onClick={() => { setAddingQ(true); setAddForm(blankQ()); }} className="gap-1.5">
                <Plus className="w-4 h-4" />Add Question
              </Button>
            </div>

            {/* Add Question Form */}
            {addingQ && (
              <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
                <QuestionForm
                  title={`Add Question ${(exam.questions?.length ?? 0) + 1}`}
                  value={addForm}
                  onChange={setAddForm}
                  onSave={() => addQMut.mutate(addForm)}
                  onCancel={() => { setAddingQ(false); setAddForm(blankQ()); }}
                  saving={addQMut.isPending}
                />
              </div>
            )}

            {/* Questions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Questions ({exam.questions?.length ?? 0})</p>
              </div>

              {(exam.questions?.length ?? 0) === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>No questions yet</p>
                  <p className="text-xs mt-1">Click "Add Question" or "AI Regenerate" to add questions</p>
                </div>
              ) : (
                (exam.questions ?? []).map((q, idx) => (
                  <div key={q.id} className="rounded-xl border overflow-hidden">
                    {/* Question header */}
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/40 select-none"
                      onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                    >
                      <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="flex-1 text-sm line-clamp-1">{q.question}</p>
                      <Badge variant="outline" className="text-xs bg-green-50 border-green-300 text-green-700 shrink-0">
                        {q.correctOption}
                      </Badge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingQ(q);
                          setEditForm({
                            question: q.question,
                            optionA: q.optionA,
                            optionB: q.optionB,
                            optionC: q.optionC,
                            optionD: q.optionD,
                            correctOption: q.correctOption,
                            explanation: q.explanation ?? "",
                          });
                        }}
                        className="p-1 hover:bg-muted rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this question?")) deleteQMut.mutate(q.id);
                        }}
                        className="p-1 hover:bg-red-50 hover:text-red-500 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      {expandedQ === q.id
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      }
                    </div>

                    {/* Expanded options */}
                    {expandedQ === q.id && (
                      <div className="px-4 pb-4 pt-1 border-t bg-muted/10 space-y-1.5">
                        {(["A", "B", "C", "D"] as const).map((opt) => {
                          const isCorrect = q.correctOption === opt;
                          return (
                            <div
                              key={opt}
                              className={`flex items-start gap-2 p-2.5 rounded-lg text-sm border ${
                                isCorrect
                                  ? "bg-green-50 border-green-200 font-medium"
                                  : `${optBgColor[opt]} border-opacity-50`
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${isCorrect ? "bg-green-500 text-white" : "bg-white/70 text-current"}`}>
                                {opt}
                              </span>
                              <span className="flex-1">{q[optLabel[opt]] as string}</span>
                              {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />}
                            </div>
                          );
                        })}
                        {q.explanation && (
                          <p className="text-xs text-muted-foreground mt-1 italic pl-1">
                            Explanation: {q.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        {/* Edit Question Dialog */}
        {editingQ && (
          <Dialog open={true} onOpenChange={() => setEditingQ(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Question {(exam?.questions?.findIndex((q) => q.id === editingQ.id) ?? 0) + 1}</DialogTitle>
              </DialogHeader>
              <QuestionForm
                title=""
                value={editForm}
                onChange={setEditForm}
                onSave={() => saveQMut.mutate({ ...editingQ, ...editForm })}
                onCancel={() => setEditingQ(null)}
                saving={saveQMut.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Results Dialog ──────────────────────────────────────────────────────────────
function ResultsDialog({
  examId,
  examTitle,
  open,
  onClose,
}: {
  examId: number | null;
  examTitle: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data: results = [], isLoading } = useQuery<AttemptResult[]>({
    queryKey: ["/api/online-exams", examId, "results"],
    queryFn: () => api(`/api/online-exams/${examId}/results`),
    enabled: !!examId,
  });

  const submitted = results.filter((r) => r.status !== "in_progress");
  const passed = submitted.filter((r) => r.passed).length;
  const avg =
    submitted.length > 0
      ? Math.round(submitted.reduce((s, r) => s + (r.percentage ?? 0), 0) / submitted.length)
      : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Results — {examTitle}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border p-3 text-center">
                <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-2xl font-bold">{submitted.length}</p>
                <p className="text-xs text-muted-foreground">Attempted</p>
              </div>
              <div className="rounded-xl border p-3 text-center">
                <Trophy className="w-4 h-4 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-600">{passed}</p>
                <p className="text-xs text-muted-foreground">Passed</p>
              </div>
              <div className="rounded-xl border p-3 text-center">
                <BarChart3 className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-600">{avg}%</p>
                <p className="text-xs text-muted-foreground">Avg Score</p>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No attempts yet</div>
            ) : (
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Enrollment</TableHead>
                      <TableHead className="text-right">Marks</TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Time Spent</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r) => (
                      <TableRow key={r.attemptId}>
                        <TableCell className="font-medium">{r.studentName}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{r.enrollmentNo}</TableCell>
                        <TableCell className="text-right">
                          {r.status === "in_progress" ? "—" : `${r.obtainedMarks ?? 0}/${r.totalMarks ?? 0}`}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {r.status === "in_progress" ? "—" : `${r.percentage ?? 0}%`}
                        </TableCell>
                        <TableCell>
                          {r.status === "in_progress" ? (
                            <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300">In Progress</Badge>
                          ) : r.passed ? (
                            <Badge className="bg-green-100 text-green-700 border-0">
                              <CheckCircle2 className="w-3 h-3 mr-1" />Pass
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-0">
                              <XCircle className="w-3 h-3 mr-1" />Fail
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {r.timeSpentSeconds
                            ? `${Math.floor(r.timeSpentSeconds / 60)}m ${r.timeSpentSeconds % 60}s`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.submittedAt ? format(new Date(r.submittedAt), "dd MMM, HH:mm") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Premium Gate ───────────────────────────────────────────────────────────────
function PremiumGate() {
  const [, navigate] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="max-w-lg w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <MonitorCheck className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow">
              <Lock className="w-4 h-4 text-amber-900" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Online Exams</h1>
        <p className="text-muted-foreground mb-8">
          Create AI-powered online exams with auto-grading, negative marking, and real-time results
          — all accessible directly from the student portal.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
          {[
            { icon: Sparkles, title: "AI Question Generation", desc: "Auto-generate MCQs from any topic" },
            { icon: Clock, title: "Auto-Submit Timer", desc: "Countdown timer with auto-submit" },
            { icon: BarChart3, title: "Instant Results", desc: "Auto-graded with detailed breakdown" },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-muted/40 p-4">
              <f.icon className="w-5 h-5 text-violet-500 mb-2" />
              <p className="font-medium text-sm">{f.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Dashboard
          </Button>
          <Button
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
            onClick={() => navigate("/pricing")}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Unlock
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function OnlineExamsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { canUseModule } = useAuth();
  if (!canUseModule("online_exams")) return <PremiumGate />;
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [resultsExam, setResultsExam] = useState<{ id: number; title: string } | null>(null);

  const { data: exams = [], isLoading } = useQuery<OnlineExam[]>({
    queryKey: ["/api/online-exams"],
    queryFn: () => api("/api/online-exams"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api(`/api/online-exams/${id}`, { method: "DELETE" }).catch(() => ({})),
    onSuccess: () => { toast({ title: "Exam deleted" }); qc.invalidateQueries({ queryKey: ["/api/online-exams"] }); },
  });

  const statusColor: Record<string, string> = {
    draft: "bg-amber-50 text-amber-700 border-amber-300",
    published: "bg-green-50 text-green-700 border-green-300",
    completed: "bg-blue-50 text-blue-700 border-blue-300",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Online Exams
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create AI-powered or manual exams, publish for students, track results
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Exam
        </Button>
      </div>

      {exams.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total", value: exams.length, color: "text-foreground" },
            { label: "Published", value: exams.filter((e) => e.status === "published").length, color: "text-green-600" },
            { label: "Draft", value: exams.filter((e) => e.status === "draft").length, color: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label} className="rounded-2xl border-border/50">
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <ClipboardList className="w-12 h-12 opacity-20" />
          <p className="font-medium">No exams yet</p>
          <p className="text-sm">Use AI to auto-generate questions or add them manually</p>
          <Button variant="outline" onClick={() => setCreateOpen(true)} className="mt-2 gap-2">
            <Plus className="w-4 h-4" />Create First Exam
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exams.map((exam) => (
            <Card key={exam.id} className="rounded-2xl border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{exam.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{exam.topic}</p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-xs ${statusColor[exam.status] ?? ""}`}>
                    {exam.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exam.durationMinutes}m</span>
                  <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3" />{exam.totalQuestions} Qs</span>
                  <span>{exam.totalQuestions * exam.marksPerQuestion} marks</span>
                  {exam.negativeMarking && (
                    <span className="flex items-center gap-0.5 text-amber-600"><Minus className="w-3 h-3" />{exam.negativeMarkValue}</span>
                  )}
                  <span className="flex items-center gap-1 text-blue-600">
                    <Globe className="w-3 h-3" />
                    {exam.language ?? "English"}
                  </span>
                </div>

                {(exam.scheduledAt || exam.expiresAt) && (
                  <p className="text-xs text-muted-foreground">
                    {exam.scheduledAt && `From ${format(new Date(exam.scheduledAt), "dd MMM HH:mm")} `}
                    {exam.expiresAt && `· Expires ${format(new Date(exam.expiresAt), "dd MMM HH:mm")}`}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => setDetailId(exam.id)}>
                    <Eye className="w-3.5 h-3.5" />Questions
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => setResultsExam({ id: exam.id, title: exam.title })}>
                    <BarChart3 className="w-3.5 h-3.5" />Results
                  </Button>
                  <button
                    onClick={() => { if (confirm("Delete this exam?")) deleteMut.mutate(exam.id); }}
                    className="p-2 rounded-lg border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateExamDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(exam) => {
          qc.invalidateQueries({ queryKey: ["/api/online-exams"] });
          // Auto-open detail if manual mode (no questions yet)
          if (!exam.questions?.length) setDetailId(exam.id);
        }}
      />

      <ExamDetailDialog
        examId={detailId}
        open={detailId !== null}
        onClose={() => setDetailId(null)}
        onUpdated={() => qc.invalidateQueries({ queryKey: ["/api/online-exams"] })}
      />

      <ResultsDialog
        examId={resultsExam?.id ?? null}
        examTitle={resultsExam?.title ?? ""}
        open={resultsExam !== null}
        onClose={() => setResultsExam(null)}
      />
    </div>
  );
}
