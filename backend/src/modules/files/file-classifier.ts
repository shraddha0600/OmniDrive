/**
 * OmniDrive AI Holistic File Classifier
 * 
 * Classifies files into 6 core categories based on:
 * 1. File extension and MIME type (e.g., media vs document)
 * 2. Filename keyword & regex pattern matching (hundreds of professional, personal, revision, financial, media patterns)
 * 3. Optional text content snippets (for deep document inspection)
 */

export type FileCategory = 
  | 'Professional'
  | 'Personal'
  | 'Revision'
  | 'Financial'
  | 'Media'
  | 'Other'

export const CATEGORIES: FileCategory[] = [
  'Professional',
  'Personal',
  'Revision',
  'Financial',
  'Media',
  'Other'
]

// 💰 FINANCIAL PATTERNS
const FINANCIAL_PATTERNS = [
  /invoice/i, /receipt/i, /\bbill\b/i, /utility_bill/i, /electric_bill/i, /water_bill/i, /internet_bill/i, /broadband_bill/i,
  /tax/i, /itr/i, /form16/i, /form_16/i, /\bw2\b/i, /\b1099\b/i, /\bgst\b/i, /\bvat\b/i,
  /statement/i, /payslip/i, /paystub/i, /salary/i, /payroll/i, /reimbursement/i, /expense/i,
  /audit/i, /balance_sheet/i, /balance-sheet/i, /profit_loss/i, /pnl/i, /ledger/i, /accounting/i,
  /transaction/i, /dividend/i, /stock/i, /crypto/i, /investment/i, /portfolio_valuation/i,
  /mortgage/i, /loan/i, /\bemi\b/i, /budget/i, /claim/i, /premium/i, /payment/i, /remittance/i,
  /credit_card/i, /debit_card/i, /bank_stat/i, /bankstat/i, /cashflow/i, /revenue/i, /financial/i
]

// 📚 REVISION PATTERNS
const REVISION_PATTERNS = [
  /revision/i, /cheatsheet/i, /cheat_sheet/i, /study_guide/i, /lecture/i, /syllabus/i,
  /homework/i, /assignment/i, /lab_report/i, /labreport/i, /thesis/i, /dissertation/i,
  /exam/i, /test_paper/i, /midterm/i, /final_exam/i, /quiz/i, /flashcard/i, /textbook/i,
  /past_paper/i, /sample_paper/i, /question_paper/i, /pyq/i, /question_bank/i, /problem_set/i, /formula/i, /notes/i,
  /leetcode/i, /\bdsa\b/i, /algorithm/i, /computer_science/i, /math/i, /physics/i, /chemistry/i,
  /biology/i, /history/i, /literature/i, /tutorial/i, /course/i, /class_notes/i, /unit_[0-9]/i,
  /chapter_[0-9]/i, /\bgate\b/i, /\bcat\b/i, /\bjee\b/i, /\bneet\b/i, /\bupsc\b/i, /\bgre\b/i,
  /\bgmat\b/i, /\bsat\b/i, /ielts/i, /toefl/i, /coding_interview/i, /study_notes/i
]

// 🏠 PERSONAL PATTERNS
const PERSONAL_PATTERNS = [
  /rent_agreement/i, /lease_agreement/i, /lease/i,
  /recipe/i, /cook/i, /cookbook/i, /food/i, /diet_plan/i, /meal_plan/i, /workout/i, /gym/i,
  /fitness/i, /health/i, /medical/i, /prescription/i, /blood_test/i, /lab_test/i, /vaccine/i,
  /doctor/i, /diagnosis/i, /hospital/i, /insurance_policy/i, /health_insurance/i,
  /passport/i, /visa/i, /id_card/i, /national_id/i, /aadhaar/i, /driving_license/i, /ssn/i,
  /travel/i, /itinerary/i, /boarding_pass/i, /hotel_booking/i, /flight_ticket/i, /vacation/i,
  /family/i, /photo_album/i, /diary/i, /journal/i, /wishlist/i, /wedding/i, /party/i, /birthday/i,
  /invitation/i, /personal/i
]

// 💼 PROFESSIONAL PATTERNS
const PROFESSIONAL_PATTERNS = [
  /resume/i, /\bcv\b/i, /curriculum_vitae/i, /cover_letter/i, /coverletter/i, /portfolio/i,
  /interview/i, /offer_letter/i, /offerletter/i, /appointment_letter/i, /employment/i,
  /contract/i, /\bnda\b/i, /agreement/i, /appraisal/i, /performance_review/i, /recommendation/i,
  /reference_letter/i, /resignation/i, /termination/i, /experience_letter/i, /relieving_letter/i,
  /presentation/i, /pitch_deck/i, /pitchdeck/i, /slide/i, /deck/i, /roadmap/i, /architecture/i,
  /specification/i, /\bspec\b/i, /\bprd\b/i, /\bsdd\b/i, /proposal/i, /whitepaper/i, /business_plan/i,
  /minutes_of_meeting/i, /\bmom\b/i, /meeting_notes/i, /sprint_backlog/i, /kanban/i, /okr/i, /kpi/i,
  /work_log/i, /timesheet/i, /report_q[1-4]/i, /annual_report/i, /quarterly/i, /client_brief/i,
  /project_plan/i, /statement_of_work/i, /\bsow\b/i, /certificate/i, /accreditation/i, /bio_data/i
]

