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


// Sidebar responsive toggle & mobile menu setup
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    const href = item.getAttribute('href');
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
  DEMO_ACCOUNTS: {
    admin: {
      role: 'admin',
      id: 'admin',
      username: 'admin',
      name: 'ผู้ดูแลระบบ (Admin)',
      badgeIcon: '👑',
      badgeClass: 'badge-admin',
      title: 'ผู้ดูแลระบบ (Administrator)',
      email: 'admin@edusched.ac.th'
    },
    teacher: {
      role: 'teacher',
      id: 'T01',
      teacher_id: 'T01',
      username: 'T01',
      name: 'ครูสมชาย ใจดี',
      badgeIcon: '👨‍🏫',
      badgeClass: 'badge-teacher',
      title: 'ครูผู้สอน (Teacher: T01)',
      email: 'somchai.j@edusched.ac.th'
    },
    student: {
      role: 'student',
      id: '672190102',
      group_id: '672190102',
      username: '672190102',
      name: 'นักศึกษา (ปวช.1 ช่างยนต์ 2)',
      badgeIcon: '🎓',
      badgeClass: 'badge-student',
      title: 'นักเรียน/นักศึกษา (Student: 2 ทส 2)',
      email: 'student.672190102@edusched.ac.th'
    }
  },

  getUser() {
    try {
      const stored = localStorage.getItem('edusched_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Error reading stored user:', e);
    }
    // Default: เข้าใช้งานเริ่มต้นในฐานะ Admin เพื่อความต่อเนื่องของระบบ
    return this.DEMO_ACCOUNTS.admin;
  },

  setUser(user) {
    if (!user) return;
    localStorage.setItem('edusched_user', JSON.stringify(user));
    this.updateHeaderProfile(user);
    this.applyPermissions(user);
    window.dispatchEvent(new CustomEvent('edusched:authChange', { detail: user }));
  },

  quickSwitch(roleKey) {
    const targetUser = this.DEMO_ACCOUNTS[roleKey];
    if (!targetUser) return;
    this.setUser(targetUser);
    this.closeUserMenu();

    if (typeof showToast === 'function') {
      showToast('success', 'สลับบทบาทสำเร็จ', `เข้าใช้งานในฐานะ: ${targetUser.name} (${targetUser.role.toUpperCase()})`);
    }

    // หากอยู่ในหน้า schedule.html ให้ปรับมุมมองและรีเฟรชตารางตามบทบาท
    if (window.location.pathname.includes('schedule') && window.SCHED) {
      if (targetUser.role === 'teacher') {
        const viewSel = document.getElementById('sched-view-type');
        const targetSel = document.getElementById('sched-target-select');
        if (viewSel) {
          viewSel.value = 'teacher';
          if (typeof SCHED.onViewTypeChange === 'function') SCHED.onViewTypeChange();
          setTimeout(() => {
            if (targetSel && targetUser.teacher_id) {
              targetSel.value = targetUser.teacher_id;
              if (typeof SCHED.onTargetChange === 'function') SCHED.onTargetChange();
            }
          }, 100);
        }
      } else if (targetUser.role === 'student') {
        const viewSel = document.getElementById('sched-view-type');
        const targetSel = document.getElementById('sched-target-select');
        if (viewSel) {
          viewSel.value = 'student';
          if (typeof SCHED.onViewTypeChange === 'function') SCHED.onViewTypeChange();
          setTimeout(() => {
            if (targetSel && targetUser.group_id) {
              targetSel.value = targetUser.group_id;
              if (typeof SCHED.onTargetChange === 'function') SCHED.onTargetChange();
            }
          }, 100);
        }
      }
    }
  },

  login(username, password, role) {
    const u = String(username || '').trim();
    const p = String(password || '').trim();

    // ตัวเลือกเข้าสู่ระบบ
    if (role === 'admin' || u === 'admin') {
      if (p === 'admin123' || p === 'password' || p === '') {
        this.setUser(this.DEMO_ACCOUNTS.admin);
        this.closeLoginModal();
        showToast('success', 'เข้าสู่ระบบสำเร็จ', 'ยินดีต้อนรับ ผู้ดูแลระบบ (Admin)');
        return true;
      }
    } else if (role === 'teacher' || u.startsWith('T') || u === 'teacher') {
      const teacherObj = {
        ...this.DEMO_ACCOUNTS.teacher,
        id: u.startsWith('T') ? u : 'T01',
        teacher_id: u.startsWith('T') ? u : 'T01',
        username: u
      };
      this.setUser(teacherObj);
      this.closeLoginModal();
      showToast('success', 'เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับ ครูผู้สอน (รหัส: ${teacherObj.id})`);
      return true;
    } else if (role === 'student' || u === 'student' || /^[0-9]+$/.test(u)) {
      const studentObj = {
        ...this.DEMO_ACCOUNTS.student,
        id: u,
        group_id: u.length >= 8 ? u : '672190102',
        username: u
      };
      this.setUser(studentObj);
      this.closeLoginModal();
      showToast('success', 'เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับ นักศึกษา (กลุ่ม: ${studentObj.group_id})`);
      return true;
    }

    showToast('error', 'เข้าสู่ระบบไม่สำเร็จ', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    return false;
  },

  logout() {
    this.closeUserMenu();
    // เมื่อออกจากระบบ จะเปิด Modal เข้าสู่ระบบ หรือสลับไปเป็น Guest
    showToast('info', 'ออกจากระบบแล้ว', 'กรุณาเลือกบทบาทหรือเข้าสู่ระบบเพื่อดำเนินการต่อ');
    this.openLoginModal();
  },

  applyPermissions(user) {
    const u = user || this.getUser();
    document.body.classList.remove('role-admin', 'role-teacher', 'role-student');
    document.body.classList.add(`role-${u.role}`);

    // จัดการข้อความแจ้งเตือนสำหรับ student / teacher
    const existingBanner = document.getElementById('roleNotificationBanner');
    if (existingBanner) existingBanner.remove();

    const mainContent = document.querySelector('.page-content');
    if (mainContent && (u.role === 'student' || u.role === 'teacher')) {
      const banner = document.createElement('div');
      banner.id = 'roleNotificationBanner';
      banner.className = `role-banner ${u.role === 'student' ? 'role-banner-student' : 'role-banner-teacher'}`;
      if (u.role === 'student') {
        banner.innerHTML = `
          <i class="fas fa-user-graduate" style="font-size:16px;"></i>
          <div style="flex:1;">
            <strong>โหมดนักเรียน/นักศึกษา:</strong> เข้าใช้งานในกลุ่มเรียน <strong>${u.group_id || '672190102'}</strong> (แสดงผลตารางเรียนแบบอ่านอย่างเดียว)
          </div>
          <button class="btn btn-xs btn-ghost" onclick="AUTH.quickSwitch('admin')" style="font-size:11.5px;padding:4px 8px;">สลับเป็น Admin</button>
        `;
      } else if (u.role === 'teacher') {
        banner.innerHTML = `
          <i class="fas fa-chalkboard-user" style="font-size:16px;"></i>
          <div style="flex:1;">
            <strong>โหมดครูผู้สอน:</strong> เข้าใช้งานในนาม <strong>${u.name} (รหัส: ${u.teacher_id || 'T01'})</strong>
          </div>
          <button class="btn btn-xs btn-ghost" onclick="AUTH.quickSwitch('admin')" style="font-size:11.5px;padding:4px 8px;">สลับเป็น Admin</button>
        `;
      }
      mainContent.insertBefore(banner, mainContent.firstChild);
    }
  },

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

    actionsWrap.innerHTML = `
      <!-- Theme Toggle Button -->
      <button class="theme-toggle-btn" id="themeToggleBtn" onclick="THEME.toggleTheme()" title="${currentTheme === 'light' ? 'สลับเป็นโหมดมืด (Dark Mode)' : 'สลับเป็นโหมดสว่าง (Light Mode)'}">
        ${currentTheme === 'light' ? '<i class="fas fa-moon" style="color:#6366f1;"></i>' : '<i class="fas fa-sun" style="color:#f59e0b;"></i>'}
      </button>

      <!-- User Profile Dropdown -->
      <div class="user-profile-widget" id="userProfileWidget">
        <button type="button" class="user-profile-btn" id="userProfileBtn" onclick="AUTH.toggleUserMenu()">
          <span class="user-avatar-badge ${currentUser.badgeClass || 'badge-admin'}" id="headerUserBadge">
            ${currentUser.badgeIcon || '👑'}
          </span>
          <div class="user-info-text">
            <span class="user-info-name" id="headerUserName">${currentUser.name || 'ผู้ดูแลระบบ'}</span>
            <span class="user-info-role" id="headerRoleTag">${(currentUser.role || 'admin').toUpperCase()}</span>
          </div>
          <i class="fas fa-chevron-down" style="font-size:10px;margin-left:2px;opacity:0.6;"></i>
        </button>

        <!-- Dropdown Popover -->
        <div class="user-menu-popover hidden" id="userMenuPopover">
          <div class="user-menu-header">
            <span class="user-avatar-badge ${currentUser.badgeClass || 'badge-admin'}" style="width:36px;height:36px;font-size:18px;">
              ${currentUser.badgeIcon || '👑'}
            </span>
            <div style="flex:1;overflow:hidden;">
              <div style="font-weight:700;font-size:13px;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${currentUser.name}
              </div>
              <div style="font-size:11px;color:var(--text-muted);">
                ${currentUser.title || currentUser.role}
              </div>
            </div>
          </div>

          <div>
            <div class="user-menu-title"><i class="fas fa-shuffle" style="margin-right:4px;"></i> สลับบทบาทด่วน (Quick Role Switch)</div>
            <div class="role-switcher-list">
              <button type="button" class="role-switch-btn ${currentUser.role === 'admin' ? 'active' : ''}" onclick="AUTH.quickSwitch('admin')">
                <span class="user-avatar-badge badge-admin" style="width:24px;height:24px;font-size:12px;">👑</span>
                <div style="flex:1;">
                  <div style="font-weight:600;">ผู้ดูแลระบบ (Admin)</div>
                  <div style="font-size:11px;color:var(--text-muted);">จัดการเต็มรูปแบบ จัดตารางอัตโนมัติ</div>
                </div>
                ${currentUser.role === 'admin' ? '<i class="fas fa-check" style="color:var(--primary-light);"></i>' : ''}
              </button>

              <button type="button" class="role-switch-btn ${currentUser.role === 'teacher' ? 'active' : ''}" onclick="AUTH.quickSwitch('teacher')">
                <span class="user-avatar-badge badge-teacher" style="width:24px;height:24px;font-size:12px;">👨‍🏫</span>
                <div style="flex:1;">
                  <div style="font-weight:600;">ครูผู้สอน (Teacher)</div>
                  <div style="font-size:11px;color:var(--text-muted);">ดูตารางสอน & ภาระงานสอนส่วนตัว</div>
                </div>
                ${currentUser.role === 'teacher' ? '<i class="fas fa-check" style="color:var(--primary-light);"></i>' : ''}
              </button>

              <button type="button" class="role-switch-btn ${currentUser.role === 'student' ? 'active' : ''}" onclick="AUTH.quickSwitch('student')">
                <span class="user-avatar-badge badge-student" style="width:24px;height:24px;font-size:12px;">🎓</span>
                <div style="flex:1;">
                  <div style="font-weight:600;">นักเรียน/นักศึกษา (Student)</div>
                  <div style="font-size:11px;color:var(--text-muted);">ดูตารางเรียนกลุ่มเรียน (Read-Only)</div>
                </div>
                ${currentUser.role === 'student' ? '<i class="fas fa-check" style="color:var(--primary-light);"></i>' : ''}
              </button>
            </div>
          </div>

          <div class="user-menu-footer">
            <a href="login.html" style="font-size:12px;color:var(--primary-light);text-decoration:none;display:flex;align-items:center;gap:5px;">
              <i class="fas fa-arrow-right-to-bracket"></i> หน้า Login เต็ม
            </a>
            <button type="button" class="btn btn-xs btn-ghost" onclick="AUTH.logout()" style="color:var(--danger);border-color:rgba(239,68,68,0.25);">
              <i class="fas fa-right-from-bracket" style="margin-right:4px;"></i> ออกจากระบบ
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
    const badge = document.getElementById('headerUserBadge');
    const name = document.getElementById('headerUserName');
    const tag = document.getElementById('headerRoleTag');
    if (badge) {
      badge.textContent = user.badgeIcon || '👑';
      badge.className = `user-avatar-badge ${user.badgeClass || 'badge-admin'}`;
    }
    if (name) name.textContent = user.name || 'ผู้ดูแลระบบ';
    if (tag) tag.textContent = (user.role || 'admin').toUpperCase();
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

  mountLoginModal() {
    if (document.getElementById('appLoginModal')) return;

    const modal = document.createElement('div');
    modal.id = 'appLoginModal';
    modal.className = 'modal-overlay hidden';
    modal.innerHTML = `
      <div class="modal" style="max-width: 440px; text-align: left;">
        <div class="modal-header">
          <div class="modal-title" style="display:flex;align-items:center;gap:10px;">
            <i class="fas fa-lock" style="color:var(--primary-light);"></i>
            <span>เข้าสู่ระบบ EduSched AI</span>
          </div>
          <button class="modal-close" onclick="AUTH.closeLoginModal()"><i class="fas fa-xmark"></i></button>
        </div>

        <div style="margin: 16px 0;">
          <!-- Role Tabs -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:16px;">
            <button type="button" class="btn btn-ghost" id="tabAdmin" onclick="AUTH.setModalTab('admin')" style="font-size:12px;padding:8px 4px;font-weight:600;background:var(--primary-subtle);border-color:var(--border-glow);color:var(--primary-light);">
              👑 Admin
            </button>
            <button type="button" class="btn btn-ghost" id="tabTeacher" onclick="AUTH.setModalTab('teacher')" style="font-size:12px;padding:8px 4px;font-weight:600;">
              👨‍🏫 ครูผู้สอน
            </button>
            <button type="button" class="btn btn-ghost" id="tabStudent" onclick="AUTH.setModalTab('student')" style="font-size:12px;padding:8px 4px;font-weight:600;">
              🎓 นักเรียน
            </button>
          </div>

          <form id="modalLoginForm" onsubmit="AUTH.handleFormSubmit(event)" style="display:flex;flex-direction:column;gap:12px;">
            <div>
              <label class="form-label" id="modalUserLabel" style="font-size:12.5px;">ชื่อผู้ใช้ / รหัสประจำตัว</label>
              <input type="text" class="form-input" id="modalUsername" placeholder="admin" value="admin" required />
            </div>
            <div>
              <label class="form-label" style="font-size:12.5px;">รหัสผ่าน</label>
              <input type="password" class="form-input" id="modalPassword" placeholder="••••••••" value="admin123" required />
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top:4px;padding:10px;font-weight:700;">
              <i class="fas fa-right-to-bracket" style="margin-right:6px;"></i> เข้าสู่ระบบ
            </button>
          </form>

          <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:8px;">
            <div style="font-size:11.5px;color:var(--text-muted);text-align:center;">หรือคลิกเข้าใช้งานด่วน (สำหรับกรรมการ/ทดสอบ):</div>
            <div style="display:flex;gap:6px;">
              <button type="button" class="btn btn-xs btn-ghost" onclick="AUTH.quickSwitch('admin');AUTH.closeLoginModal();" style="flex:1;">👑 Admin</button>
              <button type="button" class="btn btn-xs btn-ghost" onclick="AUTH.quickSwitch('teacher');AUTH.closeLoginModal();" style="flex:1;">👨‍🏫 ครู</button>
              <button type="button" class="btn btn-xs btn-ghost" onclick="AUTH.quickSwitch('student');AUTH.closeLoginModal();" style="flex:1;">🎓 นักเรียน</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  activeModalRole: 'admin',

  setModalTab(role) {
    this.activeModalRole = role;
    const tabAdmin = document.getElementById('tabAdmin');
    const tabTeacher = document.getElementById('tabTeacher');
    const tabStudent = document.getElementById('tabStudent');
    const userLabel = document.getElementById('modalUserLabel');
    const userInput = document.getElementById('modalUsername');
    const passInput = document.getElementById('modalPassword');

    [tabAdmin, tabTeacher, tabStudent].forEach(t => {
      if (t) {
        t.style.background = 'transparent';
        t.style.borderColor = 'var(--border)';
        t.style.color = 'var(--text-secondary)';
      }
    });

    if (role === 'admin') {
      if (tabAdmin) { tabAdmin.style.background = 'var(--primary-subtle)'; tabAdmin.style.borderColor = 'var(--border-glow)'; tabAdmin.style.color = 'var(--primary-light)'; }
      if (userLabel) userLabel.textContent = 'ชื่อผู้ดูแลระบบ (Username)';
      if (userInput) { userInput.value = 'admin'; userInput.placeholder = 'admin'; }
      if (passInput) passInput.value = 'admin123';
    } else if (role === 'teacher') {
      if (tabTeacher) { tabTeacher.style.background = 'rgba(59,130,246,0.15)'; tabTeacher.style.borderColor = 'rgba(59,130,246,0.4)'; tabTeacher.style.color = '#60a5fa'; }
      if (userLabel) userLabel.textContent = 'รหัสอาจารย์ (Teacher ID เช่น T01)';
      if (userInput) { userInput.value = 'T01'; userInput.placeholder = 'T01'; }
      if (passInput) passInput.value = 'teacher123';
    } else if (role === 'student') {
      if (tabStudent) { tabStudent.style.background = 'rgba(16,185,129,0.15)'; tabStudent.style.borderColor = 'rgba(16,185,129,0.4)'; tabStudent.style.color = '#34d399'; }
      if (userLabel) userLabel.textContent = 'รหัสกลุ่มเรียน / รหัสนักศึกษา (Group / Student ID)';
      if (userInput) { userInput.value = '672190102'; userInput.placeholder = '672190102'; }
      if (passInput) passInput.value = 'student123';
    }
  },

  handleFormSubmit(e) {
    e.preventDefault();
    const u = document.getElementById('modalUsername')?.value;
    const p = document.getElementById('modalPassword')?.value;
    this.login(u, p, this.activeModalRole);
  },

  openLoginModal() {
    this.mountLoginModal();
    const modal = document.getElementById('appLoginModal');
    if (modal) modal.classList.remove('hidden');
  },

  closeLoginModal() {
    const modal = document.getElementById('appLoginModal');
    if (modal) modal.classList.add('hidden');
  }
};

window.AUTH = AUTH;

// Mount header widgets on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  THEME.applyTheme();
  AUTH.mountHeaderWidgets();
  AUTH.mountLoginModal();
});
