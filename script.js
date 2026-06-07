
const defaultAccounts = [
    { code: "1001", name: "الصندوق الرئيسي النقدي", cat: "الأصول" },
    { code: "1002", name: "المصرف / الحساب البنكي", cat: "الأصول" },
    { code: "2001", name: "ذمم الموردين والتجار", cat: "الخصوم" },
    { code: "3001", name: "رأس مال المؤسسة المعتمد", cat: "حقوق الملكية" },
    { code: "4001", name: "إيرادات المبيعات والخدمات", cat: "الإيرادات" },
    { code: "5001", name: "حساب المشتريات العامة", cat: "المصروفات" }
];

let accounts = JSON.parse(localStorage.getItem('myAccounts')) || defaultAccounts;
let journalEntries = JSON.parse(localStorage.getItem('myJournal')) || [];
let salesInvoices = JSON.parse(localStorage.getItem('mySalesInvoices')) || [];
let purchaseInvoices = JSON.parse(localStorage.getItem('myPurchaseInvoices')) || [];
let currentFilterType = 'expense';
let lastReportFilteredData = [];
let activeReportSubTab = 'ledger';

function checkLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if (user === "yazan_younes" && pass === "m123456y") {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainDashboard').classList.remove('hidden');
        localStorage.setItem('isLoggedIn', 'true');
    } else {
        alert("خطأ في اسم المستخدم أو كلمة المرور");
    }
}


function showDashboard() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainDashboard').classList.remove('hidden');
    document.getElementById('userAvatar').innerText = "يـ ي";
    renderAccounts();
    calculateAccountingEngine();
    loadSavedExchangeRates();
}

function loadSavedExchangeRates() {
    let usd = localStorage.getItem('rate_usd') || "15,000.00";
    let eur = localStorage.getItem('rate_eur') || "16,200.00";
    document.getElementById('lblUsdRate').innerText = usd + " ل.س";
    document.getElementById('lblEurRate').innerText = eur + " ل.س";
}

function updateUsdRate() {
    let r = prompt("سعر الدولار الموازي الحالي:", "15000");
    if (r) { localStorage.setItem('rate_usd', parseFloat(r).toLocaleString('en-US', { minimumFractionDigits: 2 })); loadSavedExchangeRates(); calculateSalesTotal(); calculatePureTotal(); }
}

function updateEurRate() {
    let r = prompt("سعر اليورو الموازي الحالي:", "16200");
    if (r) { localStorage.setItem('rate_eur', parseFloat(r).toLocaleString('en-US', { minimumFractionDigits: 2 })); loadSavedExchangeRates(); }
}

function logout() { localStorage.removeItem('isLoggedIn'); location.reload(); }

function switchTab(t) {
    document.getElementById('tabDash').classList.add('hidden');
    document.getElementById('tabJournal').classList.add('hidden');
    document.getElementById('tabSales').classList.add('hidden');
    document.getElementById('tabPurchases').classList.add('hidden');
    document.getElementById('tabReports').classList.add('hidden');

    document.getElementById('menuDash').classList.remove('active');
    document.getElementById('menuJournal').classList.remove('active');
    document.getElementById('menuSales').classList.remove('active');
    document.getElementById('menuPurchases').classList.remove('active');
    document.getElementById('menuReports').classList.remove('active');

    if (t === 'dash') {
        document.getElementById('tabDash').classList.remove('hidden');
        document.getElementById('menuDash').classList.add('active');
        document.getElementById('pageTitle').innerText = "لوحة التحكم الرئيسية";
        renderAccounts(); calculateAccountingEngine();
    } else if (t === 'journal') {
        document.getElementById('tabJournal').classList.remove('hidden');
        document.getElementById('menuJournal').classList.add('active');
        document.getElementById('pageTitle').innerText = "شاشة القيود اليومية";
        switchJournalCategory('expense');
    } else if (t === 'sales') {
        document.getElementById('tabSales').classList.remove('hidden');
        document.getElementById('menuSales').classList.add('active');
        document.getElementById('pageTitle').innerText = "شاشة المبيعات الذكية";
        initSalesTab();
    } else if (t === 'purchases') {
        document.getElementById('tabPurchases').classList.remove('hidden');
        document.getElementById('menuPurchases').classList.add('active');
        document.getElementById('pageTitle').innerText = "شاشة المشتريات المباشرة";
        initPurchasesTab();
    } else if (t === 'reports') {
        document.getElementById('tabReports').classList.remove('hidden');
        document.getElementById('menuReports').classList.add('active');
        document.getElementById('pageTitle').innerText = "التقارير وميزان المراجعة";
        initReportsTab();
    }
}