// 🎬 MEDIA EXTENSIONS & MIMES
const MEDIA_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'heic', 'raw', 'psd', 'ai',
  'mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v', '3gp',
  'mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma', 'aiff'
])

export function classifyFile(fileName: string, mimeType: string, contentSnippet?: string): FileCategory {
  const lowerName = fileName.toLowerCase().trim()
  const lowerMime = mimeType.toLowerCase().trim()
  const parts = lowerName.split('.')
  const ext = parts.length > 1 ? parts.pop()! : ''

  // 1. Media Type check (highest priority if standard media extension or MIME type)
  if (
    lowerMime.startsWith('image/') ||
    lowerMime.startsWith('video/') ||
    lowerMime.startsWith('audio/') ||
    MEDIA_EXTENSIONS.has(ext)
  ) {
    if (/invoice|receipt|bill|tax|statement/i.test(lowerName)) return 'Financial'
    if (/resume|cv|certificate|portfolio/i.test(lowerName)) return 'Professional'
    if (/passport|visa|ticket|boarding_pass|prescription/i.test(lowerName)) return 'Personal'
    if (/notes|cheatsheet|diagram|formula/i.test(lowerName)) return 'Revision'
    return 'Media'
  }

  // 2. Deep Content Snippet Inspection (if text snippet is available)
  if (contentSnippet && contentSnippet.length > 10) {
    const lowerContent = contentSnippet.toLowerCase()
    if (/invoice|receipt|total amount|tax invoice|billing address|subtotal|payment due/i.test(lowerContent)) return 'Financial'
    if (/education|work experience|skills|curriculum vitae|employment history|summary/i.test(lowerContent)) return 'Professional'
    if (/ingredients|instructions|prep time|cook time|recipe|servings/i.test(lowerContent)) return 'Personal'
    if (/chapter|theorem|exercise|homework|lecture|syllabus|formula|definition/i.test(lowerContent)) return 'Revision'
  }

  // 3. Financial Keyword Match (Invoices, Tax, Receipts, Bills)
  for (const pattern of FINANCIAL_PATTERNS) {
    if (pattern.test(lowerName)) return 'Financial'
  }

  // 4. Revision Keyword Match (Lectures, Notes, Syllabi, Exams)
  for (const pattern of REVISION_PATTERNS) {
    if (pattern.test(lowerName)) return 'Revision'
  }

  // 5. Personal Keyword Match (Agreements, Travel, Medical, Recipes)
  for (const pattern of PERSONAL_PATTERNS) {
    if (pattern.test(lowerName)) return 'Personal'
  }

  // 6. Professional Keyword Match (Resumes, Decks, Specs, PRDs)
  for (const pattern of PROFESSIONAL_PATTERNS) {
    if (pattern.test(lowerName)) return 'Professional'
  }

  // 7. Contextual Fallbacks based on Document Extensions
  if (['doc', 'docx', 'ppt', 'pptx', 'key', 'gdoc', 'gslides'].includes(ext)) {
    return 'Professional'
  }

  if (['xls', 'xlsx', 'csv', 'numbers', 'gsheet'].includes(ext)) {
    return 'Financial'
  }

  return 'Other'
}

/**
 * Extensive Test Cases Matrix to verify classification behavior across 49+ realistic files
 */
