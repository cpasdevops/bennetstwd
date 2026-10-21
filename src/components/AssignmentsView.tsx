import React from 'react';
import {
  BookOpen,
  Calendar,
  Award,
  PlusCircle,
  FileText,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Assignment } from '../types';
import { formatDateTime } from '../utils/fileUtils';

interface AssignmentsViewProps {
  assignments: Assignment[];
  onSelectToSubmit: (assignmentId: string) => void;
  onOpenNewAssignmentModal: () => void;
  isTeacherMode: boolean;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  assignments,
  onSelectToSubmit,
  onOpenNewAssignmentModal,
  isTeacherMode,
}) => {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Coursework Curriculum</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Academic Assignments & Tasks
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Browse all active assignment briefs, guidelines, deadlines, and submission requirements.
          </p>
        </div>

        <button
          onClick={onOpenNewAssignmentModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish New Task</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((asgn) => {
          const isPastDue = asgn.dueDate && new Date(asgn.dueDate).getTime() < Date.now();

          return (
            <div
              key={asgn.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {asgn.courseCode}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    {asgn.maxMarks} Marks
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-lg mb-2 leading-snug">
                  {asgn.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed mb-4">
                  {asgn.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Due: {asgn.dueDate ? new Date(asgn.dueDate).toLocaleDateString() : 'Flexible'}
                  </span>
                  {isPastDue && (
                    <span className="text-rose-600 font-semibold text-[11px]">Past Deadline</span>
                  )}
                </div>

                <button
                  onClick={() => onSelectToSubmit(asgn.id)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white transition flex items-center justify-center gap-2 group"
                >
                  <span>Submit for this Task</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
