// ========================================
// نظام إدارة الفريق - JavaScript
// ========================================

// تحويل الأرقام العربية إلى فرنسية
function toFrench(text) {
    if (!text) return text;
    const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const french = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let result = String(text);
    arabic.forEach((ar, i) => {
        result = result.replace(new RegExp(ar, 'g'), french[i]);
    });
    return result;
}

// البيانات
let personnel = [];
let leaves = [];

// تحميل البيانات
function loadData() {
    const savedPersonnel = localStorage.getItem('personnel');
    const savedLeaves = localStorage.getItem('leaves');

    if (savedPersonnel) personnel = JSON.parse(savedPersonnel);
    if (savedLeaves) leaves = JSON.parse(savedLeaves);

    checkExpiredLeaves();
}

// حفظ البيانات
function saveData() {
    localStorage.setItem('personnel', JSON.stringify(personnel));
    localStorage.setItem('leaves', JSON.stringify(leaves));
}

// فحص الإجازات المنتهية
function checkExpiredLeaves() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    leaves.forEach(leave => {
        const endDate = new Date(leave.endDate);
        endDate.setHours(0, 0, 0, 0);

        if (endDate < today) {
            const person = personnel.find(p => p.id === leave.personId);
            if (person && (person.status === 'on-leave' || person.status === 'absent')) {
                person.status = 'active';
            }
        }
    });

    saveData();
}

// توليد ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// تنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    // تنسيق: يوم شهر سنة (مثال: 3 فبراير 2026)
    // نحول الأرقام فقط، وليس النص بالكامل
    const dayStr = toFrench(day.toString());
    const yearStr = toFrench(year.toString());

    return `${dayStr} ${month} ${yearStr}`;
}

// حساب المدة
function calculateDuration(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    return toFrench(diff.toString());
}

// عرض Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========================================
// التنقل بين التبويبات
// ========================================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;

        // تحديث الأزرار
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // تحديث التبويبات
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.getElementById(tab).classList.add('active');
    });
});

// ========================================
// الوضع الداكن
// ========================================
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', theme);
}

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
});

// تحميل الثيم المحفوظ
const savedTheme = localStorage.getItem('theme');
if (savedTheme) setTheme(savedTheme);

// ========================================
// لوحة التحكم
// ========================================
function updateDashboard() {
    const total = personnel.length;
    const active = personnel.filter(p => p.status === 'active').length;
    const onLeave = personnel.filter(p => p.status === 'on-leave').length;
    const absent = personnel.filter(p => p.status === 'absent').length;

    document.getElementById('statTotal').textContent = toFrench(total.toString());
    document.getElementById('statActive').textContent = toFrench(active.toString());
    document.getElementById('statLeave').textContent = toFrench(onLeave.toString());
    document.getElementById('statAbsent').textContent = toFrench(absent.toString());

    // النشاط الأخير
    const recentActivity = document.getElementById('recentActivity');
    const recentLeaves = leaves.slice(-5).reverse();

    if (recentLeaves.length === 0) {
        recentActivity.innerHTML = '<div class="empty-state"><span>📅</span><p>لا توجد أنشطة حديثة</p></div>';
    } else {
        recentActivity.innerHTML = recentLeaves.map(leave => `
            <div class="activity-item">
                <strong>${leave.personName}</strong> - ${leave.type === 'leave' ? 'إجازة' : 'غياب'}
                <br><small>${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}</small>
            </div>
        `).join('');
    }
}

// ========================================
// إدارة الأفراد
// ========================================
const personModal = document.getElementById('personModal');
const personForm = document.getElementById('personForm');

document.getElementById('addPersonBtn').addEventListener('click', () => openPersonModal());
document.getElementById('closePersonModal').addEventListener('click', () => closePersonModal());
document.getElementById('cancelPersonBtn').addEventListener('click', () => closePersonModal());

function openPersonModal(personId = null) {
    const modalTitle = document.getElementById('modalTitle');
    personForm.reset();

    if (personId) {
        const person = personnel.find(p => p.id === personId);
        if (person) {
            modalTitle.textContent = 'تعديل بيانات الفرد';
            document.getElementById('personId').value = person.id;
            document.getElementById('personName').value = person.name;
            document.getElementById('personPhone').value = person.phone;
            document.getElementById('personStatus').value = person.status;
            document.getElementById('personJoinDate').value = person.joinDate;
            document.getElementById('personNotes').value = person.notes || '';
        }
    } else {
        modalTitle.textContent = 'إضافة فرد جديد';
        document.getElementById('personJoinDate').value = new Date().toISOString().split('T')[0];
    }

    personModal.classList.add('show');
}

