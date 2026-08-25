import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Component/Navbar/Navbar";
import "./DiseaseAlerts.css";
import { api } from "../../api/client";

export default function DiseaseAlerts() {
  const navigate = useNavigate();
  // حالات المختبر الذكي
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showPesticide, setShowPesticide] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      setShowPesticide(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    // الاعتماد على فحص الحد في السيرفر؛ إذا تم تجاوز الحد سيعود 403 ونوجه المستخدم للاشتراك

    setIsAnalyzing(true);
    
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      // 1. إرسال الصورة للتحليل
      const analyzeRes = await api.post("/api/analyze/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const result = analyzeRes.data;

      if (result.status === "success") {
        setAnalysisResult(result);

        // 2. إرسال بيانات النتيجة للباك إيند لحفظها
        // (تأكد من إنشاء هذا المسار في ملفات Django/الباك إيند لديك)
        try {
          await api.post("/api/save-analysis/", {
            plant_name: result.plant_name || result.plant,
            is_healthy: result.is_healthy,
            disease_name: result.disease_name,
            confidence: result.confidence,
            pesticide_info: result.pesticide_info || result.pesticide,
          });
        } catch (saveError) {
          console.error("تم التحليل بنجاح، لكن حدث خطأ أثناء حفظ البيانات في الخادم:", saveError);
        }

      } else {
        alert("حدث خطأ أثناء التحليل: " + result.message);
      }
    } catch (error) {
      if (error?.response?.status === 402) {
        alert(error?.response?.data?.message || 'يُطلب اشتراك لتنفيذ هذه العملية.');
        navigate('/subscriptions');
        return;
      }
      const message = error?.response?.data?.detail || "تعذر الاتصال بالسيرفر. تأكد من تشغيل الباك إيند.";
      alert(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="merged-disease-page">
      <img src="/img/bg5.jpeg" className="page-background-image1" alt="" />
      <Navbar />
      <div className="page-header-title">
          <h1 className="title-Green">المختبر الذكي</h1>
        </div>
      <main className="disease-main-container" dir="rtl">

        {/* الحاوية المركزية الجديدة للمختبر */}
        <div className="disease-centered-layout">
          <section className="smart-lab-section">
            <div className="modern-glass-card lab-card">
              
              <div className="lab-workspace-grid">
                {/* منطقة الرفع */}
                <div 
                  className={`modern-upload-area ${previewUrl ? 'has-file' : ''}`}
                  onClick={() => fileInputRef.current.click()}
                >
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} hidden />
                  {previewUrl ? (
                    <div className="image-preview-wrapper">
                      <img src={previewUrl} alt="معاينة" className="uploaded-image-preview" />
                      <div className="hover-change-overlay"><span>تغيير الصورة</span></div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <div className="upload-icon-svg">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      </div>
                      <span className="upload-main-text">اسحب وأفلت الصورة هنا أو <strong>اضغط للاستعراض</strong></span>
                      <span className="upload-sub-text">يدعم صيغ JPG, PNG</span>
                    </div>
                  )}
                </div>

                {/* منطقة التحكم والنتائج */}
                <div className="lab-results-area">

                  {analysisResult && (
                    <div className="analysis-result-box fade-in-up">
                      <h4 className="result-box-title">نتيجة الفحص الدقيق</h4>
                      
                      <div className="result-details-list">
                        <div className="detail-row-item">
                          <span className="detail-label">نوع النبتة:</span>
                          <span className="detail-value">{analysisResult.plant_name || analysisResult.plant || 'غير محدد'}</span>
                        </div>
                        <div className="detail-row-item">
                          <span className="detail-label">الحالة الصحية:</span>
                          <span className={`status-badge ${analysisResult.is_healthy ? 'safe-badge' : 'danger-badge'}`}>
                            {analysisResult.is_healthy ? 'سليمة ومعافاة ✅' : analysisResult.disease_name}
                          </span>
                        </div>
                        <div className="detail-row-item">
                          <span className="detail-label">نسبة الدقة:</span>
                          <span className="accuracy-badge">{analysisResult.confidence}%</span>
                        </div>
                      </div>

                      {!analysisResult.is_healthy && (
                        <div className="treatment-recommendation">
                          {!showPesticide ? (
                            <button className="outline-green-btn" onClick={() => setShowPesticide(true)}>
                              عرض خطة العلاج والمبيد المقترح
                            </button>
                          ) : (
                            <div className="pesticide-info-box fade-in-up">
                              <h5 className="pesticide-title">المبيد وخطة العلاج:</h5>
                              <p className="pesticide-desc">{analysisResult.pesticide_info || analysisResult.pesticide || "لا تتوفر معلومات حول المبيد حالياً."}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                </div>
                <button 
                    className={`submit-btn-glow ${isAnalyzing ? 'is-loading' : ''}`}
                    onClick={handleAnalyze}
                    disabled={!selectedFile || isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="loading-spinner"></span>
                        جاري التحليل...
                      </>
                    ) : "بدء التحليل الآن"}
                  </button> 
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}