import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trophy,
  RotateCcw,
  BookOpen,
  Send,
  Globe,
} from "lucide-react";
import { format } from "date-fns";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ExamSummary {
  id: number;
  title: string;
  language: string;
  topic: string;
  description: string | null;
  durationMinutes: number;
  totalQuestions: number;
  marksPerQuestion: number;
  negativeMarking: boolean;
  negativeMarkValue: string;
  passingPercent: number;
  scheduledAt: string | null;
  expiresAt: string | null;
  attempt: AttemptSummary | null;
}

interface AttemptSummary {
  id: number;
  status: string;
  obtainedMarks: number | null;
  totalMarks: number | null;
  percentage: number | null;
  passed: boolean | null;
  submittedAt: string | null;
}

interface Question {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  orderIndex: number;
}

interface AttemptData {
  attempt: AttemptSummary & { startedAt: string };
  questions: Question[];
  answers: Record<number, string>;
  remainingSecs: number;
  exam: ExamSummary;
}

interface ResultDetail {
  attempt: AttemptSummary & { timeSpentSeconds: number };
  breakdown: Array<Question & { correctOption: string; explanation: string | null; selected: string | null; isCorrect: boolean }>;
  correct: number;
  wrong: number;
  skipped: number;
}

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

const apiFetch = async (url: string, opts?: RequestInit) => {
  const r = await fetch(url, { credentials: "include", ...opts });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.message || "Request failed");
  }
  if (r.status === 204) return {};
  return r.json();
};