function closePersonModal() {
    personModal.classList.remove('show');
}

personForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const personId = document.getElementById('personId').value;
    const personData = {
        id: personId || generateId(),
        name: document.getElementById('personName').value,
        title: '-',
        phone: document.getElementById('personPhone').value,
        status: document.getElementById('personStatus').value,
        joinDate: document.getElementById('personJoinDate').value,
        notes: document.getElementById('personNotes').value
    };

    if (personId) {
        const index = personnel.findIndex(p => p.id === personId);
        personnel[index] = personData;
        showToast('تم التحديث بنجاح');
    } else {
        personnel.push(personData);
        showToast('تمت الإضافة بنجاح');
    }

    saveData();
    renderPersonnel();
    updateDashboard();
    closePersonModal();
});

function deletePerson(personId, permanent = false) {
    const person = personnel.find(p => p.id === personId);
    if (!person) return;

    const msg = permanent ? `هل تريد حذف ${person.name} نهائياً؟` : `هل تريد أرشفة ${person.name}؟`;

    if (confirm(msg)) {
        personnel = personnel.filter(p => p.id !== personId);
        showToast(permanent ? 'تم الحذف' : 'تمت الأرشفة');
        saveData();
        renderPersonnel();
        updateDashboard();
    }
}

function renderPersonnel() {
    const container = document.getElementById('personnelGrid');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const sortBy = document.getElementById('sortBy').value;

    let filtered = [...personnel];

    // البحث
    if (searchTerm) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.phone.includes(searchTerm) ||
            p.title.toLowerCase().includes(searchTerm)
        );
    }

    // الفلترة
    if (statusFilter !== 'all') {
        filtered = filtered.filter(p => p.status === statusFilter);
    }

    // الترتيب
    filtered.sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar');
        if (sortBy === 'date') return new Date(b.joinDate) - new Date(a.joinDate);
        return 0;
    });

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><span>📋</span><p>لا يوجد أفراد</p></div>';
        return;
    }

    container.innerHTML = filtered.map(person => `
        <div class="person-card" data-person-id="${person.id}">
            <div class="person-header" onclick="togglePersonCard('${person.id}')">
                <div class="person-info">
                    <h3>👤 ${person.name}</h3>
                    <p>${person.title}</p>
                </div>
                <div class="person-header-right">
                    <div class="status-badge ${person.status}">
                        ${getStatusText(person.status)}
                    </div>
                    <span class="expand-icon">▼</span>
                </div>
            </div>
            <div class="person-details collapsed">
                <div class="detail-row">
                    <span class="detail-icon">📱</span>
                    <span class="detail-label">الهاتف</span>
                    <a href="tel:${person.phone}" class="detail-value phone-link" onclick="event.stopPropagation()">${toFrench(person.phone)}</a>
                </div>
                <div class="detail-row">
                    <span class="detail-icon">📅</span>
                    <span class="detail-label">تاريخ الانضمام</span>
                    <span class="detail-value" dir="ltr">${formatDate(person.joinDate)}</span>
                </div>
                ${person.notes ? `
                <div class="detail-row">
                    <span class="detail-icon">📝</span>
                    <span class="detail-label">ملاحظات</span>
                    <span class="detail-value" style="direction: rtl; text-align: right;">${person.notes}</span>
                </div>
                ` : ''}
            </div>
            <div class="person-actions collapsed">
                <button class="action-btn edit" onclick="event.stopPropagation(); openPersonModal('${person.id}')">
                    <span>✏️</span>
                    <span>تعديل</span>
                </button>
                <button class="action-btn archive" onclick="event.stopPropagation(); deletePerson('${person.id}')">
                    <span>📦</span>
                    <span>أرشفة</span>
                </button>
                <button class="action-btn delete" onclick="event.stopPropagation(); deletePerson('${person.id}', true)">
                    <span>🗑️</span>
                    <span>حذف</span>
                </button>
            </div>
        </div>
    `).join('');
}

