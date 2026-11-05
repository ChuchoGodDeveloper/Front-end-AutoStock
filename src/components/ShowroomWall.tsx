import type { TipoSiluetaVehiculo } from '../hooks/useShowroomEffects'

interface VehicleSilhouetteProps {
  tipo?: TipoSiluetaVehiculo
  colorAcento?: string
  className?: string
}

export function VehicleSilhouette({
  tipo = 'sedan',
  colorAcento = '#4DA6FF',
  className = 'w-full h-24',
}: VehicleSilhouetteProps) {
  let bodyPath = ''
  let glassPath = ''

  if (tipo === 'suv') {
    bodyPath =
      'M24 58 C27 47, 36 42, 52 40 L74 23 C80 19, 90 17, 112 17 L168 18 C184 18, 194 23, 201 35 L212 42 C219 44, 222 50, 221 58 Z'
    glassPath = 'M78 24 L112 20 L166 21 C179 21, 187 25, 193 35 L71 36 Z'
  } else if (tipo === 'pickup') {
    bodyPath =
      'M22 58 C24 47, 34 42, 52 40 L74 23 C80 19, 90 18, 114 18 L138 18 L142 37 L214 37 C220 38, 222 45, 221 58 Z'
    glassPath = 'M78 24 L112 21 L133 21 L135 35 L72 36 Z'
  } else if (tipo === 'coupe') {
    bodyPath =
      'M20 58 C24 47, 39 42, 60 39 L92 23 C102 19, 118 18, 144 20 L185 33 C205 36, 219 43, 221 58 Z'
    glassPath = 'M94 25 C104 21, 118 20, 142 22 L176 34 L74 36 Z'
  } else {
    bodyPath =
      'M22 58 C25 47, 38 42, 56 39 L84 23 C93 19, 108 18, 140 19 L178 33 C198 35, 216 42, 220 58 Z'
    glassPath = 'M87 25 C95 21, 108 20, 138 21 L170 33 L70 36 Z'
  }

  return (
    <svg
      className={`car-StageSvg ${className}`}
      viewBox="0 0 242 76"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="121" cy="65" rx="95" ry="5" fill="rgba(0,0,0,0.42)" />
      <path
        d={bodyPath}
        fill="rgba(255,255,255,0.08)"
        stroke={colorAcento}
        strokeWidth="1.6"
      />
      <path d={glassPath} fill="rgba(6,8,15,0.58)" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
      <path d="M24 48 L36 46" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M212 45 L220 46" stroke="#FF3B5C" strokeWidth="2.4" strokeLinecap="round" />
      <circle
        cx="64"
        cy="58"
        r="12.5"
        fill="#0A0D14"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="2"
      />
      <circle cx="64" cy="58" r="5.5" fill={colorAcento} fillOpacity="0.45" />
      <circle
        cx="180"
        cy="58"
        r="12.5"
        fill="#0A0D14"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="2"
      />
      <circle cx="180" cy="58" r="5.5" fill={colorAcento} fillOpacity="0.45" />
    </svg>
  )
}

