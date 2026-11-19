# 🚀 คู่มือการนำ EduSched AI ขึ้นระบบคลาวด์ (Cloud Deployment Guide)

ตามเกณฑ์การประเมินการแข่งขัน **หมวด 3.5.3 D: ติดตั้งและใช้งานจริง (Deploy & Ops)**:
- ออนไลน์พร้อมใช้งานครบทุกฟังก์ชัน = **2 คะแนนเต็ม**
- ออฟไลน์/เครื่องพัฒนาใช้งานได้ครบ = 1 คะแนน

ระบบ EduSched AI เป็นเว็บแอปพลิเคชันแบบ Static SPA (HTML5/CSS3/Vanilla JS) โดยใช้ Supabase PostgreSQL เป็นฐานข้อมูลบนคลาวด์อยู่แล้ว จึงสามารถ Deploy ออนไลน์ได้ฟรีภายใน 1-2 นาที ผ่านผู้ให้บริการดังต่อไปนี้:

---

## วิธีที่ 1: Deploy ผ่าน Vercel (แนะนำ - สะดวกและเร็วที่สุด)

### ผ่านหน้าเว็บ Vercel (ไม่ต้องใช้ Terminal):
1. นำโค้ดขึ้น GitHub Repository
2. เข้าสู่ระบบที่ [https://vercel.com](https://vercel.com)
3. กด **Add New Project** -> เลือก Repository นี้
4. ในช่อง Framework Preset เลือกเป็น **Other** (หรือคงเดิม)
5. กด **Deploy** -> ได้ URL ใช้งานจริงทันที เช่น `https://edusched-ai.vercel.app`

### หรือผ่าน Terminal CLI:
```bash
npx vercel --prod
```

---

## วิธีที่ 2: Deploy ผ่าน Netlify

### ผ่านหน้าเว็บ Netlify:
1. เข้า [https://app.netlify.com](https://app.netlify.com)
2. ลากโฟลเดอร์โครงงาน (`winner`) ทั้งโฟลเดอร์ไปวางที่ **"Drag and drop your site output folder here"**
3. ระบบจะสร้าง URL ให้ออนไลน์ทันที พร้อมใช้งาน 100%

---

## วิธีที่ 3: GitHub Pages (ฟรี 100% ใน GitHub)

1. เข้าไปที่แท็บ **Settings** ของ Repository บน GitHub
2. เมนูด้านซ้ายเลือก **Pages**
3. ในหัวข้อ *Build and deployment* -> *Source* เลือก **Deploy from a branch**
4. เลือก Branch `main` โฟลเดอร์ `/ (root)` แล้วกด **Save**
5. รอ 1 นาที จะได้ URL เช่น `https://<username>.github.io/<repo-name>/`

---

## การตรวจสอบความพร้อมก่อนส่งกรรมการ (Online Readiness Checklist)

- [x] โครงสร้างฐานข้อมูล Supabase รันออนไลน์อยู่แล้ว (`abbasgbtgyyxvpztnrfe.supabase.co`)
- [x] ทดสอบการจัดตารางแบบ AI อัตโนมัติ (Zero Collision)
- [x] ทดสอบส่งออกไฟล์: **PDF (A4 Landscape)**, **Excel (.xlsx)**, **CSV**, **iCalendar (.ics)**
- [x] ทดสอบการค้นหาและกรองตาราง 5 มิติ (กลุ่มเรียน, นักเรียนรายบุคคล, ครู, ห้องเรียน, รายวิชา)
- [x] ทดสอบระบบตรวจสอบและ Hash รับรองผล (FNV-1a Fingerprint)
- [x] ทดสอบ Live Benchmark และ Stress Test 1,248 กฎ