// Toggle person card expansion
function togglePersonCard(personId) {
    const card = document.querySelector(`[data-person-id="${personId}"]`);
    if (!card) return;

    const details = card.querySelector('.person-details');
    const actions = card.querySelector('.person-actions');
    const icon = card.querySelector('.expand-icon');

    if (details.classList.contains('collapsed')) {
        details.classList.remove('collapsed');
        actions.classList.remove('collapsed');
        icon.style.transform = 'rotate(180deg)';
    } else {
        details.classList.add('collapsed');
        actions.classList.add('collapsed');
        icon.style.transform = 'rotate(0deg)';
    }
}

function getStatusText(status) {
    const statuses = {
        'active': '🟢 في الخدمة',
        'on-leave': '🟡 في إجازة',
        'absent': '🟠 غياب',
        'inactive': '🔴 خارج الخدمة'
    };
    return statuses[status] || status;
}

// البحث والفلترة
document.getElementById('searchInput').addEventListener('input', renderPersonnel);
document.getElementById('statusFilter').addEventListener('change', renderPersonnel);
document.getElementById('sortBy').addEventListener('change', renderPersonnel);

// ========================================
// إدارة الإجازات
// ========================================
const leaveModal = document.getElementById('leaveModal');
const leaveForm = document.getElementById('leaveForm');

document.getElementById('addLeaveBtn').addEventListener('click', () => openLeaveModal());
document.getElementById('closeLeaveModal').addEventListener('click', () => closeLeaveModal());
document.getElementById('cancelLeaveBtn').addEventListener('click', () => closeLeaveModal());

function openLeaveModal(leaveId = null) {
    leaveForm.reset();

    // ملء قائمة الأفراد
    const personSelect = document.getElementById('leavePerson');
    personSelect.innerHTML = '<option value="">اختر الفرد</option>' +
        personnel.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

    if (leaveId) {
        const leave = leaves.find(l => l.id === leaveId);
        if (leave) {
            document.getElementById('leaveId').value = leave.id;
            document.getElementById('leavePerson').value = leave.personId;
            document.getElementById('leaveType').value = leave.type;
            document.getElementById('leaveStartDate').value = leave.startDate;
            document.getElementById('leaveEndDate').value = leave.endDate;
            document.getElementById('leaveReason').value = leave.reason;
            document.getElementById('leaveJustified').checked = leave.justified;
        }
    }

    leaveModal.classList.add('show');
}

function closeLeaveModal() {
    leaveModal.classList.remove('show');
}

leaveForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const leaveId = document.getElementById('leaveId').value;
    const personId = document.getElementById('leavePerson').value;
    const person = personnel.find(p => p.id === personId);

    if (!person) {
        showToast('الرجاء اختيار الفرد', 'error');
        return;
    }

    const leaveData = {
        id: leaveId || generateId(),
        personId: personId,
        personName: person.name,
        type: document.getElementById('leaveType').value,
        startDate: document.getElementById('leaveStartDate').value,
        endDate: document.getElementById('leaveEndDate').value,
        reason: document.getElementById('leaveReason').value,
        justified: document.getElementById('leaveJustified').checked
    };

    // تحديث حالة الفرد
    person.status = leaveData.type === 'leave' ? 'on-leave' : 'absent';

    if (leaveId) {
        const index = leaves.findIndex(l => l.id === leaveId);
        leaves[index] = leaveData;
        showToast('تم التحديث بنجاح');
    } else {
        leaves.push(leaveData);
        showToast('تم التسجيل بنجاح');
    }

    saveData();
    renderLeaves();
    renderPersonnel();
    updateDashboard();
    closeLeaveModal();
});

function deleteLeave(leaveId) {
    const leave = leaves.find(l => l.id === leaveId);
    if (!leave) return;

    if (confirm(`هل تريد حذف هذه الإجازة؟`)) {
        // إرجاع حالة الفرد
        const person = personnel.find(p => p.id === leave.personId);
        if (person) person.status = 'active';

        leaves = leaves.filter(l => l.id !== leaveId);
        showToast('تم الحذف');
        saveData();
        renderLeaves();
        renderPersonnel();
        updateDashboard();
    }
}

