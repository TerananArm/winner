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