export const TEST_CASES: Array<{ name: string; mime: string; expected: FileCategory }> = [
  // 💼 Professional Test Cases
  { name: 'John_Doe_Software_Engineer_Resume.pdf', mime: 'application/pdf', expected: 'Professional' },
  { name: 'Senior_Developer_CV_2026.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', expected: 'Professional' },
  { name: 'Cover_Letter_Google_Role.pdf', mime: 'application/pdf', expected: 'Professional' },
  { name: 'Offer_Letter_Signed.pdf', mime: 'application/pdf', expected: 'Professional' },
  { name: 'Non_Disclosure_Agreement_NDA.pdf', mime: 'application/pdf', expected: 'Professional' },
  { name: 'Q3_Product_Roadmap_Presentation.pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', expected: 'Professional' },
  { name: 'System_Architecture_Spec_v2.pdf', mime: 'application/pdf', expected: 'Professional' },
  { name: 'Sprint_Backlog_Minutes_Of_Meeting.docx', mime: 'application/docx', expected: 'Professional' },
  { name: 'Performance_Appraisal_Review_2025.pdf', mime: 'application/pdf', expected: 'Professional' },
  { name: 'AWS_Certified_Solutions_Architect_Certificate.pdf', mime: 'application/pdf', expected: 'Professional' },

  // 🏠 Personal Test Cases
  { name: 'Butter_Chicken_Recipe.pdf', mime: 'application/pdf', expected: 'Personal' },
  { name: 'Weekly_Workout_Gym_Plan.docx', mime: 'application/docx', expected: 'Personal' },
  { name: 'Blood_Test_Report_Apollo_Hospital.pdf', mime: 'application/pdf', expected: 'Personal' },
  { name: 'Dr_Smith_Prescription_May.pdf', mime: 'application/pdf', expected: 'Personal' },
  { name: 'Indian_Passport_Scan.pdf', mime: 'application/pdf', expected: 'Personal' },
  { name: 'US_Schengen_Visa_Approval.pdf', mime: 'application/pdf', expected: 'Personal' },
  { name: 'House_Rent_Agreement_2026.pdf', mime: 'application/pdf', expected: 'Personal' },
  { name: 'Flight_Itinerary_Paris_Trip.pdf', mime: 'application/pdf', expected: 'Personal' },
  { name: 'Hotel_Booking_Confirmation_Kyoto.pdf', mime: 'application/pdf', expected: 'Personal' },
  { name: 'Aadhaar_Card_Verified.pdf', mime: 'application/pdf', expected: 'Personal' },

  // 📚 Revision Test Cases
  { name: 'DSA_Data_Structures_Revision_Notes.pdf', mime: 'application/pdf', expected: 'Revision' },
  { name: 'Physics_Thermodynamics_CheatSheet.pdf', mime: 'application/pdf', expected: 'Revision' },
  { name: 'Operating_Systems_Lecture_04_Slides.pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', expected: 'Revision' },
  { name: 'Calculus_Midterm_Exam_Prep.pdf', mime: 'application/pdf', expected: 'Revision' },
  { name: 'GATE_CS_Previous_Year_Question_Paper.pdf', mime: 'application/pdf', expected: 'Revision' },
  { name: 'Organic_Chemistry_Formulas.pdf', mime: 'application/pdf', expected: 'Revision' },
  { name: 'LeetCode_150_Patterns_Summary.md', mime: 'text/markdown', expected: 'Revision' },
  { name: 'Machine_Learning_Assignment_2.ipynb', mime: 'application/json', expected: 'Revision' },
  { name: 'Biology_NCERT_Chapter_5_Notes.pdf', mime: 'application/pdf', expected: 'Revision' },
  { name: 'GRE_Vocabulary_Flashcards.pdf', mime: 'application/pdf', expected: 'Revision' },

  // 💰 Financial Test Cases
  { name: 'AWS_Monthly_Invoice_May2026.pdf', mime: 'application/pdf', expected: 'Financial' },
  { name: 'Uber_Trip_Receipt_10928.pdf', mime: 'application/pdf', expected: 'Financial' },
  { name: 'HDFC_Bank_Statement_Q1.pdf', mime: 'application/pdf', expected: 'Financial' },
  { name: 'Form16_Tax_Return_2025-26.pdf', mime: 'application/pdf', expected: 'Financial' },
  { name: 'Salary_Payslip_June_2026.pdf', mime: 'application/pdf', expected: 'Financial' },
  { name: 'Company_Audit_Balance_Sheet.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', expected: 'Financial' },
  { name: 'Credit_Card_Bill_Statement.pdf', mime: 'application/pdf', expected: 'Financial' },
  { name: 'Expense_Reimbursement_Claim.csv', mime: 'text/csv', expected: 'Financial' },
  { name: 'Mutual_Fund_Portfolio_Valuation.pdf', mime: 'application/pdf', expected: 'Financial' },
  { name: 'Electricity_Utility_Bill.pdf', mime: 'application/pdf', expected: 'Financial' },

  // 🎬 Media Test Cases
  { name: 'Team_Outing_Photo.png', mime: 'image/png', expected: 'Media' },
  { name: 'Product_Demo_Video.mp4', mime: 'video/mp4', expected: 'Media' },
  { name: 'Podcast_Episode_12.mp3', mime: 'audio/mpeg', expected: 'Media' },
  { name: 'Screen_Recording_Bug_Fix.webm', mime: 'video/webm', expected: 'Media' },
  { name: 'Hero_Banner_Background.webp', mime: 'image/webp', expected: 'Media' },
  { name: 'Logo_Vector_Graphic.svg', mime: 'image/svg+xml', expected: 'Media' },

  // 📂 Other Test Cases
  { name: 'archive_backup_2026.zip', mime: 'application/zip', expected: 'Other' },
  { name: 'random_binary_payload.bin', mime: 'application/octet-stream', expected: 'Other' },
  { name: 'unknown_file_data.dat', mime: 'application/octet-stream', expected: 'Other' }
]

export function runClassifierTests(): { total: number; passed: number; failed: number } {
  let passed = 0
  let failed = 0

  for (const tc of TEST_CASES) {
    const result = classifyFile(tc.name, tc.mime)
    if (result === tc.expected) {
      passed++
    } else {
      failed++
      console.error(`[Classifier Test Fail] File: "${tc.name}" -> Got: "${result}", Expected: "${tc.expected}"`)
    }
  }

  console.log(`[Classifier Test Suite Complete] ${passed}/${TEST_CASES.length} passed.`)
  return { total: TEST_CASES.length, passed, failed }
}
