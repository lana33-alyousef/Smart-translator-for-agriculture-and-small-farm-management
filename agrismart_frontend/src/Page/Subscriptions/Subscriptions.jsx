import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../Component/Navbar/Navbar';
import './Subscriptions.css';
import { api } from '../../api/client';
import { isAuthenticated } from '../../auth/authStorage';

const Subscriptions = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('sham_cash');
  const [createdPayment, setCreatedPayment] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // حالة جديدة لرصد إذا كانت هناك دفعة معلقة قيد التحقق حالياً
  const [isPaymentPending, setIsPaymentPending] = useState(false);

  // States for the proof fields
  const [transactionNumber, setTransactionNumber] = useState('');
  const [proofImage, setProofImage] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get('/api/plans/');
        if (!mounted) return;
        setPlans(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!mounted) return;
        setPlans(null);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let mounted = true;
    api.get('/api/my-subscription/')
      .then((res) => { if (mounted) setCurrentSubscription(res.data?.subscription || null); })
      .catch(() => { if (mounted) setCurrentSubscription(null); });
    return () => { mounted = false; };
  }, []);

  const normalizedPlans = useMemo(() => {
    if (!plans) return null;
    
    return plans.map((p) => {
        const periodText = p.billing_period === 'week' ? '/ أسبوعياً' : p.billing_period === 'year' ? '/ سنوياً' : '/ شهرياً';
        
        const originalPrice = Number(p.price_amount);
        const discount = Number(p.discount_percent || 0);
        const expiryDate = p.discount_expiry ? new Date(p.discount_expiry) : null;
        const today = new Date();

        // التحقق مما إذا كان الخصم ساري المفعول ولم تنتهِ مدته بعد
        const isDiscountActive = discount > 0 && (!expiryDate || expiryDate > today);
        
        // حساب السعر النهائي بناءً على حالة الخصم
        const finalPrice = isDiscountActive 
          ? originalPrice - (originalPrice * discount / 100) 
          : originalPrice;

        // صياغة نص انتهاء الخصم بصيغة مقروءة للعميل
        let discountExpiryText = null;
        if (isDiscountActive && expiryDate) {
          discountExpiryText = `ينتهي العرض في: ${expiryDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}`;
        }

        return {
          id: p.id,
          code: p.code,
          title: p.name_ar,
          priceText: finalPrice === 0 ? 'مجاناً' : `${finalPrice.toLocaleString()} ل.س`,
          oldPriceText: isDiscountActive ? `${originalPrice.toLocaleString()} ل.س` : null,
          discountExpiryText: discountExpiryText, // النص المراد عرضه
          periodText: finalPrice === 0 ? '' : periodText,
          features: Array.isArray(p.features) ? p.features : [],
          isPopular: p.code === 'pro',
        };
      });
  }, [plans]);

  const handleSelectPlan = (plan) => {
    if (!isAuthenticated()) { navigate('/login'); return; }
    setSelectedPlan(plan);
    setSelectedMethod('sham_cash');
    setCreatedPayment(null);
    setPaymentMessage('');
    setActionError('');
    setTransactionNumber('');
    setProofImage(null);
    setShowPaymentModal(true);
  };

  const handleCreatePayment = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);
    setActionError('');
    setPaymentMessage('');
    try {
      const res = await api.post('/api/payments/create/', {
        plan_id: selectedPlan.id,
        method: selectedMethod,
      });
      setCreatedPayment(res.data?.payment || null);
      const title = res.data?.instructions?.title;
      const message = res.data?.instructions?.message;
      setPaymentMessage([title, message].filter(Boolean).join(' - '));
    } catch (err) {
      if (err?.response?.status === 403) { navigate('/login'); return; }
      setActionError(err?.response?.data?.detail || 'تعذر إنشاء الدفعة');
    } finally { setIsSubmitting(false); }
  };

  const handleConfirmPayment = async () => {
    if (!createdPayment) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (selectedMethod === 'syrtel_cash') {
        if(!transactionNumber) return alert("يرجى إدخال رقم العملية");
        formData.append('transaction_number', transactionNumber);
      } else {
        if(!proofImage) return alert("يرجى إرفاق صورة الإثبات");
        formData.append('proof_image', proofImage);
      }

      await api.post(`/api/payments/${createdPayment.id}/confirm/`, formData);
      
      setPaymentMessage('✅ تم إرسال الإثبات بنجاح! طلبك الآن قيد المراجعة من قبل الإدارة. سيتم تفعيل الباقة فور التأكد من الدفعة.');
      
      // تفعيل رسالة المراجعة عند كرت الاشتراك الحالي في الأعلى فوراً
      setIsPaymentPending(true);
      
      setTimeout(() => {
          setShowPaymentModal(false);
          setCreatedPayment(null);
          setPaymentMessage('');
      }, 4000);

    } catch (err) {
      setActionError(err?.response?.data?.detail || 'فشل إرسال الإثبات، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="subscriptions-page">
        <div className="subscriptions-header">
          <h1>باقات الاشتراك</h1>
          <p>قم بمتابعة حالة مزرعتك باستخدام أدوات الذكاء الاصطناعي، واختر الباقة التي تلبي احتياجك.</p>
        </div>

        {currentSubscription?.plan ? (
          <div className="subscription-status-card">
            <div className="status-info">
              <h3>الاشتراك الحالي</h3>
              <p>
                {currentSubscription.plan.name_ar} 
                <span className={`status-badge ${currentSubscription.status === 'active' ? 'active' : 'expired'}`}>
                  {currentSubscription.status === 'active' ? 'نشط' : currentSubscription.status}
                </span>
              </p>
              
              {/* إظهار رسالة التحقق والانتظار هنا فور الإرسال بطلبك */}
              {isPaymentPending && (
                <div className="status-pending-notice-msg">
                  ⏳ جاري التحقق من الدفعة، سيتم قبول الدفعة في أسرع وقت.
                </div>
              )}
            </div>
            <div className="status-currency">
              <span className="subscription-status-pill">{currentSubscription.plan.price_currency || 'SYP'}</span>
            </div>
          </div>
        ) : null}

        <div className="pricing-cards">
          {normalizedPlans ? (
            normalizedPlans.map((plan) => (
              
              <div key={plan.code} className={`pricing-card ${plan.isPopular ? 'popular' : ''}`}>
                {plan.discountExpiryText && (
                    <div className="discount-countdown-badge" style={{
                      fontSize: '0.75rem',
                      color: '#dc2626',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fca5a5',
                      padding: '4px 8px',
                      borderRadius: '20px',
                      marginBottom: '8px',
                      display: 'inline-block',
                      fontWeight: 'bold'
                    }}>
                      ⏳ {plan.discountExpiryText}
                    </div>
                  )}
                {plan.isPopular && <div className="badge">الأكثر طلباً 🌟</div>}
                <h2>{plan.title}</h2>
                <div className="price">
                  {/* عرض السعر القديم مشطوباً في حال وجود خصم */}
                  {plan.oldPriceText && (
                    <div style={{ textDecoration: 'line-through', fontSize: '0.5em', color: '#f51f1fff', marginBottom: '-5px' }}>
                      {plan.oldPriceText}
                    </div>
                  )}
                  {plan.priceText}
                  {plan.periodText ? <span>{plan.periodText}</span> : null}
                  
                </div>
                <ul className="features-list">
                  {plan.features.map((f, idx) => (
                    <li key={idx}>{f}</li>
                  ))}
                </ul>
                
                <div className="card-footer-action">
                  {plan.code === 'basic' ? (
                    <div className="basic-plan-label">
                      {currentSubscription?.plan?.code === plan.code ? (
                        <span className="current-active-label">✓ هذه خطتك الحالية</span>
                      ) : (
                        <span className="default-plan-label">الخطة الافتراضية للمنصة</span>
                      )}
                    </div>
                  ) : (
                    <button
                      className={`btn-subscribe ${currentSubscription?.plan?.code === plan.code ? 'current-plan-btn' : ''}`}
                      onClick={() => handleSelectPlan(plan)}
                      type="button"
                      disabled={currentSubscription?.plan?.code === plan.code}
                    >
                      {currentSubscription?.plan?.code === plan.code ? '✓ خطتك الحالية' : 'اشترك الآن'}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
             <p className="loading-text">جاري تحميل الباقات المتاحة...</p>
          )}
        </div>
      </div>

      {showPaymentModal && selectedPlan ? (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setShowPaymentModal(false)}>
          <div className="payment-modal-box" onClick={(e) => e.stopPropagation()}>
            
            <div className="payment-order-summary">
              <div>
                <h2>إتمام الاشتراك: {selectedPlan.title}</h2>
                <p>اختر طريقة الدفع المناسبة وأرفق الإثبات لتفعيل باقتك.</p>
              </div>
              <div className="order-price-tag">
                {selectedPlan.priceText}
              </div>
            </div>

            <div className="payment-modal-body">
              {!createdPayment ? (
                <>
                  <h4 className="step-title">1. حدد وسيلة الدفع:</h4>
                  <div className="payment-methods-grid">
                    <div 
                      className={`payment-method-card ${selectedMethod === 'sham_cash' ? 'active' : ''}`}
                      onClick={() => setSelectedMethod('sham_cash')}
                    >
                      <div className="method-icon">💳</div>
                      <div className="method-title">Sham Cash</div>
                      <div className="method-desc">تحويل عبر تطبيق شام كاش</div>
                    </div>
                    <div 
                      className={`payment-method-card ${selectedMethod === 'syrtel_cash' ? 'active' : ''}`}
                      onClick={() => setSelectedMethod('syrtel_cash')}
                    >
                      <div className="method-icon">📱</div>
                      <div className="method-title">SyriTel Cash</div>
                      <div className="method-desc">تحويل عبر سيريتل كاش</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="proof-upload-section">
                  <h4 className="step-title">2. تأكيد وتوثيق العملية:</h4>
                  
                  <div className="account-info-box">
                    <p>يرجى تحويل مبلغ <strong>{selectedPlan.priceText}</strong> إلى الحساب التالي:</p>
                    <h3 className="account-number">
                      {selectedMethod === 'syrtel_cash' ? '0930000000 (سيريتل كاش)' : '0990000000 (شام كاش)'}
                    </h3>
                  </div>

                  {selectedMethod === 'syrtel_cash' ? (
                    <div className="input-group">
                      <label>رقم العملية (Transaction Number):</label>
                      <input 
                        type="text" 
                        className="proof-input"
                        placeholder="أدخل رقم العملية المرسل في رسالة التحويل" 
                        value={transactionNumber}
                        onChange={(e) => setTransactionNumber(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="input-group">
                      <label>إرفاق لقطة شاشة (Screenshot) لنجاح التحويل:</label>
                      <input 
                        type="file" 
                        id="proofFile"
                        className="proof-file-input-hidden"
                        accept="image/*"
                        onChange={(e) => setProofImage(e.target.files[0])}
                      />
                      <label htmlFor="proofFile" className="proof-file-custom-btn">
                        {proofImage ? 'تغيير الصورة' : '📥 اضغط هنا لاختيار الصورة'}
                      </label>
                      {proofImage && <div className="file-name-preview">✅ تم إرفاق: {proofImage.name}</div>}
                    </div>
                  )}
                </div>
              )}

              {paymentMessage && <div className="payment-note success">✨ {paymentMessage}</div>}
              {actionError && <div className="payment-note error">⚠️ {actionError}</div>}
            </div>

            <div className="payment-actions-footer">
              <button className="btn-cancel" onClick={() => setShowPaymentModal(false)} disabled={isSubmitting}>
                إلغاء والتراجع
              </button>
              <button 
                className="btn-subscribe modal-btn" 
                onClick={createdPayment ? handleConfirmPayment : handleCreatePayment} 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><span className="spinner"></span> جاري المعالجة...</>
                ) : (
                  createdPayment ? 'تأكيد وإرسال الإثبات' : 'متابعة العملية'
                )}
              </button>
            </div>

          </div>
        </div>
      ) : null}
    </>
  );
};

export default Subscriptions;