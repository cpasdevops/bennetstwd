import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { User } from 'firebase/auth';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileCheck,
  ArrowRight,
  RefreshCw,
  Clock,
  Trash2,
} from 'lucide-react';
import { submitAssignment } from '../services/assignmentService';
import {
  fileToBase64,
  extractDocContent,
  formatBytes,
  createSamplePdfDataUrl,
} from '../utils/fileUtils';

interface StudentPortalProps {
  currentUser: User | null;
  onViewMySubmissions: (rollNo?: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  onViewMySubmissions,
}) => {
  const [studentName, setStudentName] = useState(currentUser?.displayName || '');
  const [rollNumber, setRollNumber] = useState('');
  const [studentNotes, setStudentNotes] = useState('');

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileTextPreview, setFileTextPreview] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    id: string;
    studentName: string;
    rollNumber: string;
    submittedAt: string;
    fileName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync user display name if signs in
  React.useEffect(() => {
    if (currentUser?.displayName && !studentName) {
      setStudentName(currentUser.displayName);
    }
  }, [currentUser]);

  const handleFileProcess = async (selectedFile: File) => {
    setErrorMsg(null);
    const validExtensions = ['.pdf', '.docx'];
    const hasValidExt = validExtensions.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setErrorMsg('Please upload a PDF (.pdf) or Word (.docx) document only.');
      return;
    }

    if (selectedFile.size > 800 * 1024) {
      setErrorMsg(
        `File is ${formatBytes(
          selectedFile.size
        )}. For direct database storage, please keep document under 800KB or use the sample document generator.`
      );
      return;
    }

    setIsProcessingFile(true);
    try {
      const base64 = await fileToBase64(selectedFile);
      const { textPreview } = await extractDocContent(selectedFile);

      setFile(selectedFile);
      setFileBase64(base64);
      setFileTextPreview(textPreview);
    } catch (err) {
      console.error('File parsing error:', err);
      setErrorMsg('Failed to process file. Please try again.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSamplePdf = () => {
    setErrorMsg(null);
    const name = studentName.trim() || 'Alex Mercer';
    const roll = rollNumber.trim() || 'CS2026-088';
    const title = 'Assignment Document';

    const pdfDataUrl = createSamplePdfDataUrl(name, roll, title);
    const mockFile = new File(['%PDF-1.4 sample content'], `${roll}_assignment.pdf`, {
      type: 'application/pdf',
    });

    setFile(mockFile);
    setFileBase64(pdfDataUrl);
    setFileTextPreview(
      `Executive Summary: Technical submission report for ${name} (${roll}). Performance benchmarks, methodologies, and conclusions documented.`
    );
    if (!studentName) setStudentName(name);
    if (!rollNumber) setRollNumber(roll);
  };

  const handleLoadSampleDocx = () => {
    setErrorMsg(null);
    const name = studentName.trim() || 'Sarah Jenkins';
    const roll = rollNumber.trim() || 'CS2026-104';
    const title = 'Assignment Report';

    const sampleText = `ACADEMIC ASSIGNMENT REPORT\nStudent: ${name} (${roll})\n\nABSTRACT:\nThis technical assignment report details systems implementation, analysis, and validation results.`;
    const docxDataUrl = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${btoa(
      sampleText
    )}`;
    const mockFile = new File([sampleText], `${roll}_report.docx`, {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    setFile(mockFile);
    setFileBase64(docxDataUrl);
    setFileTextPreview(sampleText);
    if (!studentName) setStudentName(name);
    if (!rollNumber) setRollNumber(roll);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!studentName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!rollNumber.trim()) {
      setErrorMsg('Please enter your student Roll / Registration Number.');
      return;
    }
    if (!file || !fileBase64) {
      setErrorMsg('Please attach your assignment PDF or DOCX file.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const submissionId = await submitAssignment({
        studentName: studentName.trim(),
        rollNumber: rollNumber.trim().toUpperCase(),
        assignmentId: 'general_submission',
        assignmentTitle: 'Assignment Submission',
        fileName: file.name,
        fileType: file.name.endsWith('.pdf') ? 'application/pdf' : 'application/docx',
        fileSize: file.size,
        fileData: fileBase64,
        fileTextPreview: fileTextPreview || '',
        studentNotes: studentNotes.trim(),
        status: 'submitted',
        maxMarks: 100,
        submittedAt: now,
      });

      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setSubmittedReceipt({
        id: submissionId,
        studentName: studentName.trim(),
        rollNumber: rollNumber.trim().toUpperCase(),
        submittedAt: now,
        fileName: file.name,
      });
    } catch (err: any) {
      console.error('Submission failed:', err);
      setErrorMsg('Failed to submit assignment. Please verify your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setFileBase64('');
    setFileTextPreview('');
    setStudentNotes('');
    setSubmittedReceipt(null);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Intro Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-3">
          <FileCheck className="w-4 h-4 text-indigo-600" />
          <span>Student Assignment Portal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Submit Your Assignment
        </h1>
        <p className="mt-2 text-base text-slate-600 max-w-xl mx-auto">
          Enter your name, roll number, and upload your assignment file in PDF or DOCX format.
        </p>
      </div>

      {/* Success Receipt State */}
      {submittedReceipt ? (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-xl overflow-hidden p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Assignment Successfully Submitted!</h2>
          <p className="text-sm text-slate-600 mt-1">
            Your document has been stored in the database for teacher review and grading.
          </p>

          <div className="mt-6 max-w-md mx-auto bg-slate-50 rounded-xl p-5 border border-slate-200 text-left space-y-2.5 text-sm">
            <div className="flex justify-between pb-2 border-b border-slate-200 text-xs">
              <span className="text-slate-500">Submission Reference ID</span>
              <span className="font-mono font-bold text-indigo-600">{submittedReceipt.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Student Name:</span>
              <span className="font-semibold text-slate-800">{submittedReceipt.studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Roll Number:</span>
              <span className="font-semibold text-slate-800">{submittedReceipt.rollNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Attached File:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                {submittedReceipt.fileName}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-500">Status:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                <Clock className="w-3 h-3" />
                Submitted — Awaiting Teacher Evaluation
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onViewMySubmissions(submittedReceipt.rollNumber)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition"
            >
              <span>Track My Submissions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={resetForm}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>Submit Another Assignment</span>
            </button>
          </div>
        </div>
      ) : (
        /* Submission Form */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <FileCode className="w-5 h-5 text-indigo-200" />
              <span>Assignment Submission Form</span>
            </div>
            <span className="text-xs text-indigo-100 bg-white/10 px-2.5 py-1 rounded-full">
              PDF / DOCX
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>{errorMsg}</div>
              </div>
            )}

            {/* Student Info: Name & Roll Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Roll / Registration Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. CS2026-042"
                  className="w-full px-4 py-2.5 text-sm uppercase rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>

            {/* Document Upload Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Upload Assignment File (PDF or DOCX) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Quick test:</span>
                  <button
                    type="button"
                    onClick={handleLoadSamplePdf}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300"
                  >
                    + Sample PDF
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleLoadSampleDocx}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300"
                  >
                    + Sample DOCX
                  </button>
                </div>
              </div>

              {!file ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileProcess(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    Click to browse or drag & drop your assignment file
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports PDF (.pdf) and Microsoft Word (.docx) documents up to 800KB
                  </p>
                </div>
              ) : (
                /* Attached File Card */
                <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{file.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-medium text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                            {file.name.endsWith('.pdf') ? 'PDF Document' : 'DOCX Document'}
                          </span>
                          <span>•</span>
                          <span>{formatBytes(file.size)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setFileBase64('');
                        setFileTextPreview('');
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {fileTextPreview && (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-indigo-100 text-xs text-slate-600">
                      <span className="font-semibold text-indigo-900 block mb-1">
                        Document Content Preview:
                      </span>
                      <p className="line-clamp-3 italic text-slate-600">{fileTextPreview}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Optional Comments */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Comments / Student Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                placeholder="Mention any specific remarks for your evaluator..."
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isProcessingFile}
                className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Document to Firebase...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Submit Assignment</span>
                  </>
                )}
              </button>
              <p className="text-center text-xs text-slate-500 mt-2.5">
                Submissions are time-stamped and sent directly to the teacher grading dashboard.
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
