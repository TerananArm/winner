// ============================================================
//  MAIN UTILITIES & COMMON SCRIPTS
// ============================================================

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
  const toast = document.createElement('div');
  const toneClass = (type === 'warning' || type === 'error') ? 'toast-error' : (type === 'success' ? 'toast-success' : 'toast-info');
  toast.className = `toast ${toneClass}`;
  toast.innerHTML = `
    <i class="toast-icon ${icons[type] || icons.info}"></i>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
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
