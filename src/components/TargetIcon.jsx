import React from 'react';
import { Link } from 'react-router-dom';

const C = { deepSpace: "#1C2540", spaceBlue: "#162039", blue: "#1A6AD6", red: "#E82535", yellow: "#F5C518", yellowInner: "#E8A400", cyan: "#17C8F0", silver: "#D0D2D8", darkMetal: "#24263A", shaftGray: "#5A5C72" };

export const TargetIcon = ({ className = "w-8 h-8", uid = Math.random().toString(36).substr(2, 9), disableLink = false }) => {
  // Use a fixed internal viewBox of 100x100 for the SVG math, and let Tailwind control the actual display size.
  const size = 100;
  const cx = size / 2; const cy = size / 2; const R = size / 2 - 1.5;
  const rk = { outer: R, bSep: R * 0.882, blue: R * 0.866, rSep: R * 0.660, red: R * 0.643, ySep: R * 0.450, yOut: R * 0.434, yMid: R * 0.262, yIn: R * 0.246, dot: R * 0.128 };
  const tipLen = R * 0.170; const tipHW = R * 0.034; const barrelLen = R * 0.295; const barrelHW = R * 0.068; const shaftLen = R * 0.210; const shaftHW = R * 0.027; const flightLen = R * 0.250; const flightH = R * 0.240;
  const tE = cx + tipLen; const bE = tE + barrelLen; const sE = bE + shaftLen; const fE = sE + flightLen;
  const gId = `glow-${uid}`; const dsId = `ds-${uid}`; const cpId = `cp-${uid}`; const bgId = `bg-${uid}`;

  const svgContent = (
    <svg viewBox={`0 0 ${size} ${size}`} className={`${className} block overflow-visible`} aria-hidden="true">
      <defs>
        <filter id={gId} x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={size * 0.048} result="bl" />
          <feColorMatrix in="bl" type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.72  0 0 0 0 0.95  0 0 0 0.70 0" result="cb" />
          <feMerge><feMergeNode in="cb" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={dsId} x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx={R * 0.04} dy={R * 0.06} stdDeviation={R * 0.06} floodColor="rgba(0,0,0,0.50)" />
        </filter>
        <clipPath id={cpId}><circle cx={cx} cy={cy} r={rk.outer} /></clipPath>
        <radialGradient id={bgId} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={rk.outer} fill={C.deepSpace} />
      <circle cx={cx} cy={cy} r={rk.bSep} fill="rgba(255,255,255,0.90)" />
      <circle cx={cx} cy={cy} r={rk.blue} fill={C.blue} filter={`url(#${gId})`} clipPath={`url(#${cpId})`} />
      <circle cx={cx} cy={cy} r={rk.rSep} fill="rgba(255,255,255,0.90)" />
      <circle cx={cx} cy={cy} r={rk.red} fill={C.red} />
      <circle cx={cx} cy={cy} r={rk.ySep} fill="rgba(255,255,255,0.90)" />
      <circle cx={cx} cy={cy} r={rk.yOut} fill={C.yellow} />
      <circle cx={cx} cy={cy} r={rk.yMid} fill="rgba(0,0,0,0.22)" />
      <circle cx={cx} cy={cy} r={rk.yIn} fill={C.yellowInner} />
      <circle cx={cx} cy={cy} r={rk.dot} fill="rgba(0,0,0,0.30)" />
      <circle cx={cx} cy={cy} r={rk.outer} fill={`url(#${bgId})`} clipPath={`url(#${cpId})`} />
      <g transform={`rotate(-38, ${cx}, ${cy})`} filter={`url(#${dsId})`}>
        <polygon points={`${cx},${cy} ${tE},${cy - tipHW} ${tE},${cy + tipHW}`} fill={C.silver} />
        <polygon points={`${cx},${cy} ${tE},${cy - tipHW} ${tE},${cy + tipHW}`} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={Math.max(0.4, R * 0.012)} />
        <rect x={tE} y={cy - barrelHW} width={barrelLen} height={barrelHW * 2} rx={barrelHW * 0.38} fill={C.darkMetal} />
        <rect x={tE + barrelLen * 0.04} y={cy - barrelHW * 0.86} width={barrelLen * 0.92} height={barrelHW * 0.36} rx={barrelHW * 0.3} fill="rgba(255,255,255,0.14)" />
        <rect x={tE + barrelLen * 0.04} y={cy + barrelHW * 0.62} width={barrelLen * 0.92} height={barrelHW * 0.24} rx={barrelHW * 0.2} fill="rgba(0,0,0,0.20)" />
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x={tE + barrelLen * 0.11 + (barrelLen * 0.70 / 8) * i} y={cy - barrelHW} width={barrelLen * 0.018} height={barrelHW * 2} rx={1} fill="rgba(255,255,255,0.08)" />
        ))}
        <rect x={bE} y={cy - shaftHW} width={shaftLen} height={shaftHW * 2} rx={shaftHW * 0.6} fill={C.shaftGray} />
        <polygon points={`${sE},${cy} ${sE},${cy - flightH} ${fE},${cy - flightH * 0.14} ${fE},${cy}`} fill={C.red} />
        <polygon points={`${sE + flightLen * 0.10},${cy - flightH * 0.54} ${sE + flightLen * 0.10},${cy - flightH * 0.76} ${fE - flightLen * 0.08},${cy - flightH * 0.24} ${fE - flightLen * 0.08},${cy - flightH * 0.10}`} fill="rgba(255,255,255,0.22)" />
        <polygon points={`${sE},${cy} ${sE},${cy + flightH * 0.40} ${fE},${cy + flightH * 0.06} ${fE},${cy}`} fill="rgba(255,255,255,0.86)" />
      </g>
    </svg>
    );

  return disableLink ? svgContent : (
    <Link to="/" className="cursor-pointer no-underline text-inherit inline-block">
      {svgContent}
    </Link>
  );
};

export default TargetIcon;
