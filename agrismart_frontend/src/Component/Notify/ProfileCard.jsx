 import { useEffect, useRef, useState } from 'react'
import './ProfileCard.css'
import iccamera from '../../img/iccamera.png'

const ProfileCard = ({
  eyebrow,
  imageAlt = 'صورة مرفوعة',
  actionLabel = 'عرض المبيد المناسب',
  onAction,
  onAnalyze,
  onUnhealthyDetected
}) => {
  const fileInputRef = useRef(null)
  const [uploadedImage, setUploadedImage] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showTreatmentAlert, setShowTreatmentAlert] = useState(false)

  useEffect(() => {
    return () => {
      if (uploadedImage) {
        URL.revokeObjectURL(uploadedImage)
      }
    }
  }, [uploadedImage])

  const handleSelectImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage)
    }

    const imagePreview = URL.createObjectURL(file)
    setUploadedImage(imagePreview)
    setIsAnalyzing(true)
    setShowTreatmentAlert(false)
    setAnalysisResult(null)

    try {
      const result = onAnalyze ? await onAnalyze(file) : null
      if (result) {
        setAnalysisResult(result)
        if (!result.is_healthy && onUnhealthyDetected) {
          onUnhealthyDetected(result)
        }
      }
    } finally {
      setIsAnalyzing(false)
      event.target.value = ''
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleShowTreatment = (result) => {
    setShowTreatmentAlert(true)
    onAction?.(result)
  }

  const plantName = analysisResult?.plant_name ?? analysisResult?.plant ?? ''
  const confidence = analysisResult?.confidence ?? analysisResult?.accuracy ?? ''
  const pesticideInfo = analysisResult?.pesticide_info ?? analysisResult?.pesticide ?? ''
  const statusText = analysisResult?.is_healthy ? 'سليمة' : 'غير سليمة'

  return (
    <section className='profile-card'>
      {eyebrow && <h2 className='eyebrow'>{eyebrow}</h2>}

      <div className={`profile-card-layout ${analysisResult ? '' : 'single'}`}>
        <button
          type='button'
          className='upload-box'
          aria-label='رفع صورة المرض'
          onClick={handleUploadClick}
        >
          <img src={iccamera} alt='' />
          <span className='upload-text'>ارفع صورة النبتة للتحليل</span>
          {isAnalyzing && (
            <div className='upload-loading-overlay' aria-live='polite' aria-busy='true'>
              <div className='loading-spinner' />
              <div className='loading-text'>جار تحليل الصورة</div>
            </div>
          )}
        </button>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          className='file-input-hidden'
          onChange={handleSelectImage}
        />

        {analysisResult && (
          <div className='profile-info' dir='rtl'>
            <div className='small-image-wrapper'>
              <img src={uploadedImage} alt={imageAlt} className='small-image rounded-3' />
            </div>

            <div className='meta'>
              {plantName && (
                <p>
                  <strong>نوع النبتة:</strong>
                  <span>{plantName}</span>
                </p>
              )}
              <p>
                <strong>حالة النبتة:</strong>
                <span className={analysisResult.is_healthy ? 'status-ok' : 'status-bad'}>{statusText}</span>
              </p>
              <p>
                <strong>نسبة دقة التشخيص:</strong>
                <span>{confidence}%</span>
              </p>

              {!analysisResult.is_healthy && (
                <>
                  <p>
                    <strong>اسم المرض:</strong>
                    <span>{analysisResult.disease_name}</span>
                  </p>
                  {showTreatmentAlert ? (
                    <div className='pesticide-box'>
                      <strong>💡 العلاج المقترح:</strong>
                      <div className='pesticide-text'>{pesticideInfo}</div>
                    </div>
                  ) : (
                    <div className='action'>
                      <button
                        type='button'
                        className='action-btn'
                        onClick={() => handleShowTreatment(analysisResult)}
                      >
                        {actionLabel}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default ProfileCard
