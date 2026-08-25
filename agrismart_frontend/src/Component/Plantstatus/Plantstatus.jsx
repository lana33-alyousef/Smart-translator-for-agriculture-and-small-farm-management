import React from 'react'

const Plantstatus = ({percentage,stage}
) => {
   const circleStyle = {
    background: `conic-gradient(#8bc34a ${percentage}%, #e0e0e0 0)`
  };

  return (
    <div className="status-section">
      <h3>مراحل نمو النبات</h3>
      <div className="progress-circle" style={circleStyle}>
        <div className="inner-circle">
          {stage}
        </div>
      </div>
    </div>
    );
}

export default Plantstatus
