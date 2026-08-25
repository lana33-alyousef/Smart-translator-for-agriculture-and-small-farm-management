import React from 'react'
import './Partips.css'

const Partips = ({children,reverse}) => {
  return (
    <div>

      <div className={`container ${reverse ? "reverse":""}`}>{children}</div>
    </div>
  )
}

export default Partips
