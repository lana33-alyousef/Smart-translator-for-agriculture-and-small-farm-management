import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/client';
import { clearAdminAuth } from '../../auth/authStorage';
import { 
  FiUsers, FiLogOut, FiPieChart, FiActivity,
  FiSearch, FiBell, FiCreditCard, FiPackage, FiPercent,
  FiCheckCircle, FiXCircle, FiEye, FiTrash2
} from 'react-icons/fi';
import './AdminDashboard.css';
import logoImg from "../../img/logo.png";

const AdminDashboard = () => {
  // States لإدارة الباقات
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [newPlan, setNewPlan] = useState({
    name_ar: '',
    code: '',
    price_amount: 0,
    billing_period: 'month',
    discount_percent: 0,
    features: ''
  });
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  
  // States لحفظ البيانات القادمة من قاعدة البيانات
  const [summary, setSummary] = useState({ 
    users: { total: 0, farmers: 0, admins: 0 }, 
    subscriptions: { active: 0, total: 0 }, 
    reports: { total: 0 }, 
    inventory: { total: 0 } 
  });
  const [usersList, setUsersList] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [plansList, setPlansList] = useState([]);
  const [usageReports, setUsageReports] = useState([]);
  const [discounts, setDiscounts] = useState({ pro: 0, weekly: 0 });
  const [prices, setPrices] = useState({});
  const [expiries, setExpiries] = useState({});
  const [proofModalImage, setProofModalImage] = useState(null);

  // دالة مساعدة لتوليد الحروف الأولى من الاسم كرمز رمزي للمستخدم
  const getInitials = (name = '') => {
    return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('.');
  };

  const handlePriceChange = (planCode, value) => {
    setPrices(prev => ({ ...prev, [planCode]: Number(value) }));
  };

  const handleExpiryChange = (planCode, value) => {
    setExpiries(prev => ({ ...prev, [planCode]: value }));
  }

  // ترجمة مفاتيح الخدمات للغة العربية في قسم التقارير
  const translateServiceKey = (key) => {
    const keys = {
      'disease_analysis': 'المختبر الذكي (AI)',
      'plant_growth': 'سجل نمو النباتات',
      'irrigation_scheduler': 'جدولة الري والتسميد',
      'soil_monitoring': 'رصد التربة والري',
      'inventory': 'إدارة المخزون'
    };
    return keys[key] || key;
  };

  // جلب البيانات بناءً على التبويب النشط لضمان السرعة والتحديث اللحظي
  useEffect(() => {
    const fetchTabData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'overview') {
          const [sumRes, payRes, usersRes] = await Promise.all([
            adminApi.get('/api/admin/summary/'),
            adminApi.get('/api/admin/payments/pending/'),
            adminApi.get('/api/admin/users/')
          ]);
          setSummary(sumRes.data);
          setPaymentsList(payRes.data || []);
          setUsersList(usersRes.data || []);
        } else if (activeTab === 'users') {
          const res = await adminApi.get('/api/admin/users/');
          setUsersList(res.data || []);
        } else if (activeTab === 'payments') {
          const res = await adminApi.get('/api/admin/payments/pending/');
          setPaymentsList(res.data || []);
        } else if (activeTab === 'subscriptions') {
          const res = await adminApi.get('/api/admin/plans/');
          setPlansList(res.data || []);
          
          const initialPrices = {};
          const initialDiscounts = {};
          const initialExpiries = {};
          (res.data || []).forEach(p => { 
            initialPrices[p.code] = Number(p.price_amount) || 0;
            initialDiscounts[p.code] = Number(p.discount_percent) || 0; 
          });
          setPrices(initialPrices);
          setDiscounts(initialDiscounts);
          setExpiries(initialExpiries);
        } else if (activeTab === 'reports') {
          const res = await adminApi.get('/api/admin/usages/');
          setUsageReports(res.data || []);
        }
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          clearAdminAuth();
          navigate('/admin-login');
        }
        console.error("خطأ أثناء جلب البيانات من السيرفر:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTabData();
  }, [activeTab, navigate]);


  // تحديث الباقة (السعر، الخصم، وتاريخ انتهاء الخصم)
  const handleUpdateExistingPlan = async (planId, currentPrice, currentDiscount, currentExpiry) => {
    try {
      await adminApi.patch(`/api/admin/plans/${planId}/`, {
        price_amount: currentPrice,
        discount_percent: currentDiscount,
        discount_expiry: currentExpiry || null // إرسال null في حال لم يتم تحديد تاريخ
      });
      setActionMessage("✅ تم تحديث بيانات الباقة وفترة الخصم بنجاح");
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage("❌ حدث خطأ أثناء التحديث");
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  // إضافة باقة جديدة
  const handleCreateNewPlan = async () => {
    try {
      const formattedFeatures = newPlan.features.split('\n').filter(f => f.trim() !== '');
      const payload = { ...newPlan, features: formattedFeatures, is_active: true };
      
      await adminApi.post('/api/admin/plans/', payload);
      
      setActionMessage("✅ تم إضافة الباقة الجديدة بنجاح!");
      setShowAddPlanModal(false);
      setNewPlan({ name_ar: '', code: '', price_amount: 0, billing_period: 'month', discount_percent: 0, features: '' });
      
      // إعادة جلب الباقات لتحديث الواجهة
      const res = await adminApi.get('/api/admin/plans/');
      setPlansList(res.data || []);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage("❌ تعذر إضافة الباقة، تأكد من صحة البيانات.");
      setTimeout(() => setActionMessage(null), 3000);
    }
  };


  // حذف مستخدم نهائياً من قاعدة البيانات
  const handleDeleteUser = async (id) => {
    if (!window.confirm("⚠️ هل أنت متأكد من رغبتك في حذف هذا المستخدم نهائياً؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    try {
      await adminApi.delete(`/api/admin/users/${id}/`);
      setUsersList(prev => prev.filter(u => u.id !== id));
      alert("✅ تم حذف حساب المستخدم بنجاح من قاعدة البيانات.");
    } catch (err) {
      alert("❌ تعذر حذف المستخدم نظراً لارتباطه بسجلات اشتراك أو مدفوعات.");
    }
  };

  // قبول أو رفض الدفعات وتحديث الاشتراكات فوراً
  const handlePaymentAction = async (id, action) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في ${action === 'approve' ? 'قبول' : 'رفض'} هذه الدفعة؟`)) return;
    try {
      await adminApi.post(`/api/admin/payments/${id}/approve/`, { action });
      setPaymentsList(prev => prev.filter(p => p.id !== id));
      alert(action === 'approve' ? "✅ تم قبول الدفعة وتفعيل باقة المستخدم بنجاح." : "❌ تم رفض طلب الدفع.");
    } catch (err) {
      alert("❌ حدث خطأ أثناء معالجة طلب الدفع على السيرفر.");
    }
  };

  // تتبع تغيير شريط الخصومات في الواجهة
  const handleDiscountChange = (planCode, value) => {
    setDiscounts(prev => ({ ...prev, [planCode]: parseInt(value) }));
  };

  // حذف باقة موجودة
  const handleDeletePlan = async (planId) => {
    if (!window.confirm("⚠️ هل أنت متأكد من رغبتك في حذف هذه الباقة؟ لا يمكن التراجع عن هذا الإجراء وسيتم إخفاؤها من الموقع.")) return;
    try {
      await adminApi.delete(`/api/admin/plans/${planId}/`);
      // إزالة الباقة المحذوفة من الواجهة فوراً
      setPlansList(prev => prev.filter(p => p.id !== planId));
      setActionMessage("✅ تم حذف الباقة بنجاح.");
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage("❌ تعذر حذف الباقة، قد تكون مرتبطة باشتراكات نشطة لمزارعين.");
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // ================= 1. لوحة القيادة المنسقة =================
  const renderOverview = () => (
    <div className="admin-overview fade-in">
      <div className="overview-header">
        <div>
          <h3 className="section-title">ملخص أداء المنصة الزراعية</h3>
          <p className="section-subtitle">إحصائيات حية ومباشرة مستخرجة من قاعدة البيانات</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-card-content">
            <span className="stat-label">إجمالي المزارعين</span>
            <p className="stat-val">{summary.users?.farmers || 0}</p>
          </div>
          <div className="stat-icon-wrapper blue"><FiUsers /></div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-card-content">
            <span className="stat-label">الاشتراكات الفعالة</span>
            <p className="stat-val">{summary.subscriptions?.active || 0}</p>
          </div>
          <div className="stat-icon-wrapper green"><FiCheckCircle /></div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-card-content">
            <span className="stat-label">دفعات قيد الانتظار</span>
            <p className="stat-val">{paymentsList.length}</p>
          </div>
          <div className="stat-icon-wrapper orange"><FiCreditCard /></div>
        </div>
      </div>

      <div className="admin-panel">
        <div className="section-header-flex">
          <h3>أحدث المزارعين المنضمين حديثاً</h3>
          <button className="btn-link-action" onClick={() => setActiveTab('users')}>عرض كافة المزارعين</button>
        </div>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>المزارع</th>
                <th>البريد الإلكتروني</th>
                <th>تاريخ التسجيل</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {usersList.slice(0, 4).map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="user-profile-td">
                      <div className="avatar-circle-small">{getInitials(u.full_name || u.email)}</div>
                      <span className="user-table-name">{u.full_name || "مزارع جديد"}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.date_joined ? new Date(u.date_joined).toLocaleDateString('ar-EG') : '-'}</td>
                  <td><span className="status-pill active">نشط</span></td>
                </tr>
              ))}
              {usersList.length === 0 && <tr><td colSpan="4" className="empty-table-msg">لا يوجد مزارعون مسجلون حالياً.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ================= 2. إدارة المستخدمين =================
  const renderUsers = () => (
    <div className="admin-section-content fade-in">
      <h3 className="section-title">إدارة حسابات المزارعين</h3>
      <p className="section-subtitle">التحكم في صلاحيات الحسابات المسجلة وحذفها من النظام</p>
      
      <div className="admin-panel" style={{ marginTop: '20px' }}>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>المعرف</th>
                <th>المزارع</th>
                <th>البريد الإلكتروني</th>
                <th>رقم الهاتف</th>
                <th>تاريخ الإنضمام</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map(u => (
                <tr key={u.id}>
                  <td className="text-muted-bold">#{u.id}</td>
                  <td>
                    <div className="user-profile-td">
                      <div className="avatar-circle-small">{getInitials(u.full_name || u.email)}</div>
                      <span className="user-table-name">{u.full_name}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>{u.phone_number || '-'}</td>
                  <td>{u.date_joined ? new Date(u.date_joined).toLocaleDateString('ar-EG') : '-'}</td>
                  <td>
                    <button className="action-button-btn delete-btn" onClick={() => handleDeleteUser(u.id)}>
                      <FiTrash2 /> حذف الحساب
                    </button>
                  </td>
                </tr>
              ))}
              {usersList.length === 0 && <tr><td colSpan="6" className="empty-table-msg">لا توجد سجلات مستخدمين لعرضها.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ================= 3. إدارة المدفوعات بقبول الدفعات =================
  const renderPayments = () => (
    <div className="admin-section-content fade-in">
      <h3 className="section-title">إدارة مراجعة وتأكيد المدفوعات</h3>
      <p className="section-subtitle">التحقق من إيصالات التحويل الواردة وتفعيل الاشتراكات المقابلة</p>

      <div className="admin-panel" style={{ marginTop: '20px' }}>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>المعرف</th>
                <th>الباقة المطلوبة</th>
                <th>وسيلة الدفع</th>
                <th>المبلغ المحول</th>
                <th>بيانات الإثبات / التحويل</th>
                <th>خيارات الاعتماد</th>
              </tr>
            </thead>
            <tbody>
              {paymentsList.map(p => (
                <tr key={p.id}>
                  <td className="text-muted-bold">#{p.id}</td>
                  <td><span className="plan-badge-ui">{p.plan_name || 'باقة مدفوعة'}</span></td>
                  <td>{p.method === 'sham_cash' ? 'Sham Cash' : 'SyriTel Cash'}</td>
                  <td style={{ fontWeight: '800', color: 'var(--admin-primary)' }}>{Number(p.amount).toLocaleString()} ل.س</td>
                  <td>
                    {p.proof_image ? (
                      <button className="btn-view-proof-image" onClick={() => setProofModalImage(p.proof_image)}>
                        <FiEye /> عرض صورة الإيصال
                      </button>
                    ) : p.transaction_number ? (
                      <span className="transaction-code-badge">{p.transaction_number}</span>
                    ) : (
                      <span className="no-proof-text">لا يوجد إثبات مرفق</span>
                    )}
                  </td>
                  <td className="actions-cell-flex">
                    <button className="action-button-btn approve-btn" onClick={() => handlePaymentAction(p.id, 'approve')}>
                      <FiCheckCircle /> قبول وتفعيل
                    </button>
                    <button className="action-button-btn reject-btn" onClick={() => handlePaymentAction(p.id, 'reject')}>
                      <FiXCircle /> رفض الطلب
                    </button>
                  </td>
                </tr>
              ))}
              {paymentsList.length === 0 && <tr><td colSpan="6" className="empty-table-msg"> لا توجد طلبات دفع معلقة متبقية للمراجعة</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

// ================= 4. الباقات والاشتراكات والخصومات =================
  const renderSubscriptions = () => (
    <div className="admin-section-content fade-in">
      <div className="section-header-flex">
        <div>
          <h3 className="section-title">إدارة ميزات وخصومات الباقات الزراعية</h3>
          <p className="section-subtitle">إضافة باقات جديدة، تعديل الأسعار، وإضافة كوبونات خصم فورية</p>
        </div>
        <button className="btn-subscribe" onClick={() => setShowAddPlanModal(true)}>
          + إضافة باقة جديدة
        </button>
      </div>

      {actionMessage && <div className="payment-note success" style={{marginTop: '15px'}}>{actionMessage}</div>}

      <div className="admin-plans-grid-layout" style={{ marginTop: '25px' }}>
        {/* تم إضافة filter لإخفاء الباقة المجانية (الأساسية) من لوحة التحكم */}
        {plansList.filter(plan => plan.code !== 'basic').map(plan => {
          const currentPrice = prices[plan.code] !== undefined ? prices[plan.code] : Number(plan.price_amount);
          const currentDiscount = discounts[plan.code] !== undefined ? discounts[plan.code] : (Number(plan.discount_percent) || 0);
          const finalPrice = currentPrice - (currentPrice * currentDiscount / 100);

          return (
            <div className={`admin-plan-manage-card ${plan.code === 'pro' ? 'featured-border' : ''}`} key={plan.id}>
              <div className="plan-card-header-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h4>{plan.name_ar}</h4>
                  <span className="plan-code-tag">{plan.code.toUpperCase()}</span>
                </div>
                
                <button 
                  className="action-button-btn delete-btn" 
                  onClick={() => handleDeletePlan(plan.id)}
                  title="حذف هذه الباقة"
                  style={{ padding: '6px 10px' }}
                >
                  <FiTrash2 /> حذف
                </button>
              </div>
              
              <div className="admin-input-group" style={{marginTop: '15px'}}>
                <label>السعر الأساسي (ل.س):</label>
                <input 
                  type="number" 
                  value={currentPrice} 
                  onChange={(e) => handlePriceChange(plan.code, e.target.value)}
                  className="modern-admin-input"
                />
              </div>

              {currentPrice > 0 && (
                <div className="discount-slider-control-box" style={{marginTop: '15px'}}>
                  <div className="slider-labels-flex">
                    <span><FiPercent /> نسبة الخصم المستهدفة:</span>
                    <strong className="discount-percent-val">{currentDiscount}%</strong>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5"
                    value={currentDiscount} 
                    onChange={(e) => handleDiscountChange(plan.code, e.target.value)}
                    className="modern-admin-range-slider"
                  />
                  {currentDiscount > 0 && (
                    <div className="admin-input-group" style={{marginTop: '12px'}}>
                      <label style={{fontSize: '0.8rem', color: '#166534'}}>تاريخ انتهاء صلاحية الخصم:</label>
                      <input 
                        type="date"
                        value={expiries[plan.code] || ''}
                        onChange={(e) => handleExpiryChange(plan.code, e.target.value)}
                        className="modern-admin-input"
                        style={{marginTop: '4px', padding: '6px 10px'}}
                      />
                    </div>
                  )}
                  <div className="calculated-savings-notice">
                    السعر النهائي للعميل: {finalPrice.toLocaleString()} ل.س
                  </div>
                </div>
              )}

              <div className="plan-db-features-list">
                <h5>المميزات:</h5>
                <ul className="styled-features-list">
                  {Array.isArray(plan.features) ? plan.features.map((f, i) => (
                    <li key={i}>✓ {f}</li>
                  )) : <li>لا توجد مميزات مسجلة</li>}
                </ul>
              </div>

              <button className="btn-save-plan-config-settings" onClick={() => handleUpdateExistingPlan(plan.id, currentPrice, currentDiscount, expiries[plan.code])}>
                حفظ وتحديث الباقة
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal إضافة باقة جديدة مع تنسيقات محسنة لمنع التداخل */}
      {showAddPlanModal && (
        <div className="modal-backdrop" onClick={() => setShowAddPlanModal(false)}>
          <div className="payment-modal-box glassmorphism-effect custom-admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-modern">
               <h2>إضافة باقة اشتراك جديدة</h2>
               <button className="close-icon-btn" onClick={() => setShowAddPlanModal(false)}>×</button>
            </div>
            
            <div className="admin-modal-body-scroll">
              <div className="admin-form-grid">
                <div className="input-group">
                  <label>الاسم (عربي)</label>
                  <input type="text" placeholder="مثال: الباقة الذهبية" className="proof-input" value={newPlan.name_ar} onChange={e => setNewPlan({...newPlan, name_ar: e.target.value})} />
                </div>
                
                <div className="input-group">
                  <label>كود الباقة (إنجليزي)</label>
                  <input type="text" placeholder="مثال: gold" className="proof-input" value={newPlan.code} onChange={e => setNewPlan({...newPlan, code: e.target.value})} />
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="input-group">
                  <label>السعر (ل.س)</label>
                  <input type="number" className="proof-input" value={newPlan.price_amount} onChange={e => setNewPlan({...newPlan, price_amount: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>فترة التجديد</label>
                  <select className="proof-input" value={newPlan.billing_period} onChange={e => setNewPlan({...newPlan, billing_period: e.target.value})}>
                    <option value="month">شهرياً</option>
                    <option value="year">سنوياً</option>
                    <option value="week">أسبوعياً</option>
                  </select>
                </div>
              </div>

              <div className="input-group" style={{marginTop: '10px'}}>
                <label>المميزات (ميزة في كل سطر)</label>
                <textarea className="proof-input" rows="4" value={newPlan.features} onChange={e => setNewPlan({...newPlan, features: e.target.value})} placeholder="دعم فني 24/7&#10;تحليل يومي للتربة" />
              </div>
            </div>

            <div className="payment-actions-footer" style={{marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0'}}>
              <button className="btn-cancel" onClick={() => setShowAddPlanModal(false)}>إلغاء</button>
              <button className="btn-subscribe modal-btn" onClick={handleCreateNewPlan}>حفظ وإنشاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ================= 5. التقارير الشاملة لحركات المستخدمين والخدمات =================
  const renderReports = () => (
    <div className="admin-section-content fade-in">
      <h3 className="section-title">سجل تقارير حركات استخدام الخدمات الشاملة</h3>
      <p className="section-subtitle">مراقبة تفصيلية لكافة حركات المزارعين، الخدمات المستهلكة، وعدد المحاولات المنفذة</p>

      <div className="admin-panel" style={{ marginTop: '20px' }}>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>معرف السجل</th>
                <th>بريد المزارع الإلكتروني</th>
                <th>نوع خطة الاشتراك</th>
                <th>الخدمة المستهلكة</th>
                <th>إجمالي مرات الاستخدام</th>
                <th>آخر حركة تتبع</th>
              </tr>
            </thead>
            <tbody>
              {usageReports.map(report => (
                <tr key={report.id}>
                  <td className="text-muted-bold">#{report.id}</td>
                  <td style={{ fontWeight: '700', color: 'var(--admin-text-dark)' }}>{report.user_email}</td>
                  <td>
                    <span className={`plan-badge-pill-ui ${report.plan_code || 'basic'}`}>
                      {report.plan_name || 'الأساسية (المجانية)'}
                    </span>
                  </td>
                  <td>
                    <span className="service-name-tag-pill">
                      {translateServiceKey(report.service_key)}
                    </span>
                  </td>
                  <td style={{ fontWeight: '800', fontSize: '1.05rem', color: '#166534' }}>
                    {report.count} {report.count === -1 ? '∞' : 'عمليات'}
                  </td>
                  <td>{report.updated_at ? new Date(report.updated_at).toLocaleString('ar-EG') : '-'}</td>
                </tr>
              ))}
              {usageReports.length === 0 && <tr><td colSpan="6" className="empty-table-msg">لا توجد حركات استخدام مسجلة في النظام بعد.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard-container" dir="rtl">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand-header">
          <img src={logoImg} alt="AgriSmart" className="admin-brand-logo-img" />
          <h2>لوحة التحكم</h2>
        </div>
        <ul className="admin-nav-list">
          <li className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            <FiPieChart className="admin-icon" /> <span>لوحة القيادة</span>
          </li>
          <li className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
            <FiUsers className="admin-icon" /> <span>إدارة المزارعين</span>
          </li>
          <li className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>
            <FiCreditCard className="admin-icon" /> <span>إدارة المدفوعات</span>
          </li>
          <li className={activeTab === 'subscriptions' ? 'active' : ''} onClick={() => setActiveTab('subscriptions')}>
            <FiPackage className="admin-icon" /> <span>الباقات والاشتراكات</span>
          </li>
          <li className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>
            <FiActivity className="admin-icon" /> <span>التقارير الشاملة</span>
          </li>
        </ul>
        <div className="sidebar-footer-container">
          <li className="admin-logout-sidebar-btn" onClick={() => { clearAdminAuth(); navigate('/admin-login'); }}>
            <FiLogOut className="admin-icon" /> <span>تسجيل الخروج</span>
          </li>
        </div>
      </aside>

      <main className="admin-main-content">
        <header className="admin-topbar" dir='ltr'>

          <div className="topbar-profile-actions-wrapper">

            <div className="admin-avatar-info-pill">
              <span className="admin-avatar-text-pill">مدير النظام</span>
            </div>
          </div>
        </header>

        <div className="admin-dashboard-page-view-padding">
          {isLoading && (
            <div className="global-admin-loading-screen-box">
              <div className="admin-loading-spinner-circle"></div>
              <p>جاري مزامنة وجلب البيانات الحية من السيرفر الزراعي...</p>
            </div>
          )}
          
          {!isLoading && activeTab === 'overview' && renderOverview()}
          {!isLoading && activeTab === 'users' && renderUsers()}
          {!isLoading && activeTab === 'payments' && renderPayments()}
          {!isLoading && activeTab === 'subscriptions' && renderSubscriptions()}
          {!isLoading && activeTab === 'reports' && renderReports()}
        </div>
      </main>

      {/* Modal نافذة عرض صورة إيصال التحويل بشكل احترافي ومكبر */}
      {proofModalImage && (
        <div className="proof-modal-overlay" onClick={() => setProofModalImage(null)}>
          <div className="proof-modal-content" onClick={e => e.stopPropagation()}>
            <img src={proofModalImage} alt="إيصال تحويل المزارع المرفق" className="proof-modal-image" />
            <button className="close-modal-btn" onClick={() => setProofModalImage(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;