export function ShowroomWall() {
  return (
    <div className="showroom-wall" aria-hidden="true">
      <div className="showroom-lamp" />
      <div className="carbon-weave" />

      <div className="showroom-car-wrap">
        <svg
          className="showroom-car-svg"
          viewBox="0 0 1200 440"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gtBodyPaint" x1="150" y1="90" x2="1050" y2="320" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2A344B" stopOpacity="0.72" />
              <stop offset="35%" stopColor="#171E2E" stopOpacity="0.88" />
              <stop offset="70%" stopColor="#0D121D" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#232B3E" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="gtRoofChrome" x1="280" y1="95" x2="870" y2="210" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.05" />
              <stop offset="38%" stopColor="#93C5FD" stopOpacity="0.65" />
              <stop offset="72%" stopColor="#F5D08A" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="gtBeltline" x1="140" y1="210" x2="1040" y2="215" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4DA6FF" stopOpacity="0" />
              <stop offset="25%" stopColor="#4DA6FF" stopOpacity="0.65" />
              <stop offset="70%" stopColor="#E5C158" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#FF5E62" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="headlightCone" x1="210" y1="235" x2="5" y2="265" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.65" />
              <stop offset="45%" stopColor="#38BDF8" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="taillightGlow" x1="990" y1="205" x2="1170" y2="225" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF2E54" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#FF2E54" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#FF2E54" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#000000" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <filter id="neonBloom" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Líneas aerodinámicas de túnel de viento */}
          <path
            className="aero-line"
            d="M60 185 C240 175, 380 82, 595 82 C780 82, 910 142, 1140 158"
            stroke="url(#gtRoofChrome)"
            strokeWidth="1.4"
            opacity="0.5"
          />
          <path
            className="aero-line aero-line--2"
            d="M30 225 C190 218, 340 120, 585 112 C800 106, 945 170, 1165 186"
            stroke="url(#gtBeltline)"
            strokeWidth="1"
            opacity="0.38"
          />

          {/* Sombra y reflejo en el piso */}
          <ellipse cx="605" cy="336" rx="455" ry="26" fill="url(#floorShadow)" />
          <ellipse cx="605" cy="352" rx="380" ry="9" fill="url(#gtBeltline)" opacity="0.2" />

          {/* Conos de luz de faros delanteros y calaveras traseras */}
          <g className="car-headlight-beam">
            <polygon points="188,225 8,185 8,305 202,258" fill="url(#headlightCone)" />
            <polygon points="1012,196 1185,165 1185,250 1005,222" fill="url(#taillightGlow)" />
          </g>

          {/* Silueta principal del Gran Turismo Coupé */}
          <path
            d="M168 274
               C170 242, 195 216, 248 202
               L375 176
               C435 135, 505 102, 608 100
               C722 98, 815 130, 895 172
               L995 186
               C1025 192, 1042 214, 1040 246
               L1032 282
               C1025 294, 1005 300, 968 300
               L908 300
               C904 242, 855 202, 796 202
               C737 202, 690 242, 686 300
               L486 300
               C482 242, 435 202, 376 202
               C317 202, 268 242, 264 300
               L202 298
               C178 296, 167 288, 168 274 Z"
            fill="url(#gtBodyPaint)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.5"
          />

          {/* Arco cromado de cabina */}
          <path
            d="M382 175 C442 136, 510 105, 608 103 C718 101, 808 132, 885 172"
            stroke="url(#gtRoofChrome)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Cristales de cabina polarizados */}
          <path
            d="M402 174
               C455 140, 518 115, 606 114
               C702 113, 782 138, 852 173
               L795 178
               L420 179 Z"
            fill="rgba(8, 13, 24, 0.78)"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.2"
          />
          <line x1="615" y1="114" x2="592" y2="178" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />

          {/* Línea de cintura y faldón de fibra de carbono */}
          <path
            d="M185 232 C310 212, 460 206, 650 205 C810 204, 935 198, 1028 206"
            stroke="url(#gtBeltline)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M492 286 L680 286 L695 262 L515 266 Z"
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />

          {/* Faro delantero LED DRL */}
          <path
            d="M184 236 L236 222 L252 232 L196 245 Z"
            fill="#E0F2FE"
            filter="url(#neonBloom)"
          />
          <path
            d="M180 248 L228 239"
            stroke="#38BDF8"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#neonBloom)"
          />

          {/* Calavera trasera LED continua */}
          <path
            d="M988 196 L1035 202 L1032 215 L982 208 Z"
            fill="#FF2E54"
            filter="url(#neonBloom)"
          />

          {/* Rueda Delantera con caliper dorado */}
          <g transform="translate(376, 286)">
            <circle r="54" fill="#07090E" stroke="rgba(255,255,255,0.22)" strokeWidth="3" />
            <circle
              r="42"
              fill="#0E131F"
              stroke="rgba(147,197,253,0.45)"
              strokeWidth="2"
              strokeDasharray="8 6"
            />
            <circle r="31" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="6" />
            <path d="M18 -24 A30 30 0 0 1 28 8" stroke="#E5C158" strokeWidth="7" strokeLinecap="round" />
            <g stroke="rgba(255,255,255,0.55)" strokeWidth="2.2">
              <line x1="0" y1="-40" x2="0" y2="40" />
              <line x1="-40" y1="0" x2="40" y2="0" />
              <line x1="-28" y1="-28" x2="28" y2="28" />
              <line x1="28" y1="-28" x2="-28" y2="28" />
            </g>
            <circle r="10" fill="#1E293B" stroke="#E5C158" strokeWidth="2" />
          </g>

          {/* Rueda Trasera con caliper dorado */}
          <g transform="translate(796, 286)">
            <circle r="56" fill="#07090E" stroke="rgba(255,255,255,0.22)" strokeWidth="3" />
            <circle
              r="44"
              fill="#0E131F"
              stroke="rgba(147,197,253,0.45)"
              strokeWidth="2"
              strokeDasharray="8 6"
            />
            <circle r="32" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="6" />
            <path d="M-20 -24 A30 30 0 0 0 -29 8" stroke="#E5C158" strokeWidth="7" strokeLinecap="round" />
            <g stroke="rgba(255,255,255,0.55)" strokeWidth="2.2">
              <line x1="0" y1="-42" x2="0" y2="42" />
              <line x1="-42" y1="0" x2="42" y2="0" />
              <line x1="-30" y1="-30" x2="30" y2="30" />
              <line x1="30" y1="-30" x2="-30" y2="30" />
            </g>
            <circle r="10" fill="#1E293B" stroke="#E5C158" strokeWidth="2" />
          </g>
        </svg>
      </div>

      <div className="showroom-floor" />
    </div>
  )
}
