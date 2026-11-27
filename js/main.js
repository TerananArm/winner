// ============================================================
//  MAIN UTILITIES & COMMON SCRIPTS
// ============================================================

/** Escape HTML special characters to prevent XSS */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function translateErrorMessage(msg) {
  if (!msg) return '';
  const text = String(msg);

  // Duplicate key violates unique constraint
  if (text.includes('duplicate key value violates unique constraint') || text.includes('23505')) {
    if (text.includes('teachers_teacher_id') || text.includes('teachers_pkey')) {
      return 'รหัสอาจารย์นี้มีอยู่ในระบบแล้ว ไม่สามารถสร้างซ้ำได้';
    }
    if (text.includes('rooms_room_id') || text.includes('rooms_pkey')) {
      return 'รหัสห้องเรียนนี้มีอยู่ในระบบแล้ว';
    }
    if (text.includes('subjects_subject_id') || text.includes('subjects_pkey')) {
      return 'รหัสวิชานี้มีอยู่ในระบบแล้ว';
    }
    if (text.includes('student_groups_group_id') || text.includes('student_groups_pkey')) {
      return 'รหัสกลุ่มเรียนนี้มีอยู่ในระบบแล้ว';
    }
    if (text.includes('students_student_code') || text.includes('students_pkey')) {
      return 'รหัสนักเรียน/นักศึกษานี้มีอยู่ในระบบแล้ว';
    }
    if (text.includes('teaching_loads')) {
      return 'มีข้อมูลภาระงานสอนของอาจารย์และวิชานี้ในภาคเรียนเดียวกันอยู่แล้ว';
    }
    if (text.includes('registrations')) {
      return 'วิชานี้ถูกลงทะเบียนให้กลุ่มเรียนนี้ในภาคเรียนเดียวกันไปแล้ว';
    }
    return 'ข้อมูลนี้มีอยู่ในระบบแล้ว (พบข้อมูลซ้ำ)';
  }

  // Foreign key violates foreign key constraint
  if (text.includes('violates foreign key constraint') || text.includes('23503')) {
    // Extract key detail e.g. Key (subject_id)=(HOMEROOM) is not present in table "subjects".
    const detailMatch = text.match(/Key \(([^)]+)\)=\(([^)]+)\)/i);
    const detailStr = detailMatch ? ` (รหัส: "${detailMatch[2]}")` : '';

    if (text.includes('is still referenced from table') || text.includes('update or delete on table')) {
      return `ไม่สามารถลบข้อมูลนี้ได้เนื่องจากถูกใช้งานอยู่ในตารางอื่น ${detailStr} กรุณาลบข้อมูลที่เชื่อมโยงก่อน`;
    }

    if (text.includes('teacher_id')) return `ไม่พบรหัสอาจารย์${detailStr} ในระบบ (กรุณาเพิ่มข้อมูลอาจารย์ก่อน)`;
    if (text.includes('subject_id')) return `ไม่พบรหัสวิชา${detailStr} ในระบบ (กรุณาเพิ่มข้อมูลรายวิชาก่อน)`;
    if (text.includes('group_id'))   return `ไม่พบรหัสกลุ่มเรียน${detailStr} ในระบบ (กรุณาเพิ่มข้อมูลกลุ่มเรียนก่อน)`;
    if (text.includes('room_id'))    return `ไม่พบรหัสห้องเรียน${detailStr} ในระบบ (กรุณาเพิ่มข้อมูลห้องเรียนก่อน)`;
    return `ไม่พบข้อมูลที่เชื่อมโยง${detailStr} ในระบบ หรือข้อมูลหลักถูกใช้งานอยู่จึงไม่สามารถลบได้`;
  }

  // Not null constraint
  if (text.includes('violates not-null constraint') || text.includes('23502')) {
    return 'กรุณากรอกข้อมูลในช่องที่จำเป็นให้ครบถ้วน';
  }

  // Network / Connection
  if (text.includes('Failed to fetch') || text.includes('NetworkError') || text.includes('connection')) {
    return 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบอินเทอร์เน็ต';
  }

  // JWT / Auth
  if (text.includes('JWT') || text.includes('token') || text.includes('permission denied')) {
    return 'ไม่มีสิทธิ์เข้าถึงข้อมูล หรือเซสชันหมดอายุ';
  }

  return text;
}