/* النسخ الاحتياطي اليدوي واستعادته بنظام الـ Backup & Restore */
function downloadSystemBackup() {
    let backupData = {
        accounts: accounts,
        journalEntries: journalEntries,
        salesInvoices: salesInvoices,
        purchaseInvoices: purchaseInvoices,
        rate_usd: localStorage.getItem('rate_usd') || "15,000.00",
        rate_eur: localStorage.getItem('rate_eur') || "16,200.00"
    };
    let blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = `trabko_accounting_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function restoreSystemBackup(event) {
    let file = event.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function (e) {
        try {
            let parsed = JSON.parse(e.target.result);
            if (parsed.accounts && parsed.journalEntries) {
                accounts = parsed.accounts;
                journalEntries = parsed.journalEntries;
                salesInvoices = parsed.salesInvoices || [];
                purchaseInvoices = parsed.purchaseInvoices || [];

                localStorage.setItem('myAccounts', JSON.stringify(accounts));
                localStorage.setItem('myJournal', JSON.stringify(journalEntries));
                localStorage.setItem('mySalesInvoices', JSON.stringify(salesInvoices));
                localStorage.setItem('myPurchaseInvoices', JSON.stringify(purchaseInvoices));
                if (parsed.rate_usd) localStorage.setItem('rate_usd', parsed.rate_usd);
                if (parsed.rate_eur) localStorage.setItem('rate_eur', parsed.rate_eur);

                alert("✅ System Backup Restored Successfully!");
                location.reload();
            } else {
                alert("الملف المرفوع غير متوافق أو لا يحتوي على بيانات صحيحة.");
            }
        } catch (err) {
            alert("فشل في قراءة ملف النسخة الاحتياطية. تأكد أنه ملف .json صحيح.");
        }
    };
    reader.readAsText(file);
}

/* شاشة القيود */
function switchJournalCategory(type) {
    currentFilterType = type;
    document.getElementById('jTabExpense').classList.remove('active-jtab');
    document.getElementById('jTabReceive').classList.remove('active-jtab');
    document.getElementById('jTabJournal').classList.remove('active-jtab');

    if (type === 'expense') {
        document.getElementById('jTabExpense').classList.add('active-jtab');
        document.getElementById('lblJournalTableTitle').innerText = "🗂️ قائمة قيود الصرف السابقة المسجلة";
    } else if (type === 'receive') {
        document.getElementById('jTabReceive').classList.add('active-jtab');
        document.getElementById('lblJournalTableTitle').innerText = "🗂️ قائمة قيود القبض السابقة المسجلة";
    } else if (type === 'journal') {
        document.getElementById('jTabJournal').classList.add('active-jtab');
        document.getElementById('lblJournalTableTitle').innerText = "🗂️ قائمة سندات القيود العامة السابقة";
    }
    renderNewJournalTable();
}

function renderNewJournalTable() {
    const tbody = document.getElementById('newJournalTableBody');
    tbody.innerHTML = "";
    let filtered = journalEntries.filter(e => e.type === currentFilterType || (currentFilterType === 'expense' && e.type.includes('expense')) || (currentFilterType === 'receive' && e.type.includes('receive')));

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#95a5a6;">لا يوجد قيود مسجلة لهذا النوع حالياً.</td></tr>';
        return;
    }

    [...filtered].reverse().forEach(e => {
        let br = e.branch || "فرع رئيسي";
        let entryNo = e.sequenceNo || "-";
        tbody.innerHTML += `<tr>
                    <td><b style="color:var(--sidebar-color);">#${entryNo}</b></td>
                    <td><b>${e.date}</b></td>
                    <td><span style="background:#eef2f7; padding:3px 8px; border-radius:4px; font-weight:bold; font-size:12px;">📍 ${br}</span></td>
                    <td>${e.description}</td>
                    <td style="text-align:center;">
                        <button class="btn-eye" title="معاينة ودخول للقيد" onclick="openEditModal('${e.id}')">👁️</button>
                    </td>
                </tr>`;
    });
}

function filterJournalBySpecificDate() {
    let d = document.getElementById('journalSearchDate').value;
    if (!d) { renderNewJournalTable(); return; }
    const tbody = document.getElementById('newJournalTableBody');
    tbody.innerHTML = "";
    let filtered = journalEntries.filter(e => e.date === d && (e.type === currentFilterType || e.type.includes(currentFilterType)));
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:15px; color:#95a5a6;">لا توجد قيود مسجلة في هذا التاريخ المحدَد.</td></tr>';
        return;
    }
    filtered.forEach(e => {
        let br = e.branch || "فرع رئيسي";
        let entryNo = e.sequenceNo || "-";
        tbody.innerHTML += `<tr>
                    <td><b style="color:var(--sidebar-color);">#${entryNo}</b></td>
                    <td><b>${e.date}</b></td>
                    <td><span style="background:#eef2f7; padding:3px 8px; border-radius:4px; font-weight:bold;">📍 ${br}</span></td>
                    <td>${e.description}</td>
                    <td style="text-align:center;">
                        <button class="btn-eye" title="معاينة ودخول للقيد" onclick="openEditModal('${e.id}')">👁️</button>
                    </td>
                </tr>`;
    });
}

/* معالجات الإنشاء السريع للقيود بملء الشاشة */
function startFullscreenWizard() {
    document.getElementById('wizardStep1').classList.remove('hidden');
    document.getElementById('wizDate').valueAsDate = new Date();
    document.getElementById('wizBranch').value = "فرع رئيسي";
    document.getElementById('wizDescDebit').value = "";
    document.getElementById('wizDescCredit').value = "";

    let lbl = "قيد صرف";
    if (currentFilterType === 'receive') lbl = "قيد قبض";
    if (currentFilterType === 'journal') lbl = "سند قيد عام";
    document.getElementById('lblWizBadge').innerText = "النوع تلقائي: " + lbl;
}

function closeWizard() {
    document.getElementById('wizardStep1').classList.add('hidden');
    document.getElementById('wizardStep2').classList.add('hidden');
}

function goToWizardStep2() {
    let descD = document.getElementById('wizDescDebit').value.trim();
    let descC = document.getElementById('wizDescCredit').value.trim();
    if (!descD || !descC) { alert("يرجى تعبئة شرح قيد المدين وشرح قيد الدائن قبل المتابعة!"); return; }

    document.getElementById('wizardStep1').classList.add('hidden');
    document.getElementById('wizardStep2').classList.remove('hidden');

    document.getElementById('lblSummaryDate').innerText = document.getElementById('wizDate').value;
    document.getElementById('lblSummaryBranch').innerText = document.getElementById('wizBranch').value;

    document.getElementById('lblSummaryDescDebit').innerText = "شرح المدين الداخلي: " + descD;
    document.getElementById('lblSummaryDescCredit').innerText = "شرح الدائن الداخلي: " + descC;

    let lbl = "قيد صرف";
    if (currentFilterType === 'receive') lbl = "قيد قبض";
    if (currentFilterType === 'journal') lbl = "سند قيد عام";
    document.getElementById('lblWizBadge2').innerText = "النوع تلقائي: " + lbl;

    populateWizardDropdowns();
    document.getElementById('wizValDebit').value = "0";
    document.getElementById('wizValCredit').value = "0";
    validateWizardFinancials();
}

function backToWizardStep1() {
    document.getElementById('wizardStep2').classList.add('hidden');
    document.getElementById('wizardStep1').classList.remove('hidden');
}

function populateWizardDropdowns() {
    let d = document.getElementById('wizAccDebit');
    let c = document.getElementById('wizAccCredit');
    d.innerHTML = '<option value="">-- اختر حساب الطرف المدين --</option>';
    c.innerHTML = '<option value="">-- اختر حساب الطرف الدائن --</option>';

    accounts.sort((a, b) => parseInt(a.code) - parseInt(b.code)).forEach(a => {
        let opt = `<option value="${a.code}">${a.code} - ${a.name}</option>`;
        d.innerHTML += opt; c.innerHTML += opt;
    });

    if (currentFilterType === 'expense' && accounts.some(a => a.code === "1001")) c.value = "1001";
    if (currentFilterType === 'receive' && accounts.some(a => a.code === "1001")) d.value = "1001";
}

function validateWizardFinancials() {
    let vD = parseFloat(document.getElementById('wizValDebit').value) || 0;
    let vC = parseFloat(document.getElementById('wizValCredit').value) || 0;
    let accD = document.getElementById('wizAccDebit').value;
    let accC = document.getElementById('wizAccCredit').value;

    let btn = document.getElementById('btnWizSave');
    let stat = document.getElementById('wizFormStatus');

    if (vD > 0 && vD === vC && accD && accC && accD !== accC) {
        btn.disabled = false; stat.innerText = "✅ القيود متزنة وجاهزة للحفظ والترحيل الكلي"; stat.style.color = "green";
    } else {
        btn.disabled = true; stat.innerText = "❌ القيد غير متوازن مالياً أو لم يتم اختيار الحسابات المتقابلة"; stat.style.color = "red";
    }
}

function finalizeAndSaveWizardEntry() {
    let vD = parseFloat(document.getElementById('wizValDebit').value);
    let descD = document.getElementById('wizDescDebit').value.trim();
    let descC = document.getElementById('wizDescCredit').value.trim();
    let branch = document.getElementById('wizBranch').value;
    let date = document.getElementById('wizDate').value;

    let combinedDesc = `شرح المدين: [${descD}] | شرح الدائن: [${descC}]`;
    let nextSequence = journalEntries.length + 1;

    let entry = {
        id: "J-" + Date.now().toString(),
        sequenceNo: nextSequence,
        date: date,
        branch: branch,
        description: combinedDesc,
        debitCode: document.getElementById('wizAccDebit').value,
        debitName: accounts.find(a => a.code === document.getElementById('wizAccDebit').value).name,
        creditCode: document.getElementById('wizAccCredit').value,
        creditName: accounts.find(a => a.code === document.getElementById('wizAccCredit').value).name,
        amount: vD,
        type: currentFilterType
    };

    journalEntries.push(entry);
    localStorage.setItem('myJournal', JSON.stringify(journalEntries));
    closeWizard();
    renderNewJournalTable();
    calculateAccountingEngine();
    alert(`✅ تم ترحيل وحفظ القيد المتوازن بنجاح! رقم القيد التسلسلي: #${nextSequence}`);
}