// ── Timer component ─────────────────────────────────────────────────────────────
function ExamTimer({ remainingSecs, onExpire }: { remainingSecs: number; onExpire: () => void }) {
  const [secs, setSecs] = useState(remainingSecs);
  const expiredRef = useRef(false);

  useEffect(() => {
    setSecs(remainingSecs);
    expiredRef.current = false;
  }, [remainingSecs]);

  useEffect(() => {
    if (secs <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
      return;
    }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs, onExpire]);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const isWarning = secs < 300;
  const isCritical = secs < 60;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-sm font-bold ${isCritical ? "bg-red-100 text-red-700 animate-pulse" : isWarning ? "bg-amber-100 text-amber-700" : "bg-muted text-foreground"}`}>
      <Clock className="w-3.5 h-3.5" />
      {h > 0 && `${h}:`}
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </div>
  );
}

// ── Exam Instructions Page ──────────────────────────────────────────────────────
function InstructionsView({
  exam,
  attempt,
  onStart,
  onBack,
}: {
  exam: ExamSummary;
  attempt: AttemptSummary | null;
  onStart: () => void;
  onBack: () => void;
}) {
  const totalMarks = exam.totalQuestions * exam.marksPerQuestion;
  const passingMarks = Math.ceil((totalMarks * exam.passingPercent) / 100);

  return (
    <div className="max-w-2xl mx-auto space-y-5 p-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-4 h-4" /> Back to Exams
      </button>

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold">{exam.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{exam.topic}</p>
        </div>

        {/* Exam Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Questions", value: exam.totalQuestions },
            { label: "Duration", value: `${exam.durationMinutes} min` },
            { label: "Total Marks", value: totalMarks },
            { label: "Passing Marks", value: `${passingMarks} (${exam.passingPercent}%)` },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-muted/40 p-3 text-center">
              <p className="text-lg font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
        {exam.language && (
          <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
            <Globe className="w-4 h-4 shrink-0" />
            This exam is in <strong>{exam.language}</strong>
          </div>
        )}

        {exam.description && (
          <p className="text-sm text-muted-foreground">{exam.description}</p>
        )}

        {/* Instructions */}
        <div className="rounded-xl border p-4 space-y-2">
          <p className="text-sm font-semibold">Instructions</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-primary font-medium">1.</span>The exam will begin as soon as you click "Start Exam".</li>
            <li className="flex gap-2"><span className="text-primary font-medium">2.</span>You have <strong className="text-foreground">{exam.durationMinutes} minutes</strong> to complete all {exam.totalQuestions} questions.</li>
            <li className="flex gap-2"><span className="text-primary font-medium">3.</span>Each correct answer gives <strong className="text-foreground">+{exam.marksPerQuestion} marks</strong>.</li>
            {exam.negativeMarking ? (
              <li className="flex gap-2"><span className="text-red-500 font-medium">4.</span>
                <span>Each wrong answer deducts <strong className="text-red-600">−{exam.negativeMarkValue} mark{Number(exam.negativeMarkValue) !== 1 ? "s" : ""}</strong>. Unanswered questions carry no penalty.</span>
              </li>
            ) : (
              <li className="flex gap-2"><span className="text-primary font-medium">4.</span>No negative marking — unanswered questions carry no penalty.</li>
            )}
            <li className="flex gap-2"><span className="text-primary font-medium">5.</span>The exam will auto-submit when time runs out.</li>
            <li className="flex gap-2"><span className="text-primary font-medium">6.</span>Once submitted, you cannot re-attempt the exam.</li>
          </ul>
        </div>

        {exam.negativeMarking && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>This exam has <strong>negative marking</strong>. Avoid guessing — wrong answers will reduce your score by <strong>{exam.negativeMarkValue} mark{Number(exam.negativeMarkValue) !== 1 ? "s" : ""}</strong> each.</span>
          </div>
        )}

        {attempt && attempt.status !== "in_progress" ? (
          <div className="rounded-xl bg-muted/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">You have already submitted this exam.</p>
          </div>
        ) : (
          <Button onClick={onStart} size="lg" className="w-full gap-2">
            {attempt?.status === "in_progress" ? (
              <><RotateCcw className="w-4 h-4" />Resume Exam</>
            ) : (
              <><BookOpen className="w-4 h-4" />Start Exam</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Exam Taking View ────────────────────────────────────────────────────────────
function ExamView({
  examId,
  onComplete,
}: {
  examId: number;
  onComplete: (result: ResultDetail) => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timerReady, setTimerReady] = useState(false);
  const [remainingSecs, setRemainingSecs] = useState(0);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittingRef = useRef(false);

  const { data, isLoading } = useQuery<AttemptData>({
    queryKey: ["/api/student-portal/online-exams", examId, "attempt"],
    queryFn: () => apiFetch(`/api/student-portal/online-exams/${examId}/attempt`),
  });

  useEffect(() => {
    if (data) {
      setAnswers(data.answers ?? {});
      setRemainingSecs(data.remainingSecs);
      setTimerReady(true);
    }
  }, [data]);

  const submitMut = useMutation({
    mutationFn: (autoSubmit: boolean) =>
      apiFetch(`/api/student-portal/online-exams/${examId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, autoSubmit }),
      }),
    onSuccess: (result: ResultDetail) => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
      onComplete(result);
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const saveDraft = useCallback(async (ans: Record<number, string>) => {
    try {
      await apiFetch(`/api/student-portal/online-exams/${examId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: ans }),
      });
    } catch (_) {}
  }, [examId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      saveDraft(answers);
    }, 30000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [answers, saveDraft]);

  const handleAutoExpire = useCallback(() => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    toast({ title: "Time is up! Submitting automatically..." });
    submitMut.mutate(true);
  }, [submitMut, toast]);

  const handleSelect = (qId: number, opt: string) => {
    setAnswers((prev) => {
      // Toggle off if same option selected again
      if (prev[qId] === opt) {
        const next = { ...prev };
        delete next[qId];
        return next;
      }
      return { ...prev, [qId]: opt };
    });
  };

  const handleSubmit = () => {
    if (submittingRef.current) return;
    const answered = Object.keys(answers).length;
    const total = data?.questions.length ?? 0;
    const unanswered = total - answered;
    const msg = unanswered > 0
      ? `You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Submit anyway?`
      : "Submit exam? You cannot change answers after this.";
    if (!confirm(msg)) return;
    submittingRef.current = true;
    submitMut.mutate(false);
  };

  if (isLoading)
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (!data) return null;

  const questions = data.questions;
  const currentQ = questions[currentIdx];
  if (!currentQ) return null;

  const answered = Object.keys(answers).length;
  const total = questions.length;

  // Question status colors for nav panel
  const qStatus = (q: Question, idx: number) => {
    if (idx === currentIdx) return "bg-primary text-primary-foreground";
    if (answers[q.id]) return "bg-green-500 text-white";
    return "bg-muted text-muted-foreground hover:bg-muted/80";
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="border-b bg-card px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{data.exam.title}</p>
          <p className="text-xs text-muted-foreground">{answered}/{total} answered</p>
        </div>
        {timerReady && <ExamTimer remainingSecs={remainingSecs} onExpire={handleAutoExpire} />}
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={submitMut.isPending}
          className="ml-3 gap-1.5"
        >
          {submitMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Submit
        </Button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question panel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Question number */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Question {currentIdx + 1} of {total}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  className="p-1.5 rounded-lg border hover:bg-muted disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
                  disabled={currentIdx === total - 1}
                  className="p-1.5 rounded-lg border hover:bg-muted disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Question text */}
            <div className="rounded-2xl border bg-card p-5">
              <p className="text-base font-medium leading-relaxed">{currentQ.question}</p>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {OPTION_LABELS.map((opt) => {
                const text = currentQ[`option${opt}` as keyof Question] as string;
                const selected = answers[currentQ.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelect(currentQ.id, opt)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                      selected
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                      selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {opt}
                    </span>
                    <span className="text-sm">{text}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-2">
              {currentIdx > 0 && (
                <Button variant="outline" onClick={() => setCurrentIdx((i) => i - 1)} className="gap-1.5">
                  <ChevronLeft className="w-4 h-4" />Previous
                </Button>
              )}
              {currentIdx < total - 1 && (
                <Button onClick={() => setCurrentIdx((i) => i + 1)} className="gap-1.5 ml-auto">
                  Next<ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigator panel (desktop) */}
        <div className="hidden md:flex w-52 border-l bg-muted/20 p-4 flex-col gap-3 shrink-0 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Questions</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${qStatus(q, idx)}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="mt-auto space-y-1.5 text-xs">
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-500 inline-block" /><span className="text-muted-foreground">Answered</span></div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-muted inline-block" /><span className="text-muted-foreground">Not answered</span></div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-primary inline-block" /><span className="text-muted-foreground">Current</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Result View ─────────────────────────────────────────────────────────────────
function ResultView({
  result,
  examTitle,
  onBack,
}: {
  result: ResultDetail;
  examTitle: string;
  onBack: () => void;
}) {
  const { attempt, breakdown, correct, wrong, skipped } = result;
  const [showDetail, setShowDetail] = useState(false);

  const timeStr = attempt.timeSpentSeconds
    ? `${Math.floor(attempt.timeSpentSeconds / 60)}m ${attempt.timeSpentSeconds % 60}s`
    : "—";

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5">
      {/* Result card */}
      <div className={`rounded-2xl p-6 text-center ${attempt.passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
        {attempt.passed ? (
          <Trophy className="w-12 h-12 text-green-500 mx-auto mb-3" />
        ) : (
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        )}
        <h1 className="text-2xl font-bold">{attempt.passed ? "Congratulations!" : "Better luck next time"}</h1>
        <p className="text-muted-foreground text-sm mt-1">{examTitle}</p>
        <div className="mt-4 text-5xl font-bold">{attempt.percentage}%</div>
        <p className="text-sm text-muted-foreground mt-1">
          {attempt.obtainedMarks} / {attempt.totalMarks} marks
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border p-3 text-center">
          <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-green-600">{correct}</p>
          <p className="text-xs text-muted-foreground">Correct</p>
        </div>
        <div className="rounded-xl border p-3 text-center">
          <XCircle className="w-4 h-4 text-red-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-red-500">{wrong}</p>
          <p className="text-xs text-muted-foreground">Wrong</p>
        </div>
        <div className="rounded-xl border p-3 text-center">
          <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
          <p className="text-2xl font-bold">{skipped}</p>
          <p className="text-xs text-muted-foreground">Skipped</p>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">Time spent: {timeStr}</p>

      {/* Show answer key */}
      <Button variant="outline" className="w-full" onClick={() => setShowDetail((v) => !v)}>
        {showDetail ? "Hide" : "Show"} Answer Key & Explanations
      </Button>

      {showDetail && (
        <div className="space-y-3">
          {breakdown.map((q, idx) => (
            <div key={q.id} className={`rounded-xl border p-4 space-y-2 ${q.isCorrect ? "border-green-200 bg-green-50/50" : q.selected ? "border-red-200 bg-red-50/50" : "border-border"}`}>
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-muted-foreground shrink-0 mt-0.5">Q{idx + 1}.</span>
                <p className="text-sm font-medium">{q.question}</p>
              </div>
              <div className="grid grid-cols-1 gap-1 pl-5">
                {OPTION_LABELS.map((opt) => {
                  const text = q[`option${opt}` as keyof typeof q] as string;
                  const isCorrect = opt === q.correctOption;
                  const isSelected = opt === q.selected;
                  return (
                    <div key={opt} className={`flex items-center gap-2 text-xs p-1.5 rounded-lg ${isCorrect ? "bg-green-100 text-green-800 font-semibold" : isSelected ? "bg-red-100 text-red-700" : "text-muted-foreground"}`}>
                      <span className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold bg-current/10">{opt}</span>
                      <span className="flex-1">{text}</span>
                      {isCorrect && <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0" />}
                      {isSelected && !isCorrect && <XCircle className="w-3 h-3 text-red-500 shrink-0" />}
                    </div>
                  );
                })}
              </div>
              {q.explanation && (
                <p className="pl-5 text-xs text-muted-foreground italic">{q.explanation}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" className="w-full" onClick={onBack}>Back to Exams</Button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
type View =
  | { type: "list" }
  | { type: "instructions"; exam: ExamSummary; attempt: AttemptSummary | null }
  | { type: "taking"; examId: number; examTitle: string }
  | { type: "result"; result: ResultDetail; examTitle: string };

export default function StudentOnlineExamsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [view, setView] = useState<View>({ type: "list" });

  const { data: exams = [], isLoading } = useQuery<ExamSummary[]>({
    queryKey: ["/api/student-portal/online-exams"],
    queryFn: () => apiFetch("/api/student-portal/online-exams"),
    enabled: view.type === "list",
  });

  const startMut = useMutation({
    mutationFn: (examId: number) =>
      apiFetch(`/api/student-portal/online-exams/${examId}/start`, { method: "POST" }),
    onSuccess: (_data, examId) => {
      const exam = exams.find((e) => e.id === examId)!;
      qc.invalidateQueries({ queryKey: ["/api/student-portal/online-exams", examId, "attempt"] });
      setView({ type: "taking", examId, examTitle: exam.title });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  // Full-screen exam view (no layout chrome)
  if (view.type === "taking") {
    return (
      <ExamView
        examId={view.examId}
        onComplete={(result) =>
          setView({ type: "result", result, examTitle: view.examTitle })
        }
      />
    );
  }

  if (view.type === "result") {
    return (
      <ResultView
        result={view.result}
        examTitle={view.examTitle}
        onBack={() => {
          qc.invalidateQueries({ queryKey: ["/api/student-portal/online-exams"] });
          setView({ type: "list" });
        }}
      />
    );
  }

  if (view.type === "instructions") {
    return (
      <InstructionsView
        exam={view.exam}
        attempt={view.attempt}
        onBack={() => setView({ type: "list" })}
        onStart={() => {
          if (view.attempt?.status === "in_progress") {
            // Resume
            setView({ type: "taking", examId: view.exam.id, examTitle: view.exam.title });
          } else {
            startMut.mutate(view.exam.id);
          }
        }}
      />
    );
  }

  // ── List ──
  const statusInfo = (exam: ExamSummary) => {
    const a = exam.attempt;
    if (!a) return { label: "Not Attempted", color: "bg-muted text-muted-foreground border-border" };
    if (a.status === "in_progress") return { label: "In Progress", color: "bg-amber-50 text-amber-700 border-amber-300" };
    if (a.passed) return { label: `Pass — ${a.percentage}%`, color: "bg-green-50 text-green-700 border-green-300" };
    return { label: `Fail — ${a.percentage}%`, color: "bg-red-50 text-red-700 border-red-300" };
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-primary" />
        Online Exams
      </h1>

      {isLoading ? (
        <div className="flex justify-center py-14"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : exams.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground">
          <ClipboardList className="w-10 h-10 mx-auto opacity-20 mb-3" />
          <p className="font-medium">No exams available yet</p>
          <p className="text-sm mt-1">Your teacher will publish exams here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => {
            const si = statusInfo(exam);
            const attempted = !!exam.attempt && exam.attempt.status !== "in_progress";
            return (
              <div
                key={exam.id}
                className="rounded-2xl border bg-card p-5 space-y-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{exam.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{exam.topic}</p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-xs ${si.color}`}>{si.label}</Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exam.durationMinutes} min</span>
                  <span>{exam.totalQuestions} questions</span>
                  <span>{exam.totalQuestions * exam.marksPerQuestion} marks</span>
                  {exam.negativeMarking && <span className="text-amber-600">−{exam.negativeMarkValue} per wrong</span>}
                  {exam.language && exam.language !== "English" && (
                    <span className="flex items-center gap-1 text-blue-600 font-medium">
                      <Globe className="w-3 h-3" />{exam.language}
                    </span>
                  )}
                </div>

                {exam.expiresAt && (
                  <p className="text-xs text-muted-foreground">
                    Expires: {format(new Date(exam.expiresAt), "dd MMM yyyy, HH:mm")}
                  </p>
                )}

                <Button
                  size="sm"
                  variant={attempted ? "outline" : "default"}
                  className="w-full gap-1.5"
                  onClick={() => setView({ type: "instructions", exam, attempt: exam.attempt })}
                  disabled={startMut.isPending}
                >
                  {exam.attempt?.status === "in_progress" ? (
                    <><RotateCcw className="w-3.5 h-3.5" />Resume Exam</>
                  ) : attempted ? (
                    <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" />View Result</>
                  ) : (
                    <><BookOpen className="w-3.5 h-3.5" />Start Exam</>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
