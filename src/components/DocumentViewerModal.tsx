import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Award,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Submission } from '../types';
import { updateSubmissionGrade } from '../services/assignmentService';
import { formatBytes, formatDateTime, getGradeLetter } from '../utils/fileUtils';

interface DocumentViewerModalProps {
  submission: Submission | null;
  onClose: () => void;
  submissionsList: Submission[];
  onSelectSubmission: (submission: Submission) => void;
  currentTeacherNameOrEmail: string;
}

const RUBRIC_CHIPS = [
  'Exceptional research depth and clarity.',
  'Well-structured architecture and clean flow.',
  'Code logic and documentation are comprehensive.',
  'Accurate mathematical proofs and diagrams.',
  'Needs more in-depth critical analysis.',
  'Minor citation formatting inconsistencies.',
  'Solid work overall; meets all baseline requirements.',
];

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  submission,
  onClose,
  submissionsList,
  onSelectSubmission,
  currentTeacherNameOrEmail,
}) => {
  if (!submission) return null;

  const [score, setScore] = useState<number | ''>(
    submission.grade !== undefined ? submission.grade : ''
  );
  const [feedback, setFeedback] = useState<string>(submission.teacherFeedback || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state if selected submission changes
  useEffect(() => {
    setScore(submission.grade !== undefined ? submission.grade : '');
    setFeedback(submission.teacherFeedback || '');
    setSaveSuccess(false);
    setErrorMsg(null);
  }, [submission.id]);

  const currentIndex = submissionsList.findIndex((s) => s.id === submission.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < submissionsList.length - 1;

  const handlePrev = () => {
    if (hasPrev) onSelectSubmission(submissionsList[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onSelectSubmission(submissionsList[currentIndex + 1]);
  };

  const handleAddRubricChip = (chipText: string) => {
    setFeedback((prev) => (prev ? `${prev} ${chipText}` : chipText));
  };

  const handleSaveGrade = async () => {
    setErrorMsg(null);
    if (score === '' || isNaN(Number(score))) {
      setErrorMsg('Please enter a valid numeric grade.');
      return;
    }
    const numScore = Number(score);
    if (numScore < 0 || numScore > submission.maxMarks) {
      setErrorMsg(`Grade must be between 0 and ${submission.maxMarks}.`);
      return;
    }

    setIsSaving(true);
    try {
      await updateSubmissionGrade(
        submission.id,
        numScore,
        feedback.trim(),
        currentTeacherNameOrEmail || 'Instructor'
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving grade:', err);
      setErrorMsg('Failed to update grade in Firestore. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isPdf =
    submission.fileType === 'application/pdf' ||
    submission.fileName.toLowerCase().endsWith('.pdf');

  const gradeLetter =
    score !== '' && !isNaN(Number(score))
      ? getGradeLetter(Number(score), submission.maxMarks)
      : null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-white">
                  {submission.studentName}
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                  {submission.rollNumber}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  • {submission.assignmentTitle}
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Prev/Next + Close */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 mr-2 text-xs text-slate-400">
              <span>
                {currentIndex + 1} of {submissionsList.length}
              </span>
              <button
                onClick={handlePrev}
                disabled={!hasPrev}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition"
                title="Previous Submission"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={!hasNext}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition"
                title="Next Submission"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split 2 Columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Column: Interactive Document Viewer (7 cols) */}
          <div className="lg:col-span-7 bg-slate-100 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 overflow-hidden">
            {/* Document Tool Bar */}
            <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-medium truncate">
                <span className="font-semibold text-slate-900 truncate">
                  {submission.fileName}
                </span>
                <span className="text-slate-400">({formatBytes(submission.fileSize)})</span>
              </div>
              <div className="flex items-center gap-2">
                {submission.fileData && (
                  <a
                    href={submission.fileData}
                    download={submission.fileName}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </a>
                )}
              </div>
            </div>

            {/* Document Display Canvas */}
            <div className="flex-1 p-3 overflow-auto flex flex-col justify-center">
              {isPdf && submission.fileData ? (
                <div className="w-full h-full min-h-[400px] bg-white rounded-xl shadow-inner border border-slate-300 overflow-hidden flex flex-col">
                  <iframe
                    src={submission.fileData}
                    title={submission.fileName}
                    className="w-full h-full flex-1 border-0"
                  />
                </div>
              ) : (
                /* DOCX or structured text rendering */
                <div className="w-full h-full bg-white rounded-xl shadow-xs border border-slate-300 p-6 overflow-y-auto font-serif text-slate-800 text-sm leading-relaxed">
                  <div className="pb-4 mb-4 border-b border-slate-200 font-sans">
                    <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
                      <FileText className="w-4 h-4" />
                      <span>DOCX Document Viewer</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 font-sans">
                      {submission.assignmentTitle}
                    </h3>
                    <div className="text-xs text-slate-500 font-sans mt-0.5">
                      Submitted by {submission.studentName} ({submission.rollNumber}) on{' '}
                      {formatDateTime(submission.submittedAt)}
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap">
                    {submission.fileTextPreview ||
                      'Document successfully loaded. You can view extracted content above or download the original file to view full layout.'}
                  </div>
                </div>
              )}
            </div>

            {/* Student remarks bar */}
            {submission.studentNotes && (
              <div className="px-4 py-2 bg-amber-50 border-t border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Student Note: </span>
                  <span>{submission.studentNotes}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Grading & Evaluation Workstation (5 cols) */}
          <div className="lg:col-span-5 bg-white p-5 sm:p-6 flex flex-col overflow-y-auto">
            <div className="space-y-5 flex-1">
              {/* Header section */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <span>Grading & Evaluation</span>
                  </h3>
                  {submission.status === 'graded' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Graded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      <Clock className="w-3 h-3" />
                      Pending Evaluation
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Assign score and comprehensive feedback. Results reflect immediately on the
                  student's portal.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Grade and feedback successfully recorded in real-time!</span>
                </div>
              )}

              {/* Score Input Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Awarded Marks
                  </label>
                  {gradeLetter && (
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${gradeLetter.color}`}
                    >
                      Grade {gradeLetter.letter}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={0}
                      max={submission.maxMarks}
                      value={score}
                      onChange={(e) =>
                        setScore(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="0"
                      className="w-full pl-4 pr-12 py-2.5 text-xl font-bold rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      / {submission.maxMarks}
                    </span>
                  </div>

                  {score !== '' && !isNaN(Number(score)) && (
                    <div className="text-xs text-slate-600 font-semibold px-3 py-2 bg-white rounded-xl border border-slate-200">
                      {Math.round((Number(score) / submission.maxMarks) * 100)}% Score
                    </div>
                  )}
                </div>
              </div>

              {/* Rubric Quick Chips */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Quick Rubric Remarks (Click to Insert)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {RUBRIC_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddRubricChip(chip)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/80 text-slate-600 transition text-left"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Written Feedback Textarea */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Detailed Teacher Feedback
                </label>
                <textarea
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide constructive assessment comments, strengths, and areas of improvement..."
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>

            {/* Save Action Footer */}
            <div className="pt-4 border-t border-slate-200 mt-4 space-y-2">
              <button
                onClick={handleSaveGrade}
                disabled={isSaving}
                className="w-full py-3 px-5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Firestore...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Grade & Publish Feedback</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
                <span>Evaluator: {currentTeacherNameOrEmail}</span>
                {hasNext && (
                  <button
                    onClick={handleNext}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                  >
                    <span>Next student</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