/* دليل الحسابات */
function openCreateAccountModal() {
    document.getElementById('accountModal').classList.remove('hidden');
    document.getElementById('newAccCode').value = ""; document.getElementById('newAccName').value = "";
}
function closeCreateAccountModal() { document.getElementById('accountModal').classList.add('hidden'); }

function saveNewAccountInTree() {
    let code = document.getElementById('newAccCode').value.trim();
    let name = document.getElementById('newAccName').value.trim();
    let cat = document.getElementById('newAccCat').value;
    if (!code || !name) { alert("يرجى ملء جميع حقول بيانات الحساب!"); return; }
    if (accounts.some(a => a.code === code)) { alert("كود الحساب هذا مسجل مسبقاً لحساب آخر!"); return; }
    accounts.push({ code: code, name: name, cat: cat });
    localStorage.setItem('myAccounts', JSON.stringify(accounts));
    closeCreateAccountModal(); renderAccounts();
}

function deleteAccountFromTree(code) {
    if (["1001", "1002", "2001", "3001", "4001", "5001"].includes(code)) { alert("لا يمكن حذف هذا الحساب لأنه حساب أساسي للنظام المالي."); return; }
    let hasEntries = journalEntries.some(e => e.debitCode === code || e.creditCode === code);
    if (hasEntries) { alert("فشل الحذف! الحساب مرتبط بقيود مالية ومستندات مسجلة في الأرشيف."); return; }
    if (confirm("هل أنت متأكد من رغبتك في حذف هذا الحساب نهائياً من الدليل؟")) {
        accounts = accounts.filter(a => a.code !== code);
        localStorage.setItem('myAccounts', JSON.stringify(accounts));
        renderAccounts();
    }
}

function renderAccounts() {
    const body = document.getElementById('accountsTableBody');
    body.innerHTML = "";
    accounts.sort((a, b) => parseInt(a.code) - parseInt(b.code)).forEach(a => {
        body.innerHTML += `<tr>
                    <td><b>${a.code}</b></td>
                    <td>${a.name}</td>
                    <td><span style="background:#eef2f7; padding:2px 8px; border-radius:4px; font-size:12px;">${a.cat}</span></td>
                    <td style="text-align:center">
                        <button class="btn btn-edit" style="padding:2px 8px;" onclick="editAccName('${a.code}')">✏️</button>
                        <button class="btn btn-danger" style="padding:2px 8px;" onclick="deleteAccountFromTree('${a.code}')">🗑️</button>
                    </td>
                </tr>`;
    });
}

function editAccName(code) {
    let a = accounts.find(x => x.code === code);
    let n = prompt("تعديل اسم الحساب:", a.name);
    if (n) { a.name = n; localStorage.setItem('myAccounts', JSON.stringify(accounts)); renderAccounts(); }
}

