import './AlertsList.css'
import { MdEmail, MdWarningAmber } from 'react-icons/md'
import { IoMdCloud, IoMdSettings } from 'react-icons/io'
import { IoIosWarning } from "react-icons/io";

const AlertsList = ({ title  , alerts = [] }) => {
  return (
    <section className='alerts-shell' aria-labelledby='alerts-title'>
      <h2 id='alerts-title' className='alerts-heading'>
        {title}
      </h2>

      <div className='alerts-container'>
        {alerts.map((alert, idx) => (
          <article key={idx} className={`alert-card alert-${alert.type}`} role='alert'>
            <div className='alert-main-icon' aria-hidden='true'>
              {alert.type === 'error' && <IoIosWarning /> }
            </div>

            <div className='alert-content'>
              <h4 className='alert-title'>{alert.title}</h4>
              <p className='alert-message'>{alert.message}</p>
            </div>

            <div className='alert-icon-wrapper' aria-hidden='true'>
              {alert.type === 'error' && <MdEmail />}
              {alert.type === 'warning' && <IoMdCloud />}
              {alert.type === 'success' && <IoMdSettings />}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default AlertsList

 
