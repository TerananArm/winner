-- ============================================================
--  EDUSCHED AI — USERS TABLE & AUTH CREDENTIALS SCHEMA
--  สร้างตารางบัญชีผู้ใช้งาน (users) และข้อมูลเริ่มต้นสำหรับแต่ละบทบาท
--  รันคำสั่งนี้ใน Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. สร้างตาราง users (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  ref_id TEXT, -- รหัสประจำตัวครู (T01) หรือรหัสนักศึกษา/กลุ่มเรียน
  group_id TEXT, -- กลุ่มเรียน (กรณีนักเรียน)
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. เปิดใช้งาน Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ลบนโยบายเดิมหากมีอยู่แล้ว
DROP POLICY IF EXISTS "Allow all users operations" ON users;
DROP POLICY IF EXISTS "Allow select users" ON users;

-- สร้างนโยบายอนุญาตให้ระบบอ่านและตรวจสอบสิทธิ์ได้
CREATE POLICY "Allow select users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Allow all users operations" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- 3. ข้อมูลบัญชีผู้ใช้เริ่มต้นสำหรับแต่ละบทบาท (Seed Data)
INSERT INTO users (username, password, name, role, ref_id, group_id, email) VALUES
  -- 👑 1. ผู้ดูแลระบบ (Administrator)
  ('admin', 'admin123', 'ผู้ดูแลระบบ (Admin)', 'admin', 'admin', NULL, 'admin@edusched.ac.th'),

  -- 👨‍🏫 2. ครูผู้สอน (Teachers — เชื่อมโยงกับตาราง teachers)
  ('T01', 'teacher123', 'ครูสมชาย ใจดี', 'teacher', 'T01', NULL, 't01@edusched.ac.th'),
  ('T02', 'teacher123', 'ครูนภัสสร เรียนดี', 'teacher', 'T02', NULL, 't02@edusched.ac.th'),
  ('T03', 'teacher123', 'ครูประสิทธิ์ ศักดานันท์', 'teacher', 'T03', NULL, 't03@edusched.ac.th'),
  ('T04', 'teacher123', 'ครูวิไล มั่นคง', 'teacher', 'T04', NULL, 't04@edusched.ac.th'),
  ('T05', 'teacher123', 'ครูธีรพล วงศ์ดี', 'teacher', 'T05', NULL, 't05@edusched.ac.th'),
  ('T06', 'teacher123', 'ครูจิราภา สุขสวัสดิ์', 'teacher', 'T06', NULL, 't06@edusched.ac.th'),
  ('T07', 'teacher123', 'ครูอนุวัฒน์ พัฒนา', 'teacher', 'T07', NULL, 't07@edusched.ac.th'),
  ('T08', 'teacher123', 'ครูพรรณิภา ทองดี', 'teacher', 'T08', NULL, 't08@edusched.ac.th'),
  ('T09', 'teacher123', 'ครูวรชัย เกียรติสูง', 'teacher', 'T09', NULL, 't09@edusched.ac.th'),
  ('T10', 'teacher123', 'ครูนิรันดร์ คงเดช', 'teacher', 'T10', NULL, 't10@edusched.ac.th'),

  -- 🎓 3. นักเรียน / นักศึกษา (Students — เชื่อมโยงกับตาราง students และ student_groups)
  ('67204010101', 'student123', 'นายกิตติกร มั่นคง', 'student', '67204010101', '672040101', '67204010101@edusched.ac.th'),
  ('67204010102', 'student123', 'นางสาวจิราภรณ์ วงศ์สว่าง', 'student', '67204010102', '672040101', '67204010102@edusched.ac.th'),
  ('67204010103', 'student123', 'นายณัฐดนัย สมบูรณ์', 'student', '67204010103', '672040101', '67204010103@edusched.ac.th'),
  ('67204010201', 'student123', 'นายภานุวัฒน์ แสงแก้ว', 'student', '67204010201', '672040102', '67204010201@edusched.ac.th'),
  ('67219010101', 'student123', 'นายกฤษดา บุญคง', 'student', '67219010101', '672190101', '67219010101@edusched.ac.th'),

  -- 🎓 กลุ่มเรียน (เข้าดูตารางเรียนประจำห้อง)
  ('672040101', 'student123', 'ปวช.1 คอมพิวเตอร์ธุรกิจ 1', 'student', '672040101', '672040101', 'group672040101@edusched.ac.th'),
  ('672040102', 'student123', 'ปวช.1 คอมพิวเตอร์ธุรกิจ 2', 'student', '672040102', '672040102', 'group672040102@edusched.ac.th'),
  ('672190101', 'student123', 'ปวช.1 ช่างยนต์ 1', 'student', '672190101', '672190101', 'group672190101@edusched.ac.th')
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  ref_id = EXCLUDED.ref_id,
  group_id = EXCLUDED.group_id,
  email = EXCLUDED.email,
  updated_at = NOW();

-- ตรวจสอบผลลัพธ์
SELECT username, name, role, ref_id, email FROM users ORDER BY role, username;
