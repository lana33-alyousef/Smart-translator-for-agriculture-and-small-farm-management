 import React from 'react';
 import './Section.css'
 

 

 

const Section = ({parpepole,pepole}) => {
  return (

    
    <section className="hero-container">
      <div className="green-bg" />

      {/* المحتوى الذي يظهر فوق الخلفية */}
      <div className="content-wrapper">
        <div className="advice-card">
          <h3> {parpepole}</h3>
          <img src={pepole} alt="pepole" />
        </div>
      </div>
    </section>
  )
}

export default Section
