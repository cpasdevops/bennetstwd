import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Search,
  Filter,
  FileCheck2,
  Clock,
  Award,
  Users,
  Download,
  Eye,
  Trash2,
  PlusCircle,
  FileText,
  Calendar,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { Submission, Assignment } from '../types';
import { formatDateTime, formatBytes, getGradeLetter } from '../utils/fileUtils';
import { deleteSubmission, submitAssignment } from '../services/assignmentService';
import { createSamplePdfDataUrl } from '../utils/fileUtils';

interface TeacherDashboardProps {
  submissions: Submission[];
  assignments?: Assignment[];
  onOpenViewer: (submission: Submission) => void;
  onOpenNewAssignmentModal?: () => void;
  currentTeacherNameOrEmail: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  submissions,
  assignments,
  onOpenViewer,
  onOpenNewAssignmentModal,
  currentTeacherNameOrEmail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignmentId, setFilterAssignmentId] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'submitted' | 'graded'>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'gradeHigh' | 'gradeLow'>('newest');
  const [isSeedingSample, setIsSeedingSample] = useState(false);

  // Compute metrics
  const stats = useMemo(() => {
    const total = submissions.length;
    const gradedList = submissions.filter((s) => s.status === 'graded' && s.grade !== undefined);
    const graded = gradedList.length;
    const pending = total - graded;

    let averagePercentage = 0;
    if (graded > 0) {
      const sumPercentage = gradedList.reduce((acc, curr) => {
        const pct = curr.maxMarks > 0 ? ((curr.grade || 0) / curr.maxMarks) * 100 : 0;
        return acc + pct;
      }, 0);
      averagePercentage = Math.round(sumPercentage / graded);
    }

    return { total, graded, pending, averagePercentage };
  }, [submissions]);

  // Filtered and sorted submissions
  const filteredSubmissions = useMemo(() => {
    let result = [...submissions];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.studentName.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q) ||
          s.fileName.toLowerCase().includes(q)
      );
    }

    if (filterAssignmentId !== 'ALL') {
      result = result.filter((s) => s.assignmentId === filterAssignmentId);
    }

    if (filterStatus !== 'ALL') {
      result = result.filter((s) => s.status === filterStatus);
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      }
      if (sortBy === 'gradeHigh') {
        return (b.grade ?? -1) - (a.grade ?? -1);
      }
      if (sortBy === 'gradeLow') {
        return (a.grade ?? 999) - (b.grade ?? 999);
      }
      return 0;
    });

    return result;
  }, [submissions, searchQuery, filterAssignmentId, filterStatus, sortBy]);

  // Export submissions to CSV
  const handleExportCSV = () => {
    if (submissions.length === 0) return;

    const headers = [
      'Roll Number',
      'Student Name',
      'Assignment Title',
      'File Name',
      'Status',
      'Grade',
      'Max Marks',
      'Percentage',
      'Teacher Feedback',
      'Submitted At',
      'Graded By',
      'Graded At',
    ];

    const rows = filteredSubmissions.map((s) => {
      const pct = s.grade !== undefined && s.maxMarks > 0 ? Math.round((s.grade / s.maxMarks) * 100) : '';
      return [
        `"${s.rollNumber}"`,
        `"${s.studentName.replace(/"/g, '""')}"`,
        `"${s.assignmentTitle.replace(/"/g, '""')}"`,
        `"${s.fileName.replace(/"/g, '""')}"`,
        `"${s.status}"`,
        s.grade !== undefined ? s.grade : '',
        s.maxMarks,
        pct ? `${pct}%` : '',
        `"${(s.teacherFeedback || '').replace(/"/g, '""')}"`,
        `"${s.submittedAt}"`,
        `"${s.gradedBy || ''}"`,
        `"${s.gradedAt || ''}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `assignment_grades_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick Seed Sample Submissions for Instant Testing
  const handleGenerateSampleSubmissions = async () => {
    setIsSeedingSample(true);
    try {
      const targetAsgn = (assignments && assignments[0]) || {
        id: 'general_submission',
        title: 'Assignment Submission',
        maxMarks: 100,
      };

      const samples = [
        {
          name: 'Lucas Vance',
          roll: 'CS2026-012',
          notes: 'Added performance charts on page 3.',
        },
        {
          name: 'Amina Patel',
          roll: 'CS2026-034',
          notes: 'Implemented leader election protocol.',
        },
        {
          name: 'Daniel Kim',
          roll: 'CS2026-077',
          notes: 'Full benchmark included in DOCX format.',
        },
      ];

      for (const sample of samples) {
        const pdfData = createSamplePdfDataUrl(sample.name, sample.roll, targetAsgn.title);
        await submitAssignment({
          studentName: sample.name,
          rollNumber: sample.roll,
          assignmentId: targetAsgn.id,
          assignmentTitle: targetAsgn.title,
          fileName: `${sample.roll}_submission.pdf`,
          fileType: 'application/pdf',
          fileSize: 45000,
          fileData: pdfData,
          fileTextPreview: `Architecture design for ${targetAsgn.title}. ${sample.notes}`,
          studentNotes: sample.notes,
          status: 'submitted',
          maxMarks: targetAsgn.maxMarks,
          submittedAt: new Date(Date.now() - Math.random() * 36000000).toISOString(),
        });
      }
    } catch (err) {
      console.error('Error generating sample submissions:', err);
    } finally {
      setIsSeedingSample(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this submission record?')) {
      try {
        await deleteSubmission(id);
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Teacher & Admin Evaluation Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Real-time Firestore
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Review student uploads in PDF and DOCX, grade submissions, and provide instant real-time
            feedback.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {onOpenNewAssignmentModal && (
            <button
              onClick={onOpenNewAssignmentModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Assignment</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            disabled={submissions.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {submissions.length === 0 && (
            <button
              onClick={handleGenerateSampleSubmissions}
              disabled={isSeedingSample}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSeedingSample ? 'Creating...' : '+ Load 3 Sample Students'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Submissions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
            <div className="text-xs font-medium text-slate-500">Total Submissions</div>
          </div>
        </div>

        {/* Card 2: Pending Review */}
        <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-700">{stats.pending}</div>
            <div className="text-xs font-medium text-amber-900/70">Awaiting Grading</div>
          </div>
        </div>

        {/* Card 3: Graded */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700">{stats.graded}</div>
            <div className="text-xs font-medium text-emerald-900/70">Graded & Evaluated</div>
          </div>
        </div>

        {/* Card 4: Class Average */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {stats.graded > 0 ? `${stats.averagePercentage}%` : '—'}
            </div>
            <div className="text-xs font-medium text-slate-500">Class Avg Score</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search box (5 cols) */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, roll number, or file..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          {/* Assignment dropdown (3 cols) */}
          <div className="lg:col-span-3">
            <select
              value={filterAssignmentId}
              onChange={(e) => setFilterAssignmentId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="ALL">All Assignments</option>
              {(assignments || []).map((asgn) => (
                <option key={asgn.id} value={asgn.id}>
                  {asgn.courseCode}: {asgn.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="submitted">To Grade ({stats.pending})</option>
              <option value="graded">Graded ({stats.graded})</option>
            </select>
          </div>

          {/* Sort order (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="gradeHigh">Highest Grade</option>
              <option value="gradeLow">Lowest Grade</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table / View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">Student Submissions</h2>
            <span className="text-xs text-slate-500 font-medium">
              ({filteredSubmissions.length} found)
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Click &quot;View &amp; Grade&quot; to inspect document and assign marks
          </span>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Submissions Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {searchQuery || filterAssignmentId !== 'ALL' || filterStatus !== 'ALL'
                ? 'No submissions match your active filter criteria.'
                : 'No student has submitted coursework yet. You can submit from the student portal or click "+ Load 3 Sample Students" above to test grading right away.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 sm:px-6">Student & Roll No</th>
                  <th className="py-3.5 px-4">Assignment</th>
                  <th className="py-3.5 px-4">Uploaded File</th>
                  <th className="py-3.5 px-4">Submitted Time</th>
                  <th className="py-3.5 px-4">Status & Score</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => {
                  const isGraded = sub.status === 'graded' && sub.grade !== undefined;
                  const gradeInfo = isGraded ? getGradeLetter(sub.grade!, sub.maxMarks) : null;
                  const isPdf =
                    sub.fileType === 'application/pdf' ||
                    sub.fileName.toLowerCase().endsWith('.pdf');

                  return (
                    <tr
                      key={sub.id}
                      onClick={() => onOpenViewer(sub)}
                      className="hover:bg-indigo-50/30 cursor-pointer transition group"
                    >
                      {/* Student info */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition">
                          {sub.studentName}
                        </div>
                        <div className="font-mono text-xs text-slate-500 font-semibold mt-0.5">
                          {sub.rollNumber}
                        </div>
                      </td>

                      {/* Assignment */}
                      <td className="py-4 px-4 max-w-[200px]">
                        <div className="font-medium text-slate-800 truncate" title={sub.assignmentTitle}>
                          {sub.assignmentTitle}
                        </div>
                        <div className="text-[11px] text-slate-400">Max: {sub.maxMarks} marks</div>
                      </td>

                      {/* File */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isPdf
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {isPdf ? 'PDF' : 'DOCX'}
                          </span>
                          <span className="text-slate-700 text-xs truncate max-w-[140px]" title={sub.fileName}>
                            {sub.fileName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {formatBytes(sub.fileSize)}
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDateTime(sub.submittedAt)}
                      </td>

                      {/* Status / Grade */}
                      <td className="py-4 px-4">
                        {isGraded ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${gradeInfo?.color}`}
                            >
                              {gradeInfo?.letter} ({sub.grade}/{sub.maxMarks})
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 animate-pulse" />
                            Pending Review
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onOpenViewer(sub)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white transition shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isGraded ? 'Review Grade' : 'Grade File'}</span>
                          </button>

                          <button
                            onClick={(e) => handleDelete(e, sub.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Submission"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
