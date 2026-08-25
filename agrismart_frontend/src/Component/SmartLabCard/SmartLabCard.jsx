import React from 'react'
import { FiCamera } from 'react-icons/fi'
import './SmartLabCard.css'

const SmartLabCard = ({
  title = 'المختبر الذكي',
  previewImage,
  diseaseName = '-',
  confidence = '-',
  actionLabel = 'المبيد المناسب',
   
  onUploadClick,
  onActionClick,
  className = ''
}) => {
  return (
    <article className={`smart-lab-card ${className}`.trim()} dir='rtl'>
         <section className='smart-lab-card__content'>
        <h3>{title}</h3>

        <div className='smart-lab-card__preview'>
          {previewImage ? (
            <img src={previewImage} alt='plant preview' />
          ) : (
            <div className='smart-lab-card__preview-placeholder'>
              لا توجد صورة
            </div>
          )}
        </div>

        <p className='smart-lab-card__line'>
          <strong>اسم المرض:</strong>
          <span>{diseaseName}</span>
        </p>

        <p className='smart-lab-card__line'>
          <strong>نسبة دقة التشخيص:</strong>
          <span>{confidence}</span>
        </p>

        <button
          type='button'
          className='smart-lab-card__action-btn'
          onClick={onActionClick}
        >
          {actionLabel}
        </button>
      </section>
      <section className='smart-lab-card__upload-area'>
        <button
          type='button'
          className='smart-lab-card__upload-btn'
          onClick={onUploadClick}
          aria-label='رفع صورة النبات'
        >
          <FiCamera />
           
        </button>
      </section>

      
    </article>
  )
}

export default SmartLabCard
