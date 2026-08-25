import React from 'react'

const FarmEditorStage = ({ title, label, percentage = 24 }) => {
  return (
    <section className='farm-editor-stage'>
      <h3>{title}</h3>
      <div className='farm-editor-stage__ring' style={{ '--progress': `${percentage}%` }}>
        <span>{label}</span>
      </div>
    </section>
  )
}

export default FarmEditorStage
