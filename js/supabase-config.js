// ============================================================
//  SUPABASE CONFIGURATION
// ============================================================
const SUPABASE_URL = 'https://abbasgbtgyyxvpztnrfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYmFzZ2J0Z3l5eHZwenRucmZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NDIwOTEsImV4cCI6MjEwODExODA5MX0.giTrRKnNOHHJTKyzFt2HjY3i3iw-L2XkBR-O83uzTSA';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLES = {
  ROOMS:          'rooms',
  GROUPS:         'student_groups',
  TEACHERS:       'teachers',
  SUBJECTS:       'subjects',
  SCHEDULES:      'schedules',
  TEACHING_LOADS: 'teaching_loads',
  REGISTRATIONS:  'registrations',
  STUDENTS:       'students',
};

// ============================================================
//  SQL SCHEMA — รันใน Supabase SQL Editor
// ============================================================
/*
-- ── ตารางเดิม (ถ้ายังไม่มี) ──────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  room_id TEXT UNIQUE NOT NULL,
  room_name TEXT NOT NULL,
  room_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_groups (
  id SERIAL PRIMARY KEY,
  group_id TEXT UNIQUE NOT NULL,
  group_name TEXT NOT NULL,
  student_count INTEGER DEFAULT 0,
  advisor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  teacher_id TEXT UNIQUE NOT NULL,
  teacher_name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  subject_id TEXT UNIQUE NOT NULL,
  subject_name TEXT NOT NULL,
  theory INTEGER DEFAULT 0,
  practice INTEGER DEFAULT 0,
  credit INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  subject_id TEXT REFERENCES subjects(subject_id) ON DELETE CASCADE,
  teacher_id TEXT REFERENCES teachers(teacher_id) ON DELETE SET NULL,
  room_id TEXT REFERENCES rooms(room_id) ON DELETE SET NULL,
  group_id TEXT REFERENCES student_groups(group_id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  semester TEXT DEFAULT '1',
  academic_year TEXT DEFAULT '2568',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- เพิ่มกิจกรรม HOMEROOM เข้าตาราง subjects (จำเป็นสำหรับการจัดแถว/กิจกรรม)
INSERT INTO subjects (subject_id, subject_name, theory, practice, credit)
VALUES ('HOMEROOM', 'กิจกรรมหน้าเสาธงและโฮมรูม', 1, 0, 0)
ON CONFLICT (subject_id) DO NOTHING;

-- ── ตารางใหม่: ภาระงานสอน ────────────────────────────────
CREATE TABLE IF NOT EXISTS teaching_loads (
  id SERIAL PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES teachers(teacher_id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
  hours_per_week INTEGER DEFAULT 0,
  semester TEXT DEFAULT '1',
  academic_year TEXT DEFAULT '2568',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, subject_id, semester, academic_year)
);

-- ── ตารางใหม่: ข้อมูลการลงทะเบียน ──────────────────────
CREATE TABLE IF NOT EXISTS registrations (
  id SERIAL PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
  group_id TEXT NOT NULL REFERENCES student_groups(group_id) ON DELETE CASCADE,
  group_id_2 TEXT REFERENCES student_groups(group_id) ON DELETE SET NULL,  -- วิชาสามัญเรียนร่วม 2 กลุ่ม
  subject_type TEXT NOT NULL DEFAULT 'ปฏิบัติ', -- 'สามัญ' หรือ 'ปฏิบัติ'
  semester TEXT DEFAULT '1',
  academic_year TEXT DEFAULT '2568',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, group_id, semester, academic_year)
);

-- ── ตารางใหม่: ข้อมูลนักเรียน ──────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  student_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  group_id TEXT REFERENCES student_groups(group_id) ON DELETE SET NULL,
  department TEXT DEFAULT 'เทคโนโลยีสารสนเทศ',
  level TEXT DEFAULT 'ปวช.1',
  special_condition TEXT DEFAULT 'ปกติ', -- 'ปกติ', 'คู่ขนาน', 'ทวิภาคี', 'เรียนร่วม'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- เพิ่มฟิลด์สมรรถนะเพิ่มเติมในห้องเรียนและครูผู้สอน
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 40;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS max_hours INTEGER DEFAULT 20;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS unavailable_time TEXT DEFAULT '';

-- ── Row Level Security ────────────────────────────────────
ALTER TABLE teaching_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE students        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON teaching_loads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON registrations   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON students        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON rooms            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON student_groups   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON teachers         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON subjects         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON schedules        FOR ALL USING (true) WITH CHECK (true);
*/
