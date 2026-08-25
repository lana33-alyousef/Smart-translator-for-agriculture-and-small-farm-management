import React from 'react'
import { FiCamera } from 'react-icons/fi'

const FarmEditorUpload = () => {
  return (
    <section className='farm-editor-upload'>
      <p> أدخل صورة للمزرعة:</p>
      <button type='button' className='farm-editor-upload__box' aria-label='رفع صورة'>
        <FiCamera />
      </button>
    </section>
  )
}

export default FarmEditorUpload
