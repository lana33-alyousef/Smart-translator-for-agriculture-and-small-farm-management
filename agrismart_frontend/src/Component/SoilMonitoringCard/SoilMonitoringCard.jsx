import { FaLeaf, FaTemperatureThreeQuarters ,FaFaceGrinWide} from 'react-icons/fa6'
 
import { PiLeafDuotone } from 'react-icons/pi'
 
import './SoilMonitoringCard.css'

const resolveIconPath = (iconPath) => {
  const pathValue = String(iconPath || '').trim()

  if (!pathValue) {
    return ''
  }

  if (/^(https?:|data:|\/)/.test(pathValue)) {
    return pathValue
  }

  return new URL(pathValue, import.meta.url).href
}

const normalizePercent = (value) => {
  const parsed = Number.parseFloat(String(value).replace('%', '').trim())
  if (Number.isNaN(parsed)) return 0
  return parsed
}

const computePercentFromUnit = (value, unit = '') => {
  const v = normalizePercent(value)
  const u = String(unit || '').toLowerCase()

  // Different scaling based on unit
  if (u.includes('%')) {
    // Already a percentage (0-100)
    return Math.max(0, Math.min(100, v))
  }
  if (u.includes('c')) {
    // Temperature: 0C = 0%, 50C = 100%
    return Math.max(0, Math.min(100, (v / 50) * 100))
  }
  if (u.includes('ds') || u.includes('dsm')) {
    // Salinity: 0 = 0%, 3 ds/m = 100%
    return Math.max(0, Math.min(100, (v / 3) * 100))
  }
  return Math.max(0, Math.min(100, v))
}

const getGaugeStyle = (color, value, unit) => {
  const percent = computePercentFromUnit(value, unit)
  // For 180-degree gauge: 0% = 0deg, 100% = 180deg
  const gaugeAngle = percent * 1.8
  const dialWidth = 280
  const indicatorRadius = 130

  const hexToRgba = (hex, alpha = 1) => {
    if (!hex) return `rgba(0,0,0,${alpha})`
    const h = hex.replace('#', '')
    const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return {
    '--gauge-fill': color,
    '--gauge-fill-light': hexToRgba(color, 0.28),
    '--gauge-fill-lighter': hexToRgba(color, 0.12),
    '--gauge-angle': `${gaugeAngle}deg`,
    '--dial-width': `${dialWidth}px`,
    '--indicator-radius': `${indicatorRadius}px`
  }
}

const Gauge = ({ label, value, unit, color, imgicon }) => {
  const percent = computePercentFromUnit(value, unit)
  const progressDash = `${percent} ${100 - percent}`
  const arcCx = 140
  const arcCy = 130
  const arcRadius = 130
  const theta = Math.PI * (1 - percent / 100)
  const endX = arcCx + arcRadius * Math.cos(theta)
  const endY = arcCy - arcRadius * Math.sin(theta)
  const needleAngle = Math.atan2(endY - 128, endX - 140) * 180 / Math.PI

  return (
    <div className='soil-monitoring__gauge' style={getGaugeStyle(color, value, unit)}>
      <div className='soil-monitoring__gaugeHead'>
        <div className='soil-monitoring__gaugeTop'>
     
          <div className='soil-monitoring__gaugeValue'>
           
          {unit ? <span className='soil-monitoring__gaugeUnit'>{unit}</span> : null}
          <strong>{value}</strong>
        </div>
              {imgicon ? (
            <img src={resolveIconPath(imgicon)} alt='' className='soil-monitoring__gaugeIcon' />
          ) : (
            <PiLeafDuotone style={{ fontSize: '28px', color }} />
          )}
        </div>
         
         
      </div>

      <div className='soil-monitoring__dial' aria-hidden='true'>
        <svg className='soil-monitoring__gaugeSvg' viewBox='-12 -12 304 204' preserveAspectRatio='xMidYMid meet'>
          <path className='soil-monitoring__arcBase' d='M 10 130 A 130 130 0 0 1 270 130' />
          <path
            className='soil-monitoring__arcProgress'
            d='M 10 130 A 130 130 0 0 1 270 130'
            pathLength='100'
            style={{ strokeDasharray: progressDash }}
          />
          <path
            className='soil-monitoring__ticksPath'
            d='M 30 130 A 110 110 0 0 1 250 130'
            pathLength='100'
          />
          <g style={{ transform: `rotate(${needleAngle}deg)`, transformOrigin: '140px 128px' }}>
            <path
              className='soil-monitoring__needleLine'
              d='M 140 127 L 220 127 L 220 129 L 140 129 Z'
            />
          </g>
          <circle className='soil-monitoring__needleBase' cx='140' cy='128' r='7' />
          <circle className='soil-monitoring__arcEnd' cx={endX} cy={endY} r='12' />
        </svg>
      </div>
    </div>
  )
}

const SoilMonitoringCard = ({
  statusLabel = 'الحالة العامة للمزرعة',
  statusValue = 'مثالية',
  introText = 'إدخال معلومات عملية رصد الأرض',
  fields = [],
  gauges = [],
  notes = [],
  onFieldChange,
  imgicontemp
  

}) => {
  const fieldItems = Array.isArray(fields) ? fields.slice(0, 3) : []
  const gaugeItems = Array.isArray(gauges) ? gauges.slice(0, 3) : []
  const noteItems = Array.isArray(notes) ? notes.slice(0, 3) : []

  const statusIcon = statusValue === 'مثالية' ? <FaFaceGrinWide /> : <FaTemperatureThreeQuarters />

  return (
    <section className='soil-monitoring' dir='rtl'>
      <div className='soil-monitoring__frame'>
        <header className='soil-monitoring__header'>
          <div className='soil-monitoring__statusRow'>
            
            <h1 className='soil-monitoring__title'>
              {statusLabel}: <span>{statusValue}</span>
            </h1>
              <span className='soil-monitoring__statusIcon'>{statusIcon}</span>
          </div>
          <p className='soil-monitoring__intro'>{introText}</p>
          
        </header>

        <div className='soil-monitoring__fields'>
          {fieldItems.map((field, index) => (
            <label className='soil-monitoring__field' key={`${field.label}-${index}`}>
              <span>{field.label}</span>
              <input
                type='text'
                value={field.value}
                aria-label={field.label}
                onChange={(event) => {
                  if (onFieldChange) {
                    onFieldChange(index, event.target.value)
                  }
                }}
              />
            </label>
          ))}
        </div>

        <div className='soil-monitoring__gauges'>
          {gaugeItems.map((gauge, index) => (
            <Gauge
              key={`${gauge.label}-${index}`}
              label={gauge.label}
              value={gauge.value}
              unit={gauge.unit}
              color={gauge.color}
              imgicon={gauge.imgicon}
            />
          ))}
        </div>

        <div className='soil-monitoring__notes'>
          {noteItems.map((note, index) => (
            <div className='soil-monitoring__note' key={`${note.text}-${index}`}>
              <span className='soil-monitoring__noteIcon' style={{ color: note.color }}>
                {note.imgicontemp ? (
                  <img src={resolveIconPath(note.imgicontemp)} alt='' />
                ) : (
                  <PiLeafDuotone />
                )}
              </span>
              <p>{note.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SoilMonitoringCard