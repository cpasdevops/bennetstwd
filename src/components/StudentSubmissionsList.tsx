import React, { useState } from 'react';
import {
  ClipboardList,
  Search,
  CheckCircle2,
  Clock,
  Award,
  MessageSquare,
  Download,
  FileText,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { Submission } from '../types';
import { formatDateTime, getGradeLetter, formatBytes } from '../utils/fileUtils';

interface StudentSubmissionsListProps {
  submissions: Submission[];
  initialRollNo?: string;
  onOpenViewer: (submission: Submission) => void;
}

export const StudentSubmissionsList: React.FC<StudentSubmissionsListProps> = ({
  submissions,
  initialRollNo = '',
  onOpenViewer,
}) => {
  const [searchRoll, setSearchRoll] = useState(initialRollNo);

  const filtered = submissions.filter((s) => {
    if (!searchRoll.trim()) return true;
    const query = searchRoll.trim().toLowerCase();
    return (
      s.rollNumber.toLowerCase().includes(query) ||
      s.studentName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Submissions & Grades
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track real-time evaluation status, instructor feedback, and grade reports.
          </p>
        </div>

        {/* Filter Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchRoll}
            onChange={(e) => setSearchRoll(e.target.value)}
            placeholder="Filter by Roll Number or Name..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
        </div>
      </div>

      {/* Submissions List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Submissions Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchRoll
              ? `No records found matching "${searchRoll}". Verify your roll number or clear search.`
              : 'You have not submitted any assignments yet. Head over to the Submit Assignment tab to get started!'}
          </p>
          {searchRoll && (
            <button
              onClick={() => setSearchRoll('')}
              className="mt-4 px-4 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
            >
              Clear Filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((sub) => {
            const isGraded = sub.status === 'graded' && sub.grade !== undefined;
            const gradeInfo = isGraded ? getGradeLetter(sub.grade!, sub.maxMarks) : null;

            return (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition p-5 sm:p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                        {sub.rollNumber}
                      </span>
                      <span className="font-semibold text-slate-900 text-base">
                        {sub.studentName}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateTime(sub.submittedAt)}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-indigo-900">
                      {sub.assignmentTitle}
                    </div>
                  </div>

                  {/* Status & Grade Pill */}
                  <div className="flex items-center gap-3">
                    {isGraded ? (
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold border ${gradeInfo?.color}`}
                        >
                          <Award className="w-4 h-4" />
                          <span>Grade: {gradeInfo?.letter}</span>
                          <span className="text-slate-400">|</span>
                          <span>
                            {sub.grade} / {sub.maxMarks}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Graded
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        Submitted — Pending Teacher Review
                      </span>
                    )}

                    <button
                      onClick={() => onOpenViewer(sub)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View File</span>
                    </button>
                  </div>
                </div>

                {/* Sub details: file & feedback */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* File info */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div className="truncate">
                        <div className="font-medium text-slate-800 truncate">{sub.fileName}</div>
                        <div className="text-[11px] text-slate-500">{formatBytes(sub.fileSize)}</div>
                      </div>
                    </div>
                    {sub.fileData && (
                      <a
                        href={sub.fileData}
                        download={sub.fileName}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-slate-600 hover:text-indigo-600 hover:bg-white transition"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    )}
                  </div>

                  {/* Teacher Feedback */}
                  {sub.teacherFeedback ? (
                    <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/80">
                      <div className="font-semibold text-emerald-900 flex items-center gap-1.5 mb-1">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Instructor Evaluation Feedback:</span>
                      </div>
                      <p className="text-slate-700 italic">"{sub.teacherFeedback}"</p>
                      {sub.gradedBy && (
                        <div className="mt-1 text-[11px] text-emerald-800/80">
                          Evaluated by: {sub.gradedBy} on {formatDateTime(sub.gradedAt || '')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-500 italic flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>No feedback entered yet. Grader will assess shortly.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
