 import { useState } from 'react'
import './NotificationSettingsCard.css'

 

const NotificationSettingsCard = ({titlenote,imgnotesettin}) => {
  const [tipsEnabled, setTipsEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const Toggle = ({ checked, onChange, label }) => {
  return (
    <label className='notify-toggle' aria-label={label}>
      <input type='checkbox' checked={checked} onChange={onChange} />
      <span className='notify-toggle-track'>
        <span className='notify-toggle-thumb' />
      </span>
    </label>
  )
}

  return (
    <section className='notify-settings-card' dir='rtl'>
      
       

      <div className='notify-content'>
        <div  className='notifyimg'>

           <img src={imgnotesettin} alt=''/>
           </div>

        <div className='notify-list'>
          <h2 className='notify-title'>{titlenote}</h2>
          <div className='notify-row'>
            <Toggle
              checked={tipsEnabled}
              onChange={() => setTipsEnabled((prev) => !prev)}
              label='تفعيل تنبيهات النصائح'
            />
            <p>لتعمل تنبيهاتك لأغراض تنبيهاتك للنصائح</p>
          </div>

          <div className='notify-row'>
            <Toggle
              checked={emailEnabled}
              onChange={() => setEmailEnabled((prev) => !prev)}
              label='تفعيل إرسال السبب عبر البريد الإلكتروني'
            />
            <p>لتفعيل إرسال السبب عبر البريد الإلكتروني</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default NotificationSettingsCard
