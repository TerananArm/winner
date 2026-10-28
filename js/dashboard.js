// ============================================================
//  DASHBOARD STATS & STATUS
// ============================================================

const DASH = (() => {
  async function loadStats() {
    try {
      const [r, g, s, l, t, reg, sc, stu] = await Promise.all([
        db.from(TABLES.ROOMS).select('id', { count: 'exact', head: true }),
        db.from(TABLES.GROUPS).select('id', { count: 'exact', head: true }),
        db.from(TABLES.SUBJECTS).select('id', { count: 'exact', head: true }),
        db.from(TABLES.TEACHING_LOADS).select('id', { count: 'exact', head: true }),
        db.from(TABLES.TEACHERS).select('id', { count: 'exact', head: true }),
        db.from(TABLES.REGISTRATIONS).select('id', { count: 'exact', head: true }),
        db.from(TABLES.SCHEDULES).select('id', { count: 'exact', head: true }),
        db.from(TABLES.STUDENTS).select('id', { count: 'exact', head: true })
      ]);

      const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val !== null && val !== undefined ? val : '0';
      };

      setEl('stat-rooms', r.count ?? 0);
      setEl('stat-groups', g.count ?? 0);
      setEl('stat-subjects', s.count ?? 0);
      setEl('stat-loads', l.count ?? 0);
      setEl('stat-teachers', t.count ?? 0);
      setEl('stat-regs', reg.count ?? 0);
      setEl('stat-students', stu.count ?? 0);

      const statusEl = document.getElementById('system-status-list');
      if (statusEl) {
        statusEl.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:var(--text-secondary);font-size:13px;"><i class="fas fa-database" style="color:var(--cyan);margin-right:8px;"></i>การเชื่อมต่อฐานข้อมูล</span>
              <span class="badge badge-success">พร้อมใช้งาน</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:var(--text-secondary);font-size:13px;"><i class="fas fa-calendar-check" style="color:var(--primary-light);margin-right:8px;"></i>ตารางสอนที่จัดแล้ว</span>
              <span class="badge ${sc.count > 0 ? 'badge-primary' : 'badge-warning'}">${sc.count ?? 0} รายการ</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:var(--text-secondary);font-size:13px;"><i class="fas fa-clipboard-check" style="color:var(--success);margin-right:8px;"></i>วิชาที่ลงทะเบียน</span>
              <span class="badge badge-info">${reg.count ?? 0} วิชา</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:var(--text-secondary);font-size:13px;"><i class="fas fa-user-graduate" style="color:#818cf8;margin-right:8px;"></i>นักเรียนในระบบ</span>
              <span class="badge ${(stu.count ?? 0) > 0 ? 'badge-primary' : 'badge-warning'}">${stu.count ?? 0} คน</span>
            </div>
          </div>
        `;
      }
    } catch (e) {
      console.error('Error loading dashboard stats:', e);
    }
  }

  return { loadStats };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (typeof DASH !== 'undefined') DASH.loadStats();
});