function renderLeaves() {
    const container = document.getElementById('leavesGrid');

    if (leaves.length === 0) {
        container.innerHTML = '<div class="empty-state"><span>📅</span><p>لا توجد إجازات</p></div>';
        return;
    }

    container.innerHTML = leaves.map(leave => {
        const duration = calculateDuration(leave.startDate, leave.endDate);
        const typeClass = leave.type === 'leave' ? 'leave' : 'absent';
        const typeText = leave.type === 'leave' ? 'إجازة' : 'غياب';
        const typeIcon = leave.type === 'leave' ? '🟡' : '🟠';

        return `
            <div class="leave-card ${typeClass}-type" data-leave-id="${leave.id}">
                <div class="leave-header" onclick="toggleLeaveCard('${leave.id}')">
                    <div class="leave-header-main">
                        <h3>👤 ${leave.personName}</h3>
                        <div class="leave-summary">
                            <span class="leave-date-range" dir="ltr">${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}</span>
                            <span class="leave-duration">• ${duration} يوم</span>
                        </div>
                    </div>
                    <div class="leave-header-right">
                        <div class="leave-type ${typeClass}">${typeIcon} ${typeText}</div>
                        <span class="expand-icon">▼</span>
                    </div>
                </div>
                
                <div class="leave-details collapsed">
                    <div class="detail-row">
                        <span class="detail-icon">📅</span>
                        <span class="detail-label">من</span>
                        <span class="detail-value" dir="ltr">${formatDate(leave.startDate)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-icon">📅</span>
                        <span class="detail-label">إلى</span>
                        <span class="detail-value" dir="ltr">${formatDate(leave.endDate)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-icon">⏱️</span>
                        <span class="detail-label">المدة</span>
                        <span class="detail-value">${duration} يوم</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-icon">📝</span>
                        <span class="detail-label">السبب</span>
                        <span class="detail-value" style="direction: rtl; text-align: right;">${leave.reason}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-icon">✓</span>
                        <span class="detail-label">مبرر</span>
                        <span class="detail-value">${leave.justified ? '✅ نعم' : '❌ لا'}</span>
                    </div>
                </div>
                
                <div class="leave-actions collapsed">
                    <button class="action-btn edit" onclick="event.stopPropagation(); openLeaveModal('${leave.id}')">
                        <span>✏️</span>
                        <span>تعديل</span>
                    </button>
                    <button class="action-btn delete" onclick="event.stopPropagation(); deleteLeave('${leave.id}')">
                        <span>🗑️</span>
                        <span>حذف</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Toggle leave card expansion
function toggleLeaveCard(leaveId) {
    const card = document.querySelector(`[data-leave-id="${leaveId}"]`);
    if (!card) return;

    const details = card.querySelector('.leave-details');
    const actions = card.querySelector('.leave-actions');
    const icon = card.querySelector('.expand-icon');

    if (details.classList.contains('collapsed')) {
        details.classList.remove('collapsed');
        actions.classList.remove('collapsed');
        icon.style.transform = 'rotate(180deg)';
    } else {
        details.classList.add('collapsed');
        actions.classList.add('collapsed');
        icon.style.transform = 'rotate(0deg)';
    }
}

// ========================================
// الإعدادات
// ========================================
document.getElementById('exportBtn').addEventListener('click', () => {
    const data = { personnel, leaves };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-data-${Date.now()}.json`;
    a.click();
    showToast('تم التصدير بنجاح');
});

document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (data.personnel) personnel = data.personnel;
            if (data.leaves) leaves = data.leaves;
            saveData();
            renderPersonnel();
            renderLeaves();
            updateDashboard();
            showToast('تم الاستيراد بنجاح');
        } catch (error) {
            showToast('خطأ في الملف', 'error');
        }
    };
    reader.readAsText(file);
});

document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('هل أنت متأكد من مسح جميع البيانات؟')) {
        if (confirm('تحذير: لا يمكن التراجع عن هذا الإجراء!')) {
            personnel = [];
            leaves = [];
            saveData();
            renderPersonnel();
            renderLeaves();
            updateDashboard();
            showToast('تم مسح جميع البيانات');
        }
    }
});

// ========================================
// التهيئة
// ========================================
loadData();
updateDashboard();
renderPersonnel();
renderLeaves();