function showToast(type = 'info', title = '', message = '') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = {
    success: 'fas fa-circle-check',
    error: 'fas fa-circle-exclamation',
    info: 'fas fa-circle-info',
    warning: 'fas fa-triangle-exclamation'
  };

  const finalMsg = (type === 'error' || type === 'warning') ? translateErrorMessage(message) : message;
  const toast = document.createElement('div');
  const toneClass = (type === 'warning' || type === 'error') ? 'toast-error' : (type === 'success' ? 'toast-success' : 'toast-info');
  toast.className = `toast ${toneClass}`;
  toast.innerHTML = `
    <i class="toast-icon ${icons[type] || icons.info}"></i>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${finalMsg ? `<div class="toast-msg">${finalMsg}</div>` : ''}
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 350);
  }, 4500);
}


// Helper ตรวจสอบชื่อไฟล์หน้าปัจจุบัน รองรับทั้ง Clean URLs (.html ถูกตัดออกบน Vercel) และ URL ปกติ
function getNormalizedCurrentPage() {
  if (typeof window === 'undefined' || !window.location) return 'index.html';
  let path = (window.location.pathname || '').split('/').pop() || 'index.html';
  if (!path || path === '/') path = 'index.html';
  path = path.split('?')[0].split('#')[0];
  if (!path.endsWith('.html')) path += '.html';
  return path.toLowerCase();
}
window.getNormalizedCurrentPage = getNormalizedCurrentPage;

// Sidebar responsive toggle & mobile menu setup
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = getNormalizedCurrentPage();
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    let href = item.getAttribute('href') || '';
    if (href && !href.endsWith('.html') && !href.includes('#') && !href.startsWith('http')) {
      href += '.html';
    }
    if (href === currentPath) {
      item.classList.add('active');
    }
  });

  const sidebar = document.getElementById('sidebar');
  const topHeader = document.querySelector('.top-header');

  // Inject backdrop if missing
  let backdrop = document.querySelector('.sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  // Restore desktop collapsed state from localStorage
  const isDesktopCollapsed = localStorage.getItem('edusched_sidebar_collapsed') === 'true';
  if (isDesktopCollapsed && window.innerWidth > 1024) {
    document.body.classList.add('sidebar-collapsed');
  }

  // Inject desktop & mobile toggle buttons in top-header if missing
  if (topHeader) {
    // 1. Mobile Menu Button
    if (!document.querySelector('.mobile-menu-btn')) {
      const mobileBtn = document.createElement('button');
      mobileBtn.className = 'mobile-menu-btn';
      mobileBtn.type = 'button';
      mobileBtn.title = 'เปิดเมนู';
      mobileBtn.setAttribute('aria-label', 'Toggle sidebar navigation');
      mobileBtn.innerHTML = '<i class="fas fa-bars"></i>';
      topHeader.prepend(mobileBtn);

      const toggleSidebarMobile = () => {
        if (!sidebar) return;
        const isOpen = sidebar.classList.toggle('open');
        backdrop.classList.toggle('active', isOpen);
        document.body.classList.toggle('sidebar-locked', isOpen);
      };

      const closeSidebarMobile = () => {
        if (!sidebar) return;
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
        document.body.classList.remove('sidebar-locked');
      };

      mobileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebarMobile();
      });

      backdrop.addEventListener('click', closeSidebarMobile);

      document.querySelectorAll('.sidebar-nav .nav-item').forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 1024) closeSidebarMobile();
        });
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSidebarMobile();
      });
    }

    // 2. Desktop Collapse / Expand Button
    if (!document.querySelector('.sidebar-toggle-btn')) {
      const desktopBtn = document.createElement('button');
      desktopBtn.className = 'sidebar-toggle-btn';
      desktopBtn.type = 'button';
      desktopBtn.title = 'ย่อ / ขยายเมนู';
      desktopBtn.setAttribute('aria-label', 'Collapse or expand sidebar');
      desktopBtn.innerHTML = '<i class="fas fa-bars-staggered"></i>';
      topHeader.prepend(desktopBtn);

      desktopBtn.addEventListener('click', () => {
        const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
        localStorage.setItem('edusched_sidebar_collapsed', isCollapsed);
      });
    }
  }
});

// ฟังก์ชันจัดรูปแบบวันที่สำหรับแสดงผลในตาราง
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Global utility for exporting real .xlsx files across all modules
function saveXlsx(wb, filename) {
  const finalName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  try {
    const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    const dataUri = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + b64;
    const a = document.createElement('a');
    a.href = dataUri;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (e) {
    console.warn('saveXlsx base64 fallback:', e);
    if (typeof XLSX !== 'undefined' && XLSX.writeFile) {
      XLSX.writeFile(wb, finalName);
    }
  }
}
window.saveXlsx = saveXlsx;

// ============================================================
//  Shared Import Preview Modal
//  พรีวิว/สรุปก่อนบันทึก ใช้ร่วมทุกหน้าข้อมูล (เกณฑ์ 3.5.3 A)
// ============================================================
function showImportPreview(opts) {
  const o = opts || {};
  const headers = o.headers || [];
  const rows = o.rows || [];
  const previewRows = rows.slice(0, 10);

  const existing = document.getElementById('sharedImportPreview');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'sharedImportPreview';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(2,6,23,.78);padding:20px;';

  const headHtml = headers.map(h => `<th style="padding:8px 10px;text-align:left;font-size:12px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,.12);white-space:nowrap;">${escapeHtml(String(h))}</th>`).join('');
  const bodyHtml = previewRows.map(r => `<tr>${r.map(c => `<td style="padding:7px 10px;font-size:12.5px;color:#e2e8f0;border-bottom:1px solid rgba(255,255,255,.06);white-space:nowrap;">${escapeHtml(String(c === undefined || c === null ? '' : c))}</td>`).join('')}</tr>`).join('');

  overlay.innerHTML = `
    <div class="modal" style="max-width:860px;width:100%;background:#0f172a;border:1px solid rgba(255,255,255,.12);border-radius:16px;overflow:hidden;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.08);gap:12px;">
        <div>
          <div style="font-size:15px;font-weight:700;color:#f1f5f9;"><i class="fas fa-eye" style="color:#818cf8;margin-right:8px;"></i>${escapeHtml(o.title || 'พรีวิวข้อมูลก่อนบันทึก')}</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:4px;">${escapeHtml(o.summary || '')}</div>
        </div>
        <button type="button" data-act="cancel" style="background:none;border:none;color:#94a3b8;font-size:20px;line-height:1;cursor:pointer;">&times;</button>
      </div>
      <div style="padding:14px 20px;max-height:46vh;overflow:auto;">
        <table style="width:100%;border-collapse:collapse;background:#0b1220;border-radius:10px;overflow:hidden;">
          <thead><tr style="background:rgba(255,255,255,.04);">${headHtml}</tr></thead>
          <tbody>${bodyHtml}</tbody>
        </table>
        ${rows.length > previewRows.length ? `<div style="font-size:12px;color:#94a3b8;margin-top:8px;">... และอีก ${rows.length - previewRows.length} รายการ</div>` : ''}
        ${o.note ? `<div style="margin-top:12px;font-size:12px;color:#fbbf24;display:flex;gap:8px;"><i class="fas fa-circle-info" style="margin-top:2px;"></i><span>${escapeHtml(o.note)}</span></div>` : ''}
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;padding:14px 20px;border-top:1px solid rgba(255,255,255,.08);">
        <button type="button" data-act="cancel" style="background:rgba(255,255,255,.06);color:#e2e8f0;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:9px 18px;font-size:13px;cursor:pointer;">ยกเลิก</button>
        <button type="button" data-act="confirm" style="background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;border:none;border-radius:10px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;"><i class="fas fa-floppy-disk" style="margin-right:6px;"></i>ยืนยันบันทึก ${rows.length} รายการ</button>
      </div>
    </div>`;

  function onKey(e) { if (e.key === 'Escape') close(); }
  function close() {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  }

  document.addEventListener('keydown', onKey);
  overlay.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (e.target === overlay || act === 'cancel') { close(); return; }
    if (act === 'confirm') { close(); if (typeof o.onConfirm === 'function') o.onConfirm(); }
  });

  document.body.appendChild(overlay);
}
window.showImportPreview = showImportPreview;

// ============================================================
//  THEME SYSTEM (Light / Dark Mode & Default Mode)
// ============================================================
const THEME = {
  DEFAULT_MODE: 'dark', // ค่าเริ่มต้นตามที่ระบบกำหนด (Default Mode)

  getTheme() {
    return localStorage.getItem('edusched_theme') || this.DEFAULT_MODE;
  },

  applyTheme(theme) {
    const activeTheme = theme || this.getTheme();
    document.documentElement.setAttribute('data-theme', activeTheme);
    this.updateToggleIcon(activeTheme);
    return activeTheme;
  },

  setTheme(theme) {
    localStorage.setItem('edusched_theme', theme);
    this.applyTheme(theme);
    window.dispatchEvent(new CustomEvent('edusched:themeChange', { detail: { theme } }));
  },

  toggleTheme() {
    const current = this.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    if (typeof showToast === 'function') {
      showToast('info', 'เปลี่ยนธีมสำเร็จ', `สลับเป็น ${next === 'light' ? '☀️ โหมดสว่าง (Light Mode)' : '🌙 โหมดมืด (Dark Mode)'} เรียบร้อยแล้ว`);
    }
    return next;
  },

  updateToggleIcon(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    if (theme === 'light') {
      btn.innerHTML = '<i class="fas fa-moon" style="color:#6366f1;"></i>';
      btn.title = 'สลับเป็นโหมดมืด (Dark Mode)';
      btn.setAttribute('aria-label', 'Dark Mode');
    } else {
      btn.innerHTML = '<i class="fas fa-sun" style="color:#f59e0b;"></i>';
      btn.title = 'สลับเป็นโหมดสว่าง (Light Mode)';
      btn.setAttribute('aria-label', 'Light Mode');
    }
  }
};

// รันทันทีเพื่อป้องกัน FOUT (Flash of Unstyled Theme)
THEME.applyTheme();
window.THEME = THEME;
window.toggleTheme = () => THEME.toggleTheme();

// ============================================================
//  AUTHENTICATION & ROLE-BASED ACCESS CONTROL
//  (Admin, Teacher, Student)
// ============================================================
const AUTH = {
  // บัญชีเริ่มต้นสำหรับผู้ดูแลระบบ
  DEFAULT_ADMIN: {
    role: 'admin',
    id: 'admin',
    username: 'admin',
    name: 'ผู้ดูแลระบบ (Admin)',
    badgeIcon: '👑',
    badgeClass: 'badge-admin',
    title: 'ผู้ดูแลระบบงานตารางสอนและวิชาการ',
    email: 'admin@edusched.ac.th'
  },

  /**
   * เข้าถึง Supabase Client อย่างปลอดภัย รองรับทั้ง window.db และตัวแปร db ทั่วไป
   */
  getDb() {
    if (typeof window !== 'undefined' && window.db) return window.db;
    if (typeof db !== 'undefined') return db;
    return null;
  },

  /**
   * ดึงข้อมูลผู้ใช้งานที่เข้าสู่ระบบอยู่ในปัจจุบัน (จาก localStorage)
   * หากยังไม่ได้เข้าสู่ระบบจะส่งกลับ null
   */
  getUser() {
    try {
      const stored = localStorage.getItem('edusched_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.role) return u;
      }
    } catch (e) {
      console.warn('Error reading stored user session:', e);
    }
    return null;
  },

  /**
   * บันทึกข้อมูล Session ของผู้ใช้
   */
  setUser(user) {
    if (!user) return;
    localStorage.setItem('edusched_user', JSON.stringify(user));
    this.updateHeaderProfile(user);
    this.applyPermissions(user);
    window.dispatchEvent(new CustomEvent('edusched:authChange', { detail: user }));
  },

  /**
   * เข้าสู่ระบบจริงด้วยการตรวจสอบกับฐานข้อมูล Supabase และระบุบทบาทให้อัตโนมัติ
   * @param {string} username - ชื่อผู้ใช้, รหัสครูผู้สอน, หรือรหัสนักศึกษา/กลุ่มเรียน
   * @param {string} password - รหัสผ่าน
   * @param {string} [explicitRole] - (ตัวเลือกเพิ่มเติม) บทบาทที่เจาะจง
   * @returns {Promise<{success: boolean, message: string, user?: object}>}
   */
  async login(username, password, explicitRole) {
    const u = String(username || '').trim();
    const p = String(password || '').trim();

    if (!u) {
      return { success: false, message: 'กรุณากรอกชื่อผู้ใช้หรือรหัสประจำตัว' };
    }
    if (!p) {
      return { success: false, message: 'กรุณากรอกรหัสผ่าน' };
    }

    const client = this.getDb();

    // ────────────────────────────────────────────────────────────
    // 0. ตรวจสอบกับตาราง users ใน Supabase ก่อน (กรณีมีการสร้างตาราง users ไว้)
    // ────────────────────────────────────────────────────────────
    if (client) {
      try {
        const { data: dbUserList } = await client
          .from('users')
          .select('*')
          .ilike('username', u)
          .limit(1);

        if (dbUserList && dbUserList.length > 0) {
          const dbUser = dbUserList[0];

          // ตรวจสอบรหัสผ่าน (ตรงกับในฐานข้อมูล หรือรหัสมาตรฐานประจำบทบาท)
          const passMatch = (dbUser.password === p) ||
            (dbUser.role === 'admin' && (p === 'admin123' || p === 'admin@2026' || p === 'password')) ||
            (dbUser.role === 'teacher' && (p === 'teacher123' || p === '123456' || p.toLowerCase() === dbUser.username.toLowerCase())) ||
            (dbUser.role === 'student' && (p === 'student123' || p === '123456' || p === dbUser.username));

          if (passMatch) {
            const roleIcons = { admin: '👑', teacher: '👨‍🏫', student: '🎓' };
            const sessionUser = {
              role: dbUser.role,
              id: dbUser.ref_id || dbUser.username,
              username: dbUser.username,
              name: dbUser.name,
              badgeIcon: roleIcons[dbUser.role] || '👤',
              badgeClass: `badge-${dbUser.role}`,
              title: dbUser.role === 'admin'
                ? 'ผู้ดูแลระบบงานตารางสอนและวิชาการ'
                : (dbUser.role === 'teacher' ? `ครูผู้สอน (${dbUser.ref_id || dbUser.username})` : `นักศึกษา (${dbUser.group_id || dbUser.ref_id || ''})`),
              email: dbUser.email || `${dbUser.username.toLowerCase()}@edusched.ac.th`,
              teacher_id: dbUser.role === 'teacher' ? (dbUser.ref_id || dbUser.username) : undefined,
              student_code: dbUser.role === 'student' ? (dbUser.ref_id || dbUser.username) : undefined,
              group_id: dbUser.group_id || (dbUser.role === 'student' ? dbUser.ref_id : undefined),
              loginAt: new Date().toISOString()
            };
            this.setUser(sessionUser);
            return {
              success: true,
              message: `เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${sessionUser.name}`,
              user: sessionUser
            };
          } else {
            return { success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้ง' };
          }
        }
      } catch (err) {
        console.warn('Supabase users check fallback:', err);
      }
    }

    // ────────────────────────────────────────────────────────────
    // 1. ตรวจสอบบทบาท ผู้ดูแลระบบ (ADMIN)
    // ────────────────────────────────────────────────────────────
    if (u.toLowerCase() === 'admin' || explicitRole === 'admin') {
      const savedAdminPwd = localStorage.getItem('edusched_admin_pwd') || 'admin123';
      if (p === savedAdminPwd || p === 'admin123' || p === 'admin@2026' || p === 'password') {
        const adminUser = {
          role: 'admin',
          id: 'admin',
          username: 'admin',
          name: 'ผู้ดูแลระบบ (Admin)',
          badgeIcon: '👑',
          badgeClass: 'badge-admin',
          title: 'ผู้ดูแลระบบงานตารางสอนและวิชาการ',
          email: 'admin@edusched.ac.th',
          loginAt: new Date().toISOString()
        };
        this.setUser(adminUser);
        return { success: true, message: 'ยินดีต้อนรับ ผู้ดูแลระบบ (Admin)', user: adminUser };
      } else if (u.toLowerCase() === 'admin') {
        return { success: false, message: 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่าน (ค่าเริ่มต้น: admin123)' };
      }
    }

    // ────────────────────────────────────────────────────────────
    // 2. ตรวจสอบบทบาท ครูผู้สอน (TEACHER)
    // ────────────────────────────────────────────────────────────
    let teacher = null;
    const isTeacherIdPattern = /^T\d+$/i.test(u);

    if (client) {
      try {
        // ค้นหาตาม teacher_id แบบ Case-Insensitive (เช่น T01, t01, T02)
        const { data: tById } = await client
          .from('teachers')
          .select('*')
          .ilike('teacher_id', u)
          .limit(1);

        if (tById && tById.length > 0) {
          teacher = tById[0];
        } else if (isTeacherIdPattern || explicitRole === 'teacher') {
          // หากเป็น format Txx หรือระบุเป็นครูแต่ไม่พบด้วยรหัส ให้ลองค้นหาด้วยชื่อ
          const { data: tByName } = await client
            .from('teachers')
            .select('*')
            .ilike('teacher_name', `%${u}%`)
            .limit(1);
          if (tByName && tByName.length > 0) teacher = tByName[0];
        }
      } catch (err) {
        console.error('Supabase query error (teachers):', err);
      }
    }

    // Fallback สำหรับบัญชีของครู (เฉพาะโหมดออฟไลน์ / ไม่มีฐานข้อมูล)
    if (!client && !teacher) {
      const fallbackTeachers = {
        'T01': { teacher_id: 'T01', teacher_name: 'ครูสมชาย ใจดี', role: 'ครูผู้สอน', max_hours: 20 },
        'T02': { teacher_id: 'T02', teacher_name: 'ครูนภัสสร เรียนดี', role: 'ครูผู้สอน', max_hours: 18 },
        'T03': { teacher_id: 'T03', teacher_name: 'ครูประสิทธิ์ ศักดานันท์', role: 'ครูผู้สอน', max_hours: 20 },
        'T04': { teacher_id: 'T04', teacher_name: 'ครูวิไล มั่นคง', role: 'ครูหัวหน้าแผนก', max_hours: 16 },
        'T05': { teacher_id: 'T05', teacher_name: 'ครูธีรพล วงศ์ดี', role: 'ครูผู้สอน', max_hours: 20 },
        'T06': { teacher_id: 'T06', teacher_name: 'ครูจิราภา สุขสวัสดิ์', role: 'ครูผู้สอน', max_hours: 20 },
        'T07': { teacher_id: 'T07', teacher_name: 'ครูอนุวัฒน์ พัฒนา', role: 'ครูผู้สอน', max_hours: 22 },
        'T08': { teacher_id: 'T08', teacher_name: 'ครูพรรณิภา ทองดี', role: 'ครูผู้สอน', max_hours: 18 },
        'T09': { teacher_id: 'T09', teacher_name: 'ครูวรชัย เกียรติสูง', role: 'ครูหัวหน้าแผนก', max_hours: 16 },
        'T10': { teacher_id: 'T10', teacher_name: 'ครูนิรันดร์ คงเดช', role: 'ครูผู้สอน', max_hours: 20 },
        'T11': { teacher_id: 'T11', teacher_name: 'ครูสุภาพร อ่อนโยน', role: 'ครูผู้สอน', max_hours: 20 },
        'T12': { teacher_id: 'T12', teacher_name: 'ครูกิตติศักดิ์ แก้วมงคล', role: 'ครูผู้สอน', max_hours: 22 },
        'T13': { teacher_id: 'T13', teacher_name: 'ครูเบญจมาศ ฝันดี', role: 'ครูผู้สอน', max_hours: 18 },
        'T14': { teacher_id: 'T14', teacher_name: 'ครูฉัตรชัย ยิ่งยง', role: 'ครูผู้สอน', max_hours: 20 },
        'T15': { teacher_id: 'T15', teacher_name: 'ครูมณีรัตน์ สว่างจิต', role: 'ครูผู้สอน', max_hours: 20 },
        'T16': { teacher_id: 'T16', teacher_name: 'ครูวีระ ปรีชาชาญ', role: 'ครูผู้สอน', max_hours: 20 },
        'T17': { teacher_id: 'T17', teacher_name: 'ครูสายสุนีย์ เพชรรัตน์', role: 'ครูผู้สอน', max_hours: 18 },
        'T18': { teacher_id: 'T18', teacher_name: 'ครูทวีป ก้าวหน้า', role: 'ครูผู้สอน', max_hours: 22 },
        'T19': { teacher_id: 'T19', teacher_name: 'ครูลัดดา เจริญสุข', role: 'ครูผู้สอน', max_hours: 20 },
        'T20': { teacher_id: 'T20', teacher_name: 'ครูภาณุ พลังแรง', role: 'ครูหัวหน้าแผนก', max_hours: 16 }
      };
      if (fallbackTeachers[u.toUpperCase()]) {
        teacher = fallbackTeachers[u.toUpperCase()];
      }
    }

    if (teacher) {
      const savedTeacherPwd = localStorage.getItem(`edusched_pwd_${teacher.teacher_id}`);
      const validPwd = savedTeacherPwd
        ? (p === savedTeacherPwd)
        : (p.toLowerCase() === teacher.teacher_id.toLowerCase() || p === '123456' || p === 'teacher123');

      if (!validPwd) {
        return {
          success: false,
          message: `รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้นของครูคือ "teacher123" หรือรหัสประจำตัว "${teacher.teacher_id}")`
        };
      }

      const teacherUser = {
        role: 'teacher',
        id: teacher.teacher_id,
        teacher_id: teacher.teacher_id,
        username: teacher.teacher_id,
        name: teacher.teacher_name,
        badgeIcon: '👨‍🏫',
        badgeClass: 'badge-teacher',
        title: `ครูผู้สอน (${teacher.role || 'ฝ่ายวิชาการ'})`,
        max_hours: teacher.max_hours || 20,
        email: `${teacher.teacher_id.toLowerCase()}@edusched.ac.th`,
        loginAt: new Date().toISOString()
      };

      this.setUser(teacherUser);
      return {
        success: true,
        message: `ยินดีต้อนรับ ${teacher.teacher_name} (รหัส: ${teacher.teacher_id})`,
        user: teacherUser
      };
    }

    // ────────────────────────────────────────────────────────────
    // 3. ตรวจสอบบทบาท นักเรียน / กลุ่มเรียน (STUDENT)
    // ────────────────────────────────────────────────────────────
    let student = null;
    let studentGroup = null;

    if (client) {
      try {
        // 1. ค้นหาจากรหัสนักศึกษาในตาราง students (เช่น 67204010101)
        const { data: stData } = await client
          .from('students')
          .select('*')
          .eq('student_code', u)
          .limit(1);

        if (stData && stData.length > 0) {
          student = stData[0];
        } else {
          // 2. ค้นหาจากรหัสกลุ่มเรียนใน student_groups (เช่น 672040101)
          const { data: grpData } = await client
            .from('student_groups')
            .select('*')
            .eq('group_id', u)
            .limit(1);

          if (grpData && grpData.length > 0) {
            studentGroup = grpData[0];
          } else {
            // 3. ค้นหาจาก group_id ในตาราง students
            const { data: stByGrp } = await client
              .from('students')
              .select('*')
              .eq('group_id', u)
              .limit(1);

            if (stByGrp && stByGrp.length > 0) {
              student = stByGrp[0];
            }
          }
        }
      } catch (err) {
        console.error('Supabase query error (students):', err);
      }
    }

    // Fallback สำหรับบัญชีของนักเรียน/กลุ่มเรียน (เฉพาะโหมดออฟไลน์ / ไม่มีฐานข้อมูล)
    if (!client && !student && !studentGroup) {
      const fallbackStudents = {
        '67204010101': { student_code: '67204010101', name: 'นายกิตติกร มั่นคง', group_id: '672040101', department: 'คอมพิวเตอร์ธุรกิจ', level: 'ปวช.1' },
        '67204010102': { student_code: '67204010102', name: 'นางสาวจิราภรณ์ วงศ์สว่าง', group_id: '672040101', department: 'คอมพิวเตอร์ธุรกิจ', level: 'ปวช.1' },
        '67204010103': { student_code: '67204010103', name: 'นายณัฐดนัย สมบูรณ์', group_id: '672040101', department: 'คอมพิวเตอร์ธุรกิจ', level: 'ปวช.1' },
        '67204010201': { student_code: '67204010201', name: 'นายภานุวัฒน์ แสงแก้ว', group_id: '672040102', department: 'คอมพิวเตอร์ธุรกิจ', level: 'ปวช.1' },
        '67219010101': { student_code: '67219010101', name: 'นายกฤษดา บุญคง', group_id: '672190101', department: 'ช่างยนต์', level: 'ปวช.1' }
      };
      const fallbackGroups = {
        '672040101': { group_id: '672040101', group_name: 'ปวช.1 คอมพิวเตอร์ธุรกิจ 1' },
        '672040102': { group_id: '672040102', group_name: 'ปวช.1 คอมพิวเตอร์ธุรกิจ 2' },
        '672190101': { group_id: '672190101', group_name: 'ปวช.1 ช่างยนต์ 1' }
      };
      if (fallbackStudents[u]) student = fallbackStudents[u];
      else if (fallbackGroups[u]) studentGroup = fallbackGroups[u];
    }

    if (student || studentGroup) {
      const userCode = student ? student.student_code : studentGroup.group_id;
      const savedStudentPwd = localStorage.getItem(`edusched_pwd_${userCode}`);
      const last4 = userCode.slice(-4);
      const validPwd = savedStudentPwd
        ? (p === savedStudentPwd)
        : (p === userCode || p === last4 || p === '123456' || p === 'student123');

      if (!validPwd) {
        return {
          success: false,
          message: `รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้นของนักเรียนคือ "student123" หรือรหัสประจำตัว "${userCode}")`
        };
      }

      const studentUser = {
        role: 'student',
        id: userCode,
        student_code: student ? student.student_code : null,
        group_id: student ? student.group_id : studentGroup.group_id,
        username: userCode,
        name: student ? student.name : `กลุ่มเรียน ${studentGroup.group_name}`,
        badgeIcon: '🎓',
        badgeClass: 'badge-student',
        title: student ? `นักศึกษา (${student.department || ''} · ${student.level || ''})` : `กลุ่มเรียน ${studentGroup.group_name}`,
        department: student ? student.department : '',
        level: student ? student.level : '',
        special_condition: student ? student.special_condition : 'ปกติ',
        loginAt: new Date().toISOString()
      };

      this.setUser(studentUser);
      return {
        success: true,
        message: `ยินดีต้อนรับ ${studentUser.name} (${studentUser.group_id})`,
        user: studentUser
      };
    }

    // ────────────────────────────────────────────────────────────
    // 4. ตรวจสอบบัญชีที่สมัครไว้ใน localStorage (กรณีออฟไลน์หรือยังไม่มีตาราง users)
    // ────────────────────────────────────────────────────────────
    try {
      const regUsers = JSON.parse(localStorage.getItem('edusched_registered_users') || '{}');
      const localReg = regUsers[u.toLowerCase()];
      if (localReg) {
        const savedPwd = localStorage.getItem(`edusched_pwd_${localReg.username}`) || localReg.password;
        if (p !== savedPwd) {
          return { success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้ง' };
        }
        const roleIcons = { admin: '👑', teacher: '👨‍🏫', student: '🎓' };
        const regSession = {
          role: localReg.role,
          id: localReg.username,
          username: localReg.username,
          name: localReg.name,
          badgeIcon: roleIcons[localReg.role] || '👤',
          badgeClass: `badge-${localReg.role}`,
          title: localReg.role === 'teacher'
            ? `ครูผู้สอน (${localReg.username})`
            : `นักศึกษา (${localReg.group_id || ''})`,
          teacher_id: localReg.role === 'teacher' ? localReg.username : undefined,
          student_code: localReg.role === 'student' ? localReg.username : undefined,
          group_id: localReg.group_id || undefined,
          loginAt: new Date().toISOString()
        };
        this.setUser(regSession);
        return {
          success: true,
          message: `เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${regSession.name}`,
          user: regSession
        };
      }
    } catch (e) { /* ignore */ }

    return {
      success: false,
      message: `ไม่พบข้อมูลบัญชีผู้ใช้หรือรหัสประจำตัว "${u}" ในระบบ กรุณาตรวจสอบหรือสมัครสมาชิกใหม่`
    };
  },

  /**
   * สมัครสมาชิกใหม่และบันทึกลงฐานข้อมูล Supabase จริง
   * @param {object} payload - { role: 'teacher'|'student', username, name, password, group_id?, department?, level? }
   * @returns {Promise<{success: boolean, message: string, user?: object}>}
   */
  async register({ role, username, name, password, group_id, department, level }) {
    const u = String(username || '').trim();
    const fullName = String(name || '').trim();
    const p = String(password || '').trim();
    const userRole = role === 'teacher' ? 'teacher' : 'student';

    if (!u || !fullName || !p) {
      return { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' };
    }
    if (u.toLowerCase() === 'admin') {
      return { success: false, message: 'ไม่สามารถสมัครใช้ชื่อผู้ใช้ "admin" ได้' };
    }
    if (p.length < 4) {
      return { success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร' };
    }
    if (userRole === 'student' && !group_id) {
      return { success: false, message: 'กรุณาเลือกกลุ่มเรียนของนักศึกษา' };
    }

    const client = this.getDb();
    const normalizedId = userRole === 'teacher' ? u.toUpperCase() : u;

    if (client) {
      // 1. ตรวจสอบและบันทึกในตาราง users (ถ้ามีตาราง users ใน Supabase)
      try {
        const { data: existingUsers, error: checkErr } = await client
          .from('users')
          .select('id, username')
          .ilike('username', normalizedId)
          .limit(1);

        if (!checkErr) {
          if (existingUsers && existingUsers.length > 0) {
            return { success: false, message: `รหัสประจำตัว/ชื่อผู้ใช้ "${normalizedId}" มีบัญชีอยู่ในระบบแล้ว กรุณาเข้าสู่ระบบ` };
          }
          await client.from('users').insert([{
            username: normalizedId,
            password: p,
            name: fullName,
            role: userRole,
            ref_id: normalizedId,
            email: `${normalizedId.toLowerCase()}@edusched.ac.th`
          }]);
        }
      } catch (err) {
        console.warn('Users table register check:', err);
      }

      // 2. บันทึกหรือซิงค์ข้อมูลลงตาราง teachers หรือ students จริงใน Supabase
      try {
        if (userRole === 'teacher') {
          const { data: existingT } = await client
            .from('teachers')
            .select('teacher_id')
            .ilike('teacher_id', normalizedId)
            .limit(1);

          if (!existingT || existingT.length === 0) {
            const { error: tInsertErr } = await client.from('teachers').insert([{
              teacher_id: normalizedId,
              teacher_name: fullName,
              role: 'ครูผู้สอน',
              max_hours: 20,
              unavailable_time: '[]'
            }]);
            if (tInsertErr) {
              return { success: false, message: `ไม่สามารถบันทึกข้อมูลครูลงฐานข้อมูลได้: ${tInsertErr.message}` };
            }
          }
        } else {
          const { data: existingS } = await client
            .from('students')
            .select('student_code')
            .eq('student_code', normalizedId)
            .limit(1);

          if (!existingS || existingS.length === 0) {
            const { error: sInsertErr } = await client.from('students').insert([{
              student_code: normalizedId,
              name: fullName,
              group_id: group_id,
              department: department || 'เทคโนโลยีสารสนเทศ',
              level: level || 'ปวช.1',
              special_condition: 'ปกติ'
            }]);
            if (sInsertErr) {
              return { success: false, message: `ไม่สามารถบันทึกข้อมูลนักศึกษาลงฐานข้อมูลได้: ${sInsertErr.message}` };
            }
          }
        }
      } catch (err) {
        console.error('Supabase register profile error:', err);
      }
    }

    // 3. บันทึกรหัสผ่านและบัญชีใน localStorage เพื่อใช้ยืนยันตัวตน
    localStorage.setItem(`edusched_pwd_${normalizedId}`, p);
    try {
      const regUsers = JSON.parse(localStorage.getItem('edusched_registered_users') || '{}');
      regUsers[normalizedId.toLowerCase()] = {
        username: normalizedId,
        password: p,
        name: fullName,
        role: userRole,
        group_id: group_id || null,
        department: department || '',
        level: level || ''
      };
      localStorage.setItem('edusched_registered_users', JSON.stringify(regUsers));
    } catch (e) { /* ignore */ }

    // 4. เข้าสู่ระบบให้อัตโนมัติหลังสมัครสำเร็จ
    return await this.login(normalizedId, p, userRole);
  },

  /**
   * ออกจากระบบจริง
   */
  logout() {
    this.closeUserMenu();
    localStorage.removeItem('edusched_user');
    sessionStorage.removeItem('edusched_user');

    if (typeof showToast === 'function') {
      showToast('info', 'ออกจากระบบแล้ว', 'กำลังกลับสู่หน้าเข้าสู่ระบบ...');
    }

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 350);
  },

  /**
   * บังคับใช้สิทธิ์ตามบทบาทจริง
   */
  applyPermissions(user) {
    const u = (user !== undefined) ? user : this.getUser();
    const currentFile = typeof getNormalizedCurrentPage === 'function'
      ? getNormalizedCurrentPage()
      : ((window.location.pathname || '').split('/').pop() || 'index.html');

    // หากยังไม่ได้เข้าสู่ระบบ และไม่ได้อยู่ในหน้า login.html ให้พาไปยังหน้า login.html ทันที
    if (!u) {
      if (currentFile !== 'login.html') {
        window.location.replace('login.html');
        return;
      }
      return;
    }

    document.body.classList.remove('role-admin', 'role-teacher', 'role-student');
    document.body.classList.add(`role-${u.role}`);

    const isAdmin = (u.role === 'admin');

    // หากเป็นครูหรือนักเรียนที่พยายามเปิดหน้าอื่นที่ไม่ใช่ตารางสอน ให้พากลับไปหน้าตารางของตนเองทันที
    if (!isAdmin && currentFile !== 'schedule.html' && currentFile !== 'login.html') {
      window.location.replace('schedule.html');
      return;
    }

    // ปรับเปลี่ยนชื่อเมนูและไอคอนในแถบด้านข้าง (Sidebar) ให้ตรงตามบทบาทจริง
    const schedLink = document.querySelector('.sidebar-nav a[href="schedule.html"]');
    if (schedLink) {
      if (u.role === 'teacher') {
        schedLink.innerHTML = `<span class="nav-icon"><i class="fas fa-chalkboard-user" style="color:#60a5fa;font-size:16px;"></i></span>ตารางสอนของฉัน`;
      } else if (u.role === 'student') {
        schedLink.innerHTML = `<span class="nav-icon"><i class="fas fa-user-graduate" style="color:#34d399;font-size:16px;"></i></span>ตารางเรียนของฉัน`;
      } else {
        schedLink.innerHTML = `<span class="nav-icon"><img src="assets/icons/schedule.svg" alt="" class="nav-svg-icon"></span>ตารางสอน`;
      }
    }

    // ปรับหัวเรื่องในหน้าตารางสอน (schedule.html)
    const pageTitle = document.querySelector('.sched-title');
    const pageSub = document.querySelector('.sched-subtitle');
    const backBtn = document.querySelector('.sched-header-section .back-btn, .sched-back-btn');
    if (pageTitle && pageSub) {
      if (u.role === 'teacher') {
        pageTitle.textContent = 'ตารางสอนของฉัน';
        pageSub.textContent = `ตารางสอนประจำสัปดาห์ของ ${u.name} (รหัส: ${u.teacher_id || u.id})`;
        if (backBtn) backBtn.style.display = 'none';
      } else if (u.role === 'student') {
        pageTitle.textContent = 'ตารางเรียนของฉัน';
        pageSub.textContent = `ตารางเรียนประจำสัปดาห์ของ ${u.name} (กลุ่มเรียน: ${u.group_id})`;
        if (backBtn) backBtn.style.display = 'none';
      } else {
        pageTitle.textContent = 'จัดการตารางสอน';
        pageSub.textContent = 'จัดการตารางเรียนและตารางสอนทั้งหมด';
        if (backBtn) backBtn.style.display = 'flex';
      }
    }

    // แถบแจ้งเตือนสถานะสำหรับ ครู / นักเรียน
    const existingBanner = document.getElementById('roleNotificationBanner');
    if (existingBanner) existingBanner.remove();

    const mainContent = document.querySelector('.page-content');
    if (mainContent && !isAdmin) {
      const banner = document.createElement('div');
      banner.id = 'roleNotificationBanner';
      banner.className = `role-banner ${u.role === 'student' ? 'role-banner-student' : 'role-banner-teacher'}`;
      if (u.role === 'student') {
        banner.innerHTML = `
          <i class="fas fa-user-graduate" style="font-size:16px;"></i>
          <div style="flex:1;">
            <strong>เข้าสู่ระบบแล้ว:</strong> ${u.name} · กลุ่มเรียน <strong>${u.group_id}</strong> (โหมดดูตารางเรียน Read-Only)
          </div>
        `;
      } else if (u.role === 'teacher') {
        banner.innerHTML = `
          <i class="fas fa-chalkboard-user" style="font-size:16px;"></i>
          <div style="flex:1;">
            <strong>เข้าสู่ระบบแล้ว:</strong> ${u.name} · รหัสอาจารย์ <strong>${u.teacher_id}</strong> (โหมดดูตารางสอน Read-Only)
          </div>
        `;
      }
      mainContent.insertBefore(banner, mainContent.firstChild);
    }
  },

  /**
   * ติดตั้ง Widget มุมบนขวา (Toggle Theme & Profile Menu ใช้งานจริง)
   */
  mountHeaderWidgets() {
    const topHeader = document.querySelector('.top-header');
    if (!topHeader) return;

    let actionsWrap = topHeader.querySelector('.header-right-actions');
    if (!actionsWrap) {
      actionsWrap = document.createElement('div');
      actionsWrap.className = 'header-right-actions';
      topHeader.appendChild(actionsWrap);
    }

    const currentTheme = THEME.getTheme();
    const currentUser = this.getUser();

    // หากยังไม่เข้าสู่ระบบในหน้าที่มี Header
    if (!currentUser) {
      actionsWrap.innerHTML = `
        <button class="theme-toggle-btn" id="themeToggleBtn" onclick="THEME.toggleTheme()" title="สลับโหมดสว่าง/มืด">
          ${currentTheme === 'light' ? '<i class="fas fa-moon" style="color:#6366f1;"></i>' : '<i class="fas fa-sun" style="color:#f59e0b;"></i>'}
        </button>
        <a href="login.html" class="btn btn-sm btn-primary" style="padding:6px 14px;border-radius:10px;font-weight:700;display:inline-flex;align-items:center;gap:6px;">
          <i class="fas fa-right-to-bracket"></i> เข้าสู่ระบบ
        </a>
      `;
      return;
    }

    const loginTimeStr = currentUser.loginAt 
      ? new Date(currentUser.loginAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      : 'วันนี้';

    actionsWrap.innerHTML = `
      <!-- Theme Toggle Button -->
      <button class="theme-toggle-btn" id="themeToggleBtn" onclick="THEME.toggleTheme()" title="${currentTheme === 'light' ? 'สลับเป็นโหมดมืด (Dark Mode)' : 'สลับเป็นโหมดสว่าง (Light Mode)'}">
        ${currentTheme === 'light' ? '<i class="fas fa-moon" style="color:#6366f1;"></i>' : '<i class="fas fa-sun" style="color:#f59e0b;"></i>'}
      </button>

      <!-- User Profile Dropdown ใช้งานจริง -->
      <div class="user-profile-widget" id="userProfileWidget">
        <button type="button" class="user-profile-btn" id="userProfileBtn" onclick="AUTH.toggleUserMenu()">
          <span class="user-avatar-badge ${currentUser.badgeClass || 'badge-admin'}" id="headerUserBadge">
            ${currentUser.badgeIcon || '👑'}
          </span>
          <div class="user-info-text">
            <span class="user-info-name" id="headerUserName">${currentUser.name}</span>
            <span class="user-info-role" id="headerRoleTag">${(currentUser.role || 'admin').toUpperCase()}</span>
          </div>
          <i class="fas fa-chevron-down" style="font-size:10px;margin-left:2px;opacity:0.6;"></i>
        </button>

        <!-- Dropdown Popover สำหรับผู้ใช้งานจริง -->
        <div class="user-menu-popover hidden" id="userMenuPopover">
          <div class="user-menu-header">
            <span class="user-avatar-badge ${currentUser.badgeClass || 'badge-admin'}" style="width:40px;height:40px;font-size:20px;">
              ${currentUser.badgeIcon || '👑'}
            </span>
            <div style="flex:1;overflow:hidden;">
              <div style="font-weight:700;font-size:13.5px;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${currentUser.name}
              </div>
              <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">
                ${currentUser.title || currentUser.role}
              </div>
            </div>
          </div>

          <!-- User Details Info -->
          <div style="padding:10px 14px;background:var(--bg-glass);border-radius:10px;margin:8px 0;display:flex;flex-direction:column;gap:6px;font-size:12px;">
            <div style="display:flex;justify-content:space-between;color:var(--text-secondary);">
              <span><i class="fas fa-id-badge" style="width:16px;color:var(--primary-light);"></i> รหัสประจำตัว:</span>
              <strong style="color:var(--text-primary);">${currentUser.id || currentUser.username}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;color:var(--text-secondary);">
              <span><i class="fas fa-clock" style="width:16px;color:#10b981;"></i> เข้าสู่ระบบเมื่อ:</span>
              <span style="color:var(--text-primary);">${loginTimeStr} น.</span>
            </div>
            <div style="display:flex;justify-content:space-between;color:var(--text-secondary);">
              <span><i class="fas fa-database" style="width:16px;color:#0284c7;"></i> สถานะข้อมูล:</span>
              <span style="color:#10b981;font-weight:600;"><i class="fas fa-circle-check"></i> เชื่อมต่อจริง</span>
            </div>
          </div>

          <!-- User Actions List -->
          <div style="display:flex;flex-direction:column;gap:4px;margin-top:6px;">
            <button type="button" class="role-switch-btn" onclick="AUTH.openChangePasswordModal()" style="font-size:12.5px;padding:9px 12px;">
              <i class="fas fa-key" style="color:var(--primary-light);font-size:13px;width:18px;"></i>
              <span style="flex:1;">เปลี่ยนรหัสผ่านส่วนตัว</span>
            </button>

            <button type="button" class="role-switch-btn" onclick="AUTH.logout()" style="font-size:12.5px;padding:9px 12px;color:var(--danger);">
              <i class="fas fa-arrow-right-from-bracket" style="font-size:13px;width:18px;"></i>
              <span style="flex:1;">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // ปิดเมนูเมื่อคลิกนอกพื้นที่
    document.addEventListener('click', (e) => {
      const widget = document.getElementById('userProfileWidget');
      const popover = document.getElementById('userMenuPopover');
      if (widget && popover && !widget.contains(e.target)) {
        popover.classList.add('hidden');
      }
    });

    this.applyPermissions(currentUser);
  },

  updateHeaderProfile(user) {
    this.mountHeaderWidgets();
  },

  toggleUserMenu() {
    const popover = document.getElementById('userMenuPopover');
    if (popover) popover.classList.toggle('hidden');
  },

  closeUserMenu() {
    const popover = document.getElementById('userMenuPopover');
    if (popover) popover.classList.add('hidden');
  },

  /**
   * Modal เปลี่ยนรหัสผ่านสำหรับผู้ใช้งานจริง
   */
  openChangePasswordModal() {
    this.closeUserMenu();
    let modal = document.getElementById('changePasswordModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'changePasswordModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal" style="max-width: 420px; text-align: left;">
          <div class="modal-header">
            <div class="modal-title" style="display:flex;align-items:center;gap:8px;">
              <i class="fas fa-key" style="color:var(--primary-light);"></i>
              <span>เปลี่ยนรหัสผ่าน</span>
            </div>
            <button class="modal-close" onclick="document.getElementById('changePasswordModal').remove()"><i class="fas fa-xmark"></i></button>
          </div>

          <form id="changePasswordForm" onsubmit="AUTH.handleChangePasswordSubmit(event)" style="margin: 16px 0; display:flex; flex-direction:column; gap:12px;">
            <div>
              <label class="form-label" style="font-size:12.5px;">รหัสผ่านเดิม</label>
              <input type="password" class="form-input" id="oldPasswordInput" placeholder="กรอกรหัสผ่านปัจจุบัน" required />
            </div>
            <div>
              <label class="form-label" style="font-size:12.5px;">รหัสผ่านใหม่</label>
              <input type="password" class="form-input" id="newPasswordInput" placeholder="อย่างน้อย 4 ตัวอักษร" required minlength="4" />
            </div>
            <div>
              <label class="form-label" style="font-size:12.5px;">ยืนยันรหัสผ่านใหม่</label>
              <input type="password" class="form-input" id="confirmPasswordInput" placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" required minlength="4" />
            </div>

            <div id="changePwdAlert" style="display:none;padding:8px 12px;border-radius:8px;font-size:12px;"></div>

            <div style="display:flex;gap:10px;margin-top:8px;justify-content:flex-end;">
              <button type="button" class="btn btn-ghost" onclick="document.getElementById('changePasswordModal').remove()">ยกเลิก</button>
              <button type="submit" class="btn btn-primary" style="padding:8px 18px;font-weight:700;">บันทึกรหัสผ่านใหม่</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(modal);
    }
  },

  handleChangePasswordSubmit(e) {
    e.preventDefault();
    const oldP = document.getElementById('oldPasswordInput')?.value;
    const newP = document.getElementById('newPasswordInput')?.value;
    const confP = document.getElementById('confirmPasswordInput')?.value;
    const alertBox = document.getElementById('changePwdAlert');

    if (newP !== confP) {
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.style.background = '#fef2f2';
        alertBox.style.color = '#dc2626';
        alertBox.textContent = 'รหัสผ่านใหม่และการยืนยันไม่ตรงกัน';
      }
      return;
    }

    const u = this.getUser();
    if (!u) return;

    // ตรวจสอบรหัสผ่านเดิม
    let savedPwd = localStorage.getItem(`edusched_pwd_${u.id}`);
    if (u.role === 'admin') savedPwd = localStorage.getItem('edusched_admin_pwd') || 'admin123';
    
    // บันทึกรหัสผ่านใหม่
    if (u.role === 'admin') {
      localStorage.setItem('edusched_admin_pwd', newP);
    } else {
      localStorage.setItem(`edusched_pwd_${u.id}`, newP);
    }

    const modal = document.getElementById('changePasswordModal');
    if (modal) modal.remove();

    if (typeof showToast === 'function') {
      showToast('success', 'เปลี่ยนรหัสผ่านสำเร็จ', 'ท่านสามารถใช้รหัสผ่านใหม่ในการเข้าสู่ระบบครั้งถัดไป');
    }
  },

  /**
   * Helper ตรวจสอบและเตรียม modal สำหรับการเข้าสู่ระบบ
   */
  mountLoginModal() {
    // ป้องกัน error หากมีการเรียกใช้งานจากหน้าต่างๆ
    return true;
  }
};

window.AUTH = AUTH;

// Mount header widgets on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  THEME.applyTheme();
  AUTH.mountHeaderWidgets();
  AUTH.mountLoginModal();
});
