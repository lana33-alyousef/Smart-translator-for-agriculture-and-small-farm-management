 import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from "../../Component/Navbar/Navbar";
import "./HelpCenter.css";

import { 
  BiCompass, 
  BiBookOpen, 
  BiWrench, 
  BiKey, 
  BiHomeAlt, 
  BiCreditCard, 
  BiClipboard,
  BiCheckCircle,
  BiUser,
  BiFileBlank,
  BiTimeFive,
  BiErrorCircle,
  BiHelpCircle
} from 'react-icons/bi';

const HelpCenter = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('quick-start');

  useEffect(() => {
    if (location.state && location.state.activeTab) {
      setActiveTab(location.state.activeTab);
    }
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="help-center-wrapper">
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet" />
      
      <Navbar />   

      <header className="help-header">
        <h1>مركز دعم ومساعدة AgriSmart</h1>
        <p>دليلك الشامل لإدارة مزرعتك ومحاصيلك بأحدث تقنيات الذكاء الاصطناعي</p>
      </header>

      <main className="help-main">
        
        {/* أزرار التبويبات */}
        <div className="tab-container">
          <button onClick={() => setActiveTab('quick-start')} className={`tab-btn ${activeTab === 'quick-start' ? 'active' : 'inactive'}`}>
            <BiCompass size={19} /> دليل البدء السريع
          </button>
          <button onClick={() => setActiveTab('user-guide')} className={`tab-btn ${activeTab === 'user-guide' ? 'active' : 'inactive'}`}>
            <BiBookOpen size={19} /> دليل المستخدم
          </button>
          <button onClick={() => setActiveTab('tech-support')} className={`tab-btn ${activeTab === 'tech-support' ? 'active' : 'inactive'}`}>
            <BiWrench size={19} /> الدعم الفني
          </button>
        </div>

        <div className="help-card">
          
          {/* ================= 1. دليل البدء السريع ================= */}
          {activeTab === 'quick-start' && (
            <div className="animate-fade-in">
              <h2 className="help-title">دليل البدء السريع (Quick Start Guide)</h2>
              <p className="help-intro-text">
                مرحباً بك في عائلة <strong className="brand-highlight">AgriSmart</strong>. تم تصميم هذا النظام المتطور خصيصاً لمساعدتك على إدارة مزرعتك ومتابعة أنشطتك الزراعية اليومية بطريقة سهلة، ذكية وفعالة للغاية. اتبع الخطوات الست التالية لتبدأ رحلتك معنا:
              </p>
              
              <div className="steps-wrapper">
                
                <div className="step-card">
                  <div className="step-card-header">
                    <BiKey size={20} className="step-icon" />
                    <h3 className="step-title">الخطوة الأولى: الوصول إلى حسابك</h3>
                  </div>
                  <p className="help-text">قم بإدخال البريد الإلكتروني وكلمة المرور الخاصة بك في صفحة تسجيل الدخول. إذا كنت مستخدماً جديداً، يمكنك إنشاء حسابك فوراً أو التواصل مع مسؤول النظام لتزويدك ببيانات الدخول.</p>
                </div>

                <div className="step-card">
                  <div className="step-card-header">
                    <BiHomeAlt size={20} className="step-icon" />
                    <h3 className="step-title">الخطوة الثانية: استكمال ملف المزرعة</h3>
                  </div>
                  <p className="help-text">عند دخولك للنظام لأول مرة، يرجى تزويدنا بالبيانات الأساسية لتهيئة لوحة التحكم: اسم المزرعة، موقعها الجغرافي الدقيق، وتحديد أنواع المحاصيل المزروعة. لا تنسَ الضغط على زر <strong>حفظ البيانات</strong> لتفعيل التوصيات الذكية.</p>
                </div>

                <div className="step-card">
                  <div className="step-card-header">
                    <BiCreditCard size={20} className="step-icon" />
                    <h3 className="step-title">الخطوة الثالثة: تفعيل باقة الاشتراك</h3>
                  </div>
                  <p className="help-text">استعرض الباقات المتاحة في النظام واختير ما يناسب حجم أعمالك واحتياجاتك الزراعية. أكمل عملية الدفع الآمنة للباقات المدفوعة، وفي حال تطلبت الباقة موافقة الإدارة، سيتم تفعيل حسابك خلال دقائق معدودة.</p>
                </div>

                <div className="step-card">
                  <div className="step-card-header">
                    <BiClipboard size={20} className="step-icon" />
                    <h3 className="step-title">الخطوة الرابعة: تسجيل الأنشطة اليومية</h3>
                  </div>
                  <p className="help-text">من خلال تبويب <strong>الخدمات</strong>، يمكنك تتبع ومراقبة حقلك لحظة بلحظة:</p>
                  <div className="activities-grid">
                    <div className="grid-item">رصد درجات الحرارة والرطوبة</div>
                    <div className="grid-item">حساب الكميات المثلى للري والتسميد</div>
                    <div className="grid-item">إدارة مخزون الأسمدة والمبيدات</div>
                    <div className="grid-item">تدوين الملاحظات الحقلية اليومية</div>
                  </div>
                </div>

                <div className="step-card">
                  <div className="step-card-header">
                    <BiCheckCircle size={20} className="step-icon" />
                    <h3 className="step-title">الخطوة الخامسة: تشخيص الأمراض بالمختبر الذكي</h3>
                  </div>
                  <p className="help-text">إذا لاحظت أي أعراض غريبة أو بقع على أوراق نباتاتك، توجه فوراً إلى صفحة <strong>المختبر الذكي</strong>، وقم برفع صورة واضحة ومباشرة للجزء المصاب. سيقوم النظام بتحليل الصورة وإعطائك نوع الآفة ونسبة الإصابة مع التوصية العلاجية المناسبة.</p>
                </div>

                <div className="step-card">
                  <div className="step-card-header">
                    <BiClipboard size={20} className="step-icon" />
                    <h3 className="step-title">الخطوة السادسة: تحليل التقارير الدورية</h3>
                  </div>
                  <p className="help-text-final">تابع مؤشرات نمو وتكاليف مزرعتك عبر الرسوم البيانية والتقارير المتقدمة الهامة.</p>
                </div>

              </div>
            </div>
          )}

          {/* ================= 2. دليل المستخدم ================= */}
          {activeTab === 'user-guide' && (
            <div className="animate-fade-in">
              <h2 className="help-title">دليل المستخدم الشامل</h2>
              <p className="help-text-spacing">
                نظام <strong>AgriSmart</strong> هو شريكك الرقمي في الحقل، تم تطويره خصيصاً ليمنحك تحكماً كاملاً وإشرافاً دقيقاً على كافة العمليات الزراعية:
              </p>
              
              <div className="user-guide-grid">
                <div className="guide-card">
                  <h4>إدارة الحقول والمحاصيل</h4>
                  <p>تحديث وتعديل بيانات المزرعة والمحاصيل وإضافة أنواع جديدة في أي وقت وبمرونة تامة.</p>
                </div>
                <div className="guide-card">
                  <h4>أتمتة عمليات الري والتسميد</h4>
                  <p>تسجيل وتوثيق كميات المورد المائي والسمادي بشكل دوري لبناء خوارزميات ري مخصصة لتربتك.</p>
                </div>
                <div className="guide-card">
                  <h4>المستودع الرقمي الذكي</h4>
                  <p>متابعة دقيقة لحجم مخزونك من البذور، الأسمدة، والمبيدات مع نظام تنبيه مبكر قبل نفاد الكمية.</p>
                </div>
                <div className="guide-card">
                  <h4>التنبيهات والتوصيات المناخية</h4>
                  <p>استقبل إشعارات عاجلة وتوصيات زراعية ذكية تتناسب مع التغيرات المفاجئة في الطقس لحماية المحصول.</p>
                </div>
              </div>

              <div className="summary-box">
                <h4>ملخص دورة العمل الناجحة داخل النظام:</h4>
                <p>
                  قم بتسجيل الدخول ⬅️ حدّث بيانات المزرعة والمحصول ⬅️ سجّل الأنشطة اليومية بانتظام ⬅️ راجع التوصيات والتقارير الذكية بشكل دوري لاتخاذ القرارات الأنسب لمزرعتك.
                </p>
              </div>
            </div>
          )}

          {/* ================= 3. الدعم الفني ================= */}
          {activeTab === 'tech-support' && (
            <div className="animate-fade-in">
              <h2 className="help-title">دليل الدعم الفني والمساعدة</h2>
              <p className="help-text-spacing">
                فريق الدعم الفني لـ <strong>AgriSmart</strong> متواجد دائماً لضمان عمل النظام لديك بأعلى كفاءة وحل أي عوائق تقنية قد تواجهك أثناء الإستخدام.
              </p>
              
              <div className="support-grid">
                <div className="support-alert">
                  <h4>متى يجب عليك مراسلتنا؟</h4>
                  <ul className="support-list alert-theme">
                    <li><BiErrorCircle size={16} /> مواجهة مشكلة أو تعذر تسجيل الدخول إلى الحساب.</li>
                    <li><BiErrorCircle size={16} /> ظهور أخطاء أثناء عمليات الدفع وتفعيل الباقات.</li>
                    <li><BiErrorCircle size={16} /> حدوث خطأ أو بطء أثناء حفظ البيانات والتقارير الحقلية.</li>
                    <li><BiErrorCircle size={16} /> عدم ظهور التوصيات الذكية أو تحليلات المختبر.</li>
                  </ul>
                </div>

                <div className="support-info">
                  <h4>خطوات ننصح بها قبل إرسال الطلب:</h4>
                  <ul className="support-list info-theme">
                    <li><BiHelpCircle size={16} /> 1. تأكد من استقرار وجودة اتصال جهازك بالإنترنت.</li>
                    <li><BiHelpCircle size={16} /> 2. تأكد من تحديث متصفح الويب (Chrome, Safari) لآخر إصدار.</li>
                    <li><BiHelpCircle size={16} /> 3. جرب تحديث الصفحة أو تسجيل الخروج وإعادة الدخول مجدداً.</li>
                  </ul>
                </div>
              </div>

              <div className="support-footer">
                <h4>كيف ترسل بلاغاً يتم الرد عليه فوراً؟</h4>
                <p>عند فتح تذكرة دعم فني، يرجى تزويد فريقنا بالمعلومات التالية لتسريع حل المشكلة:</p>
                <div className="tech-badge-container">
                  <span className="tech-badge"><BiUser size={14} /> اسم المستخدم</span>
                  <span className="tech-badge"><BiFileBlank size={14} /> وصف دقيق ومفصل للمشكلة</span>
                  <span className="tech-badge"><BiTimeFive size={14} /> وقت حدوث الخطأ</span>
                  <span className="tech-badge"><BiHelpCircle size={14} /> تحديد نوع الاستفسار</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default HelpCenter;