/* المبيعات الذكية */
function initSalesTab() {
    document.getElementById('salesInvoiceDate').valueAsDate = new Date();
    document.getElementById('saleItemName').value = ""; 
    document.getElementById('saleItemQty').value = "1"; 
    document.getElementById('saleItemPrice').value = "";
    
    // إظهار قائمة العملاء دائماً
    document.getElementById('salesCustomerDiv').classList.remove('hidden');
    
    const selCust = document.getElementById('salesCustomerSelector');
    selCust.innerHTML = '<option value="">-- اختر العميل --</option>';
    accounts.sort((a, b) => parseInt(a.code) - parseInt(b.code)).forEach(a => {
        selCust.innerHTML += `<option value="${a.code}">${a.code} - ${a.name}</option>`;
    });
    
    calculateSalesTotal(); 
    renderSalesArchive();
}

function toggleSalesCustomerSelect() {
    if (document.getElementById('salesTypeSelector').value === 'credit') document.getElementById('salesCustomerDiv').classList.remove('hidden');
    else document.getElementById('salesCustomerDiv').classList.add('hidden');
}

function calculateSalesTotal() {
    let qty = parseFloat(document.getElementById('saleItemQty').value) || 0;
    let price = parseFloat(document.getElementById('saleItemPrice').value) || 0;
    let curr = document.getElementById('salesCurrencySelector').value;
    let rowTotal = qty * price;
    document.getElementById('lblSaleTotalRow').innerText = rowTotal.toLocaleString() + (curr === 'usd' ? ' $' : ' ل.س');
    let finalBooked = rowTotal;
    if (curr === 'usd') {
        let rate = parseFloat((localStorage.getItem('rate_usd') || "15000").replace(/,/g, ''));
        finalBooked = rowTotal * rate;
    }
    document.getElementById('lblSalesFinalBooked').innerText = finalBooked.toLocaleString() + " ل.س";
}

function processSalesInvoice() {
    let qty = parseFloat(document.getElementById('saleItemQty').value) || 0;
    let price = parseFloat(document.getElementById('saleItemPrice').value) || 0;
    let itemName = document.getElementById('saleItemName').value.trim() || "مواد عامة مباعة";
    let type = document.getElementById('salesTypeSelector').value; 
    let customerCode = document.getElementById('salesCustomerSelector').value;
    let curr = document.getElementById('salesCurrencySelector').value;
    let date = document.getElementById('salesInvoiceDate').value;

    if (qty <= 0 || price <= 0 || !customerCode) { 
        alert("يرجى إدخال كمية وسعر صحيحين، واختيار العميل!"); 
        return; 
    }

    let origAmount = qty * price;
    let rate = parseFloat((localStorage.getItem('rate_usd') || "15000").replace(/,/g, ''));
    let bookedAmount = (curr === 'usd') ? (origAmount * rate) : origAmount;

    let customerName = accounts.find(a => a.code === customerCode).name;
    let creditCode = "4001"; // إيراد المبيعات
    let invoiceId = "INV-" + Date.now().toString().slice(-6);

    // 1. تسجيل قيد البيع (الزبون مدين)
    journalEntries.push({
        id: "J-" + Date.now().toString(),
        sequenceNo: journalEntries.length + 1,
        date: date,
        branch: "فرع رئيسي",
        description: `مبيعات فاتورة ${invoiceId} للعميل: ${customerName}`,
        debitCode: customerCode,
        debitName: customerName,
        creditCode: creditCode,
        creditName: "إيراد المبيعات",
        amount: bookedAmount,
        type: "sales_auto"
    });

    // 2. إذا كان نقداً: قيد قبض فوري
    if (type === 'cash') {
        journalEntries.push({
            id: "J-" + (Date.now() + 1).toString(),
            sequenceNo: journalEntries.length + 1,
            date: date,
            branch: "فرع رئيسي",
            description: `قبض نقدي من العميل: ${customerName} (فاتورة ${invoiceId})`,
            debitCode: "1001", 
            debitName: "الصندوق الرئيسي النقدي",
            creditCode: customerCode,
            creditName: customerName,
            amount: bookedAmount,
            type: "sales_auto_cash"
        });
    }

    localStorage.setItem('myJournal', JSON.stringify(journalEntries));
    alert(`✅ تم ترحيل الفاتورة للعميل ${customerName} بنجاح.`);
    initSalesTab();
}

