 

import React, { useState } from 'react'
import './Form3.css'

const Form3 = ({ 
  customClass = "",  
  headform, 
  send, 
  cancel, 
  showCancel = true, 
  showTextArea = true, 
  showHead = true,
  showNameField = true,
  textPlaceholder = "تفضل نحن في انتظارك"
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (email.trim() === "" || (showTextArea && message.trim() === "") || (showNameField && name.trim() === "")) {
        alert("الرجاء إدخال كافة البيانات");
        return;
    }
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        setShowSuccess(true);
        setName(''); setEmail(''); setMessage('');
        setTimeout(() => setShowSuccess(false), 3000);
    }, 2000);
  };

  return (
     
    <div className={`contact-footer ${customClass}`}>
      <div className="form-relative-container">
        {isLoading && <div className="form-overlay"><div className="mid-spinner"></div><p>جاري الإرسال...</p></div>}
        {showSuccess && <div className="form-overlay success-bg"><div className="check-mark">✓</div><p>تم الإرسال!</p></div>}

        {showHead && <h3 className="form-title">{headform}</h3>}
        
        <form className="about-form" onSubmit={handleSend}>
          {showNameField && (
            <input 
              type="text" 
              placeholder="ادخل اسمك" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

  {showTextArea && (
            <textarea  
              placeholder={textPlaceholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
          )}
          <input className='jj'
            type="email" 
            placeholder="ادخل بريدك الإلكتروني" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
           

           
          
          <div className="form-buttons">
            <button type="submit" className="send-btn">{send}</button>
            {showCancel && (
              <button type="button" className="cancel-btn" onClick={() => {setName(''); setEmail(''); setMessage('');}}>
                {cancel}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default Form3;