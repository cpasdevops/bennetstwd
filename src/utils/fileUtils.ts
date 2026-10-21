import mammoth from 'mammoth';

// Convert File to Base64 Data URL
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Extract preview text or HTML from uploaded file
export async function extractDocContent(
  file: File
): Promise<{ textPreview: string; htmlContent?: string }> {
  const isDocx =
    file.name.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (isDocx) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
      return {
        textPreview: rawTextResult.value.slice(0, 1500) || 'Docx document successfully parsed.',
        htmlContent: htmlResult.value,
      };
    } catch (err) {
      console.warn('Could not parse DOCX with mammoth:', err);
      return {
        textPreview: `Uploaded DOCX document: ${file.name} (${formatBytes(file.size)})`,
      };
    }
  }

  // For PDF or others
  return {
    textPreview: `PDF Document: ${file.name} ready for preview and evaluation (${formatBytes(
      file.size
    )})`,
  };
}

// Convert bytes to readable string
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Format ISO date
export function formatDateTime(isoString: string): string {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

// Calculate letter grade
export function getGradeLetter(score: number, max: number): { letter: string; color: string } {
  if (max <= 0) return { letter: 'N/A', color: 'text-gray-500' };
  const percentage = (score / max) * 100;
  if (percentage >= 93) return { letter: 'A+', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
  if (percentage >= 85) return { letter: 'A', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
  if (percentage >= 80) return { letter: 'B+', color: 'text-blue-700 bg-blue-50 border-blue-300' };
  if (percentage >= 70) return { letter: 'B', color: 'text-blue-700 bg-blue-50 border-blue-300' };
  if (percentage >= 60) return { letter: 'C', color: 'text-amber-700 bg-amber-50 border-amber-300' };
  if (percentage >= 50) return { letter: 'D', color: 'text-orange-700 bg-orange-50 border-orange-300' };
  return { letter: 'F', color: 'text-rose-700 bg-rose-50 border-rose-300' };
}

// Create a valid standalone sample PDF Base64 string for quick testing
export function createSamplePdfDataUrl(studentName: string, rollNo: string, assignment: string): string {
  // Minimal valid PDF 1.4 syntax with visible text
  const dateStr = new Date().toLocaleDateString();
  const rawPdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 420 >>
stream
BT
/F1 22 Tf
50 720 Td
(ACADEMIC ASSIGNMENT SUBMISSION) Tj
/F1 12 Tf
0 -35 Td
(Student Name: ${studentName || 'Alex Mercer'}) Tj
0 -20 Td
(Roll Number: ${rollNo || 'CS2026-091'}) Tj
0 -20 Td
(Course / Topic: ${assignment || 'Distributed Systems & Cloud Computing'}) Tj
0 -20 Td
(Submission Date: ${dateStr}) Tj
0 -35 Td
/F1 14 Tf
(Executive Summary & Architecture Implementation) Tj
0 -25 Td
/F1 11 Tf
(1. Introduction: In this research paper, we evaluate distributed consensus models.) Tj
0 -18 Td
(2. Methodology: We deployed a 5-node Raft cluster with partitioned log replication.) Tj
0 -18 Td
(3. Performance: Read latency dropped to 4.2ms under 10,000 req/sec benchmark.) Tj
0 -18 Td
(4. Conclusion: Fault tolerance was verified during node failure recovery simulations.) Tj
0 -30 Td
(Submitted via EduSubmit Portal) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000229 00000 n 
0000000302 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
775
%%EOF`;

  return `data:application/pdf;base64,${btoa(rawPdf)}`;
}