function renderSalesArchive() {
    const body = document.getElementById('salesArchiveTableBody'); body.innerHTML = "";
    if (salesInvoices.length === 0) { body.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:15px; color:#95a5a6;">لا يوجد فواتير مبيعات مسجلة حتى الآن.</td></tr>'; return; }
    [...salesInvoices].reverse().forEach(inv => {
        body.innerHTML += `<tr>
                    <td><b>#${inv.id}</b></td><td>${inv.date}</td><td>${inv.customer}</td><td><span style="background:#eef2f7; padding:2px 8px; border-radius:4px;">${inv.payMethod}</span></td>
                    <td style="color:var(--accent-blue); font-weight:bold;">${inv.origValue}</td><td style="color:var(--accent-green); font-weight:bold;">${inv.bookedValue}</td>
                </tr>`;
    });
}

/* شاشة المشتريات الصادرة */
function initPurchasesTab() {
    document.getElementById('pureInvoiceDate').valueAsDate = new Date();
    document.getElementById('pureItemName').value = ""; 
    document.getElementById('pureItemQty').value = "1"; 
    document.getElementById('pureItemPrice').value = "";
    
    // هذا السطر هو الأهم: هو الذي يجبر القائمة على الظهور
    document.getElementById('pureVendorDiv').classList.remove('hidden');
    
    const selVendor = document.getElementById('pureVendorSelector'); 
    selVendor.innerHTML = '<option value="">-- اختر المورد --</option>';
    accounts.sort((a, b) => parseInt(a.code) - parseInt(b.code)).forEach(a => {
        selVendor.innerHTML += `<option value="${a.code}">${a.code} - ${a.name}</option>`;
    });
    
    renderPureArchive();
}

function togglePureVendorSelect() {
    if (document.getElementById('pureTypeSelector').value === 'credit') document.getElementById('pureVendorDiv').classList.remove('hidden');
    else document.getElementById('pureVendorDiv').classList.add('hidden');
}

function calculatePureTotal() {
    let qty = parseFloat(document.getElementById('pureItemQty').value) || 0;
    let price = parseFloat(document.getElementById('pureItemPrice').value) || 0;
    let curr = document.getElementById('pureCurrencySelector').value;
    let rowTotal = qty * price;
    document.getElementById('lblPureTotalRow').innerText = rowTotal.toLocaleString() + (curr === 'usd' ? ' $' : ' ل.س');
    let finalBooked = rowTotal;
    if (curr === 'usd') {
        let rate = parseFloat((localStorage.getItem('rate_usd') || "15000").replace(/,/g, ''));
        finalBooked = rowTotal * rate;
    }
    document.getElementById('lblPureFinalBooked').innerText = finalBooked.toLocaleString() + " ل.س";
}

function processPureInvoice() {
    let qty = parseFloat(document.getElementById('pureItemQty').value) || 0;
    let price = parseFloat(document.getElementById('pureItemPrice').value) || 0;
    let itemName = document.getElementById('pureItemName').value.trim() || "مواد بضاعة عامة";
    let type = document.getElementById('pureTypeSelector').value;
    let vendorCode = document.getElementById('pureVendorSelector').value;
    let curr = document.getElementById('pureCurrencySelector').value;
    let date = document.getElementById('pureInvoiceDate').value;

    if (qty <= 0 || price <= 0 || !vendorCode) { 
        alert("يرجى إدخال كمية وسعر صحيحين، واختيار المورد!"); 
        return; 
    }

    let origAmount = qty * price;
    let rate = parseFloat((localStorage.getItem('rate_usd') || "15000").replace(/,/g, ''));
    let bookedAmount = (curr === 'usd') ? (origAmount * rate) : origAmount;

    let vendorName = accounts.find(a => a.code === vendorCode).name;

    // 1. تسجيل قيد الشراء (المشتريات مدين، المورد دائن)
    journalEntries.push({
        id: "J-" + Date.now().toString(),
        sequenceNo: journalEntries.length + 1,
        date: date,
        branch: "فرع رئيسي",
        description: `مشتريات من المورد: ${vendorName}`,
        debitCode: "5001",
        debitName: "حساب المشتريات",
        creditCode: vendorCode,
        creditName: vendorName,
        amount: bookedAmount,
        type: "purchase_auto"
    });

    // 2. إذا كان نقداً: قيد دفع للمورد
    if (type === 'cash') {
        journalEntries.push({
            id: "J-" + (Date.now() + 1).toString(),
            sequenceNo: journalEntries.length + 1,
            date: date,
            branch: "فرع رئيسي",
            description: `سداد نقدي للمورد: ${vendorName}`,
            debitCode: vendorCode,
            debitName: vendorName,
            creditCode: "1001", 
            creditName: "الصندوق الرئيسي النقدي",
            amount: bookedAmount,
            type: "purchase_auto_cash"
        });
    }

    localStorage.setItem('myJournal', JSON.stringify(journalEntries));
    alert(`✅ تم حفظ الفاتورة وترحيلها لحساب المورد ${vendorName} بنجاح.`);
    initPurchasesTab();
}
function renderPureArchive() {
    const body = document.getElementById('pureArchiveTableBody'); body.innerHTML = "";
    if (purchaseInvoices.length === 0) { body.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:15px; color:#95a5a6;">لا يوجد فواتير مشتريات مسجلة حتى الآن.</td></tr>'; return; }
    [...purchaseInvoices].reverse().forEach(inv => {
        body.innerHTML += `<tr>
                    <td><b>#${inv.id}</b></td><td>${inv.date}</td><td>${inv.vendor}</td><td><span style="background:#fff2e6; padding:2px 8px; border-radius:4px; color:var(--accent-orange); font-weight:bold;">${inv.payMethod}</span></td>
                    <td style="color:var(--accent-blue); font-weight:bold;">${inv.origValue}</td><td style="color:var(--accent-orange); font-weight:bold;">${inv.bookedValue}</td>
                </tr>`;
    });
}

/* إدارة محرك التبويبات الفرعية المتكامل لصفحة التقارير والمراجعات */
function initReportsTab() {
    const sel = document.getElementById('reportAccSelector');
    sel.innerHTML = '<option value="">-- اختر الحساب المطلوب --</option>';
    accounts.sort((a, b) => parseInt(a.code) - parseInt(b.code)).forEach(a => {
        sel.innerHTML += `<option value="${a.code}">${a.code} - ${a.name}</option>`;
    });
    document.getElementById('reportDateFrom').value = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    document.getElementById('reportDateTo').value = new Date().toISOString().split('T')[0];
    document.getElementById('reportBranchSelector').value = "all";
    document.getElementById('reportActionButtons').style.setProperty('display', 'none', 'important');
    lastReportFilteredData = [];
    switchReportSubView('ledger');
}

function switchReportSubView(targetSub) {
    activeReportSubTab = targetSub;
    document.getElementById('repTriggerSub1').classList.remove('active-rep-tab');
    document.getElementById('repTriggerSub2').classList.remove('active-rep-tab');
    document.getElementById('repTriggerSub3').classList.remove('active-rep-tab');
    document.getElementById('repTriggerSub4').classList.remove('active-rep-tab')

    document.getElementById('subViewLedger').classList.add('hidden');
    document.getElementById('subViewTrial').classList.add('hidden');
    document.getElementById('subViewCrm').classList.add('hidden');
    document.getElementById('subViewBalance').classList.add('hidden');

    if (targetSub === 'ledger') {
        document.getElementById('repTriggerSub1').classList.add('active-rep-tab');
        document.getElementById('subViewLedger').classList.remove('hidden');
    } else if (targetSub === 'trial') {
        document.getElementById('repTriggerSub2').classList.add('active-rep-tab');
        document.getElementById('subViewTrial').classList.remove('hidden');
        calculateAndRenderTrialBalance();
    } else if (targetSub === 'crm') {
        document.getElementById('repTriggerSub3').classList.add('active-rep-tab');
        document.getElementById('subViewCrm').classList.remove('hidden');
        renderCrmBalancesReport();
    } else if (targetSub === 'malk') {
        document.getElementById('repTriggerSub4').classList.add('active-rep-tab');
        document.getElementById('subViewBalance').classList.remove('hidden');
        generateBalanceSheet();
    }
}

/* 1. كشف الحساب التفصيلي المطور (مضافاً إليه فلتر الفروع) */
function generateReport() {
    let accCode = document.getElementById('reportAccSelector').value;
    let branchFilter = document.getElementById('reportBranchSelector').value;
    let from = document.getElementById('reportDateFrom').value;
    let to = document.getElementById('reportDateTo').value;

    if (!accCode) { alert("يرجى اختيار الحساب أولاً!"); return; }

    const body = document.getElementById('reportTableBody');
    body.innerHTML = "";
    let tDebit = 0, tCredit = 0;

    let filtered = journalEntries.filter(e => {
        let matchAcc = (e.debitCode === accCode || e.creditCode === accCode);
        let matchDate = (e.date >= from && e.date <= to);
        let matchBranch = (branchFilter === 'all' || e.branch === branchFilter);
        return matchAcc && matchDate && matchBranch;
    });

    lastReportFilteredData = filtered;

    if (filtered.length === 0) {
        body.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#95a5a6;">لا يوجد حركات قيود مسجلة لهذا الحساب ضمن التواريخ المحددة والفروع.</td></tr>';
        document.getElementById('reportActionButtons').style.setProperty('display', 'none', 'important');
    } else {
        document.getElementById('reportActionButtons').style.setProperty('display', 'flex', 'important');

        filtered.forEach(e => {
            let d = (e.debitCode === accCode) ? e.amount : 0;
            let c = (e.creditCode === accCode) ? e.amount : 0;
            tDebit += d; tCredit += c;

            let typeName = "سند قيد";
            if (e.type.includes('expense')) typeName = "قيد صرف";
            if (e.type.includes('receive')) typeName = "قيد قبض";
            if (e.type.includes('sales')) typeName = "فاتورة مبيعات";
            if (e.type.includes('purchase')) typeName = "فاتورة مشتريات";

            let seqStr = e.sequenceNo ? `#${e.sequenceNo}` : `#${e.id.slice(-4)}`;
            let branchStr = e.branch || "فرع رئيسي";

            body.innerHTML += `<tr>
                        <td><b>${seqStr}</b></td>
                        <td>${e.date}</td>
                        <td><span style="font-size:12px; font-weight:bold; color:var(--text-dark);">📍 ${branchStr}</span></td>
                        <td><span class="clickable-type-link" onclick="openEditModal('${e.id}')">📂 ${typeName}</span></td>
                        <td>${e.description}</td>
                        <td style="color:var(--accent-green); font-weight:bold">${d > 0 ? d.toLocaleString() : '-'}</td>
                        <td style="color:var(--accent-red); font-weight:bold">${c > 0 ? c.toLocaleString() : '-'}</td>
                    </tr>`;
        });
    }

    document.getElementById('repTotalDebit').innerText = tDebit.toLocaleString();
    document.getElementById('repTotalCredit').innerText = tCredit.toLocaleString();
    let final = tDebit - tCredit;
    document.getElementById('repFinalBalance').innerText = final.toLocaleString() + " ل.س";
    document.getElementById('repFinalBalance').style.color = final >= 0 ? "var(--accent-green)" : "var(--accent-red)";
}

function printReportData() { window.print(); }

function exportReportToExcel() {
    let accCode = document.getElementById('reportAccSelector').value;
    let accountInfo = accounts.find(a => a.code === accCode);
    let accountName = accountInfo ? accountInfo.name : "Account";
    let fromDate = document.getElementById('reportDateFrom').value;
    let toDate = document.getElementById('reportDateTo').value;

    if (!lastReportFilteredData || lastReportFilteredData.length === 0) { alert("لا توجد بيانات متاحة للتصدير حالياً."); return; }

    // إضافة BOM لضمان دعم اللغة العربية
    let csvContent = "\uFEFF"; 
    
    // استخدام الفاصلة المنقوطة (;) لضمان الفصل بين الخلايا
    csvContent += "رقم القيد;التاريخ;الفرع;نوع الحركة;شرح الحركة والبيان;مدين (Debit);دائن (Credit)\n";

    let totalD = 0, totalC = 0;
    lastReportFilteredData.forEach(e => {
        let d = (e.debitCode === accCode) ? e.amount : 0;
        let c = (e.creditCode === accCode) ? e.amount : 0;
        totalD += d; totalC += c;

        let typeName = "سند قيد";
        if (e.type.includes('expense')) typeName = "قيد صرف";
        if (e.type.includes('receive')) typeName = "قيد قبض";
        if (e.type.includes('sales')) typeName = "فاتورة مبيعات";
        if (e.type.includes('purchase')) typeName = "فاتورة مشتريات";

        let seqNo = e.sequenceNo ? `#${e.sequenceNo}` : `#${e.id.slice(-4)}`;
        let branchStr = e.branch || "فرع رئيسي";
        let cleanDesc = e.description.replace(/;/g, ' - '); // استبدال الفواصل المنقوطة في النص

        csvContent += `${seqNo};${e.date};${branchStr};${typeName};${cleanDesc};${d};${c}\n`;
    });

    let blob = new Blob([csvContent], { type: 'text/csv;charset=windows-1256;' });
    let link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `Statement_${accCode}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

/* 2. محرك احتساب ميزان المراجعة الذكي المضاف (Trial Balance) */
function calculateAndRenderTrialBalance() {
    const tbody = document.getElementById('trialTableBody');
    tbody.innerHTML = "";
    let grandDebit = 0, grandCredit = 0;

    accounts.sort((a, b) => parseInt(a.code) - parseInt(b.code)).forEach(acc => {
        let totalDebitMovement = 0;
        let totalCreditMovement = 0;

        journalEntries.forEach(e => {
            if (e.debitCode === acc.code) totalDebitMovement += e.amount;
            if (e.creditCode === acc.code) totalCreditMovement += e.amount;
        });

        let finalBalance = totalDebitMovement - totalCreditMovement;
        grandDebit += totalDebitMovement;
        grandCredit += totalCreditMovement;

        tbody.innerHTML += `<tr>
                    <td><b>${acc.code}</b></td>
                    <td>${acc.name}</td>
                    <td style="color:var(--accent-green); font-weight:bold;">${totalDebitMovement > 0 ? totalDebitMovement.toLocaleString() : '-'}</td>
                    <td style="color:var(--accent-red); font-weight:bold;">${totalCreditMovement > 0 ? totalCreditMovement.toLocaleString() : '-'}</td>
                    <td style="font-weight:bold; color:${finalBalance >= 0 ? 'var(--accent-blue)' : 'var(--accent-red)'}">${finalBalance.toLocaleString()} ل.س</td>
                </tr>`;
    });

    document.getElementById('lblTrialTotalDebit').innerText = grandDebit.toLocaleString() + " ل.س";
    document.getElementById('lblTrialTotalCredit').innerText = grandCredit.toLocaleString() + " ل.س";
    let diff = grandDebit - grandCredit;
    let statusLabel = document.getElementById('lblTrialBalanceStatus');

    if (Math.abs(diff) < 0.01) {
        statusLabel.innerText = "✅ النظام متزن تماماً ومطابق محاسبياً! إجمالي الحركات متساوية للجانبين المدين والدائن.";
        statusLabel.style.background = "#edfcf2"; statusLabel.style.color = "green";
        document.getElementById('lblTrialDiff').innerText = "0.00 (متزن)";
    } else {
        statusLabel.innerText = `⚠️ هناك فارق مالي غير متوازن بقيمة ${diff.toLocaleString()} ل.س! يرجى مراجعة وتدقيق مستندات القيود اليدوية البسيطة.`;
        statusLabel.style.background = "#fff2f2"; statusLabel.style.color = "red";
        document.getElementById('lblTrialDiff').innerText = diff.toLocaleString() + " ل.س";
    }
}

function exportTrialToExcel() {
    let csvContent = "\uFEFF";
 // استخدام الفاصلة المنقوطة (;) لضمان الفصل بين الخلايا
    csvContent += "كود الحساب;اسم الحساب المالي;مجموع الحركات مدين;مجموع الحركات دائن;صافي الرصيد الحالي\n";

    accounts.forEach(acc => {
        let td = 0, tc = 0;
        journalEntries.forEach(e => {
            if (e.debitCode === acc.code) td += e.amount;
            if (e.creditCode === acc.code) tc += e.amount;
        });
        csvContent += `${acc.code};${acc.name};${td};${tc};${td - tc}\n`;
    });

    let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    let link = document.createElement("a"); link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `Trial_Balance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

/* 3. ميزة كشف أرصدة العملاء والموردين بشكل مستقل (CRM Summary) */
function renderCrmBalancesReport() {
    const body = document.getElementById('crmTableBody');
    body.innerHTML = "";

    // فلترة حسابات الزبائن والموردين المنتمية للفئات [1 أو 2 أو 6] باستثناء الصندوق والنقدية الأساسية
    let targetCrmAccounts = accounts.filter(a => (a.code.startsWith('1') || a.code.startsWith('2')|| a.code.startsWith('6') ) && !["1001", "1002"].includes(a.code));

    if (targetCrmAccounts.length === 0) {
        body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:15px; color:#95a5a6;">لا توجد حسابات ذمم عملاء أو موردين مسجلة بدليل الشجرة حالياً.</td></tr>';
        return;
    }

    targetCrmAccounts.forEach(acc => {
        let td = 0, tc = 0;
        journalEntries.forEach(e => {
            if (e.debitCode === acc.code) td += e.amount;
            if (e.creditCode === acc.code) tc += e.amount;
        });
        let balance = td - tc;
        let nature = balance >= 0 ? "مدين (مستحق عليه لنا)" : "دائن (مستحق له علينا)";
        if (balance === 0) nature = "ملتزم (رصيد مصفر)";

        body.innerHTML += `<tr>
                    <td><b>${acc.code}</b></td>
                    <td>${acc.name}</td>
                    <td><span style="background:#eef2f7; padding:2px 8px; border-radius:4px; font-size:12px;">${acc.cat}</span></td>
                    <td><b style="color:${balance >= 0 ? 'var(--accent-blue)' : 'var(--accent-orange)'}">${nature}</b></td>
                    <td style="font-weight:bold;">${Math.abs(balance).toLocaleString()} ل.س</td>
                </tr>`;
    });
}
/* 4. محرك الميزانية العمومية (Balance Sheet) */
function generateBalanceSheet() {
    let assets = 0, liabilities = 0, equity = 0;
    
    // حساب الأرصدة بناءً على الشجرة المحاسبية (1: أصول، 2: خصوم، 3: حقوق ملكية)
    journalEntries.forEach(e => {
        let amt = parseFloat(e.amount) || 0;
        
        // الأصول (تبدأ بـ 1)
        if (e.debitCode && e.debitCode.startsWith('1')) assets += amt;
        if (e.creditCode && e.creditCode.startsWith('1')) assets -= amt;
        
        // الخصوم (تبدأ بـ 2)
        if (e.creditCode && e.creditCode.startsWith('2')) liabilities += amt;
        if (e.debitCode && e.debitCode.startsWith('2')) liabilities -= amt;
        
        // حقوق الملكية (تبدأ بـ 3)
        if (e.creditCode && e.creditCode.startsWith('3')) equity += amt;
        if (e.debitCode && e.debitCode.startsWith('3')) equity -= amt;
    });

    // العرض في صفحة التقارير (باستخدام نفس تنسيق الجداول لديك)
    const reportOutput = document.getElementById('reportOutput');
    if (!reportOutput) return;

    reportOutput.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-top: 20px;">
            <h2 style="text-align: center; color: #1a2b4c;">الميزانية العمومية</h2>
            <table class="balance-sheet-table" style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr style="background: #f4f7f9;">
                    <th style="padding: 12px; border: 1px solid #ddd;">البند</th>
                    <th style="padding: 12px; border: 1px solid #ddd;">القيمة (ل.س)</th>
                </tr>
                <tr><td style="padding: 10px; border: 1px solid #ddd;">إجمالي الأصول</td><td style="padding: 10px; border: 1px solid #ddd;">${assets.toLocaleString()}</td></tr>
                <tr><td style="padding: 10px; border: 1px solid #ddd;">إجمالي الخصوم</td><td style="padding: 10px; border: 1px solid #ddd;">${liabilities.toLocaleString()}</td></tr>
                <tr><td style="padding: 10px; border: 1px solid #ddd;">حقوق الملكية</td><td style="padding: 10px; border: 1px solid #ddd;">${equity.toLocaleString()}</td></tr>
                <tr style="background: #eee; font-weight: bold;">
                    <td style="padding: 10px; border: 1px solid #ddd;">المجموع (الخصوم + الحقوق)</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${(liabilities + equity).toLocaleString()}</td>
                </tr>
            </table>
        </div>`;
}

/* التعديل والمعاينة النظيفة */
function openEditModal(id) {
    let e = journalEntries.find(x => x.id === id);
    document.getElementById('editEntryId').value = e.id;
    document.getElementById('editEntryDate').value = e.date;
    document.getElementById('editEntryDesc').value = e.description;
    document.getElementById('lblEditDebitName').innerText = e.debitName;
    document.getElementById('lblEditCreditName').innerText = e.creditName;
    document.getElementById('editValDebit').value = e.amount;
    document.getElementById('editValCredit').value = e.amount;
    document.getElementById('editEntryModal').classList.remove('hidden');
    validateEditForm();
}

function closeEditModal() { document.getElementById('editEntryModal').classList.add('hidden'); }

function validateEditForm() {
    let dV = parseFloat(document.getElementById('editValDebit').value) || 0;
    let cV = parseFloat(document.getElementById('editValCredit').value) || 0;
    let btn = document.getElementById('btnSaveEditedEntry');
    let stat = document.getElementById('editFormStatus');
    if (dV > 0 && dV === cV) {
        btn.disabled = false; stat.innerText = "✅ القيد متوازن وصحيح"; stat.style.color = "green";
    } else {
        btn.disabled = true; stat.innerText = "❌ القيد غير متوازن"; stat.style.color = "red";
    }
}

function saveEditedEntry() {
    let id = document.getElementById('editEntryId').value;
    let e = journalEntries.find(x => x.id === id);
    e.date = document.getElementById('editEntryDate').value;
    e.description = document.getElementById('editEntryDesc').value;
    e.amount = parseFloat(document.getElementById('editValDebit').value);
    localStorage.setItem('myJournal', JSON.stringify(journalEntries));
    closeEditModal(); calculateAccountingEngine();

    if (!document.getElementById('tabReports').classList.contains('hidden')) {
        if (activeReportSubTab === 'ledger') generateReport();
        else if (activeReportSubTab === 'trial') calculateAndRenderTrialBalance();
        else if (activeReportSubTab === 'crm') renderCrmBalancesReport();
    }
    else if (!document.getElementById('tabJournal').classList.contains('hidden')) renderNewJournalTable();
    // داخل دالة saveEditedEntry
else if (activeReportSubTab === 'balance') generateBalanceSheet();
}

function resetAllData() {
    if (confirm("⚠️ تحذير: هل أنت متأكد من رغبتك في تصفير النظام وحذف كافة القيود؟")) {
        localStorage.removeItem('myJournal'); localStorage.removeItem('mySalesInvoices'); localStorage.removeItem('myPurchaseInvoices');
        journalEntries = []; salesInvoices = []; purchaseInvoices = [];
        calculateAccountingEngine();
        if (!document.getElementById('tabJournal').classList.contains('hidden')) renderNewJournalTable();
        if (!document.getElementById('tabReports').classList.contains('hidden')) initReportsTab();
        if (!document.getElementById('tabSales').classList.contains('hidden')) initSalesTab();
        if (!document.getElementById('tabPurchases').classList.contains('hidden')) initPurchasesTab();
        alert("تم تصفير النظام بالكامل.");
    }
}

function calculateAccountingEngine() {
    let assets = 0, liabilities = 0, revenues = 0, expenses = 0;
    journalEntries.forEach(e => {
        if (e.debitCode.startsWith('1')) assets += e.amount;
        if (e.debitCode.startsWith('2')) liabilities -= e.amount;
        if (e.debitCode.startsWith('4')) revenues -= e.amount;
        if (e.debitCode.startsWith('5')) expenses += e.amount;
        if (e.creditCode.startsWith('1')) assets -= e.amount;
        if (e.creditCode.startsWith('2')) liabilities += e.amount;
        if (e.creditCode.startsWith('4')) revenues += e.amount;
        if (e.creditCode.startsWith('5')) expenses -= e.amount;
    });
    let net = revenues - expenses;
    document.getElementById('lblNetProfit').innerText = net.toLocaleString() + " ل.س";
    document.getElementById('lblTotalAssets').innerText = assets.toLocaleString() + " ل.س";
    document.getElementById('lblTotalLiabilities').innerText = liabilities.toLocaleString() + " ل.س";
    document.getElementById('lblTotalEquity').innerText = (assets - liabilities).toLocaleString() + " ل.س";
}

if (localStorage.getItem('isLoggedIn') === 'true') showDashboard();
