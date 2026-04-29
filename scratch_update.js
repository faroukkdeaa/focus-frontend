import fs from 'fs';

const filePath = 'src/pages/ProgressAnalytics.jsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Change LineChart to AreaChart
content = content.replace(/LineChart/g, 'AreaChart');
content = content.replace(/<Line\s+/g, '<Area\n                    fillOpacity={1}\n                    fill="url(#colorScore)"\n                    ');
content = content.replace(/<\/Line>/g, '</Area>');

// 2. Remove buildTheme, card, _t
content = content.replace(/\/\* ════════════════════════════════════════════════════[\s\S]*?const iw=\(bg,bd,sz="48px",r="14px"\)=>\(\{\.\.\._t,width:sz,height:sz,borderRadius:r,background:bg,border:`1px solid \$\{bd\}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0\}\);/m, 
`const transition = { transition: "all 0.25s ease" };
const iw = (bg, bd, sz = "48px", r = "14px") => ({ ...transition, width: sz, height: sz, borderRadius: r, background: bg, border: \`1px solid \${bd}\`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 });`);

// 3. Update CustomTooltip
content = content.replace(/const CustomTooltip = \(\{ active, payload, label, T \}\) => \{[\s\S]*?return null;\n\};/, 
`const CustomTooltip = ({ active, payload, label, C, glass }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const plottedPercentage = payload[0].value || 0;
    const maxScore = data.maxScore || 5;
    const safeRawScore = data.score ?? data.rawScore ?? Math.round((plottedPercentage / 100) * maxScore);
    const subjectName = data.subjectName || data.subject_name || data.subjectId || 'المادة الحالية';
    return (
      <div style={{...transition,...glass(),padding:"14px 18px",minWidth:"180px",textAlign:"right",direction:"rtl"}}>
        <p style={{...transition,fontWeight:700,marginBottom:"6px",color:C.textPrimary,fontSize:"0.82rem"}}>التاريخ: {label || data.displayDate}</p>
        <p style={{...transition,margin:0,color:C.textMuted,fontSize:"0.78rem"}}>المادة: {subjectName}</p>
        <p style={{...transition,margin:0,color:C.accent,fontWeight:700,fontSize:"0.82rem",marginTop:"4px"}}>
          الدرجة: {safeRawScore} / {maxScore} ({plottedPercentage}%)
        </p>
      </div>
    );
  }
  return null;
};`);

// 4. Update BarTooltip
content = content.replace(/const BarTooltip = \(\{ active, payload, T \}\) => \{[\s\S]*?<\/div>\n  \);\n\};/, 
`const BarTooltip = ({ active, payload, C, glass }) => {
  if (!active || !payload?.length) return null;
  const { name, accuracy } = payload[0].payload;
  const badge = getMasteryBadge(accuracy, C);
  return (
    <div style={{...transition,...glass(),padding:"12px",minWidth:"160px",textAlign:"right",direction:"rtl"}}>
      <p style={{color:C.textPrimary,fontWeight:700,fontSize:"0.85rem",marginBottom:"4px"}}>{name}</p>
      <p style={{color:badge.color,fontWeight:700,fontSize:"0.8rem"}}>
        {accuracy}% — {badge.dot} {badge.label}
      </p>
    </div>
  );
};`);

// 5. Update TeacherDashboard component definition to useTheme correctly
content = content.replace(/  const \{ theme \} = useTheme\(\);\n  const isDark = theme === 'dark';\n  const T = buildTheme\(isDark\);/,
`  const { isDarkMode, C, glass } = useTheme();`);

// 6. Global replacements
content = content.replaceAll('_t', 'transition');
content = content.replaceAll('card(T)', 'glass()');
content = content.replace(/getMasteryBadge\(([^,]+), T\)/g, 'getMasteryBadge($1, C)');
content = content.replace(/<CustomTooltip T=\{T\} \/>/g, '<CustomTooltip C={C} glass={glass} />');
content = content.replace(/<BarTooltip T=\{T\} \/>/g, '<BarTooltip C={C} glass={glass} />');

// Instead of global T. which might match a lot of things inappropriately (though unlikely if carefully formatted), 
// we'll replace T. with C. only inside {} or following a space/colon/equals.
content = content.replaceAll('T.bg', 'C.bg');
content = content.replaceAll('T.bgPanel', 'C.bgPanel');
content = content.replaceAll('T.bgCard', 'C.bgCard');
content = content.replaceAll('T.border', 'C.border');
content = content.replaceAll('T.borderAccent', 'C.borderAccent');
content = content.replaceAll('T.accent', 'C.accent');
content = content.replaceAll('T.accentDim', 'C.accentDim');
content = content.replaceAll('T.iconA', 'C.iconA');
content = content.replaceAll('T.iconBgA', 'C.iconBgA');
content = content.replaceAll('T.iconBorderA', 'C.iconBorderA');
content = content.replaceAll('T.iconB', 'C.iconB');
content = content.replaceAll('T.iconBgB', 'C.iconBgB');
content = content.replaceAll('T.iconBorderB', 'C.iconBorderB');
content = content.replaceAll('T.textPrimary', 'C.textPrimary');
content = content.replaceAll('T.textMuted', 'C.textMuted');
content = content.replaceAll('T.textDim', 'C.textDim');
content = content.replaceAll('T.shadowCard', 'C.shadowCard');
content = content.replaceAll('T.green', 'C.green');
content = content.replaceAll('T.greenDim', 'C.greenDim');
content = content.replaceAll('T.greenBorder', 'C.greenBorder');
content = content.replaceAll('T.yellow', 'C.yellow');
content = content.replaceAll('T.yellowDim', 'C.yellowDim');
content = content.replaceAll('T.yellowBorder', 'C.yellowBorder');
content = content.replaceAll('T.purple', 'C.purple');
content = content.replaceAll('T.purpleDim', 'C.purpleDim');
content = content.replaceAll('T.purpleBorder', 'C.purpleBorder');
content = content.replaceAll('T.redIcon', 'C.redIcon');
content = content.replaceAll('T.redDim', 'C.redDim');
content = content.replaceAll('T.redBorder', 'C.redBorder');
content = content.replaceAll('T.trackBg', 'C.trackBg');
content = content.replaceAll('T.gridLine', 'C.gridLine');
content = content.replaceAll('T.tickColor', 'C.tickColor');

// 7. Recharts specifics
content = content.replace(/<AreaChart data=\{lineData\} margin=\{\{ top: 5, right: 20, left: 0, bottom: 5 \}\}>/,
\`<AreaChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.accent} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                    </linearGradient>
                  </defs>\`);

content = content.replace(/<CartesianGrid strokeDasharray="3 3" stroke=\{C.gridLine\} \/>/,
\`<CartesianGrid vertical={false} strokeDasharray="3 3" stroke={C.gridLine} />\`);

content = content.replace(/<XAxis dataKey="date" tick=\{\{ fontSize: 10, fill: C.tickColor \}\} \/>/,
\`<XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: C.tickColor }} />\`);

content = content.replace(/<YAxis\s+domain=\{\[30, 100\]\}\s+tick=\{\{ fontSize: 10, fill: C.tickColor \}\}\s+tickFormatter=\{v => \`\$\{v\}%\`\}\s+width=\{38\}\s+\/>/,
\`<YAxis
                    domain={[30, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: C.tickColor }}
                    tickFormatter={v => \`\${v}%\`}
                    width={38}
                  />\`);

content = content.replace(/strokeWidth=\{2\.5\}/, \`strokeWidth={2}\`);
content = content.replace(/activeDot=\{\{ r: 6 \}\}/, \`activeDot={{ r: 6, fill: C.accent, stroke: C.bgPanel, strokeWidth: 2 }}\`);

// BarChart specifics
content = content.replace(/<XAxis\s+type="number"\s+domain=\{\[0, 100\]\}\s+tick=\{\{ fontSize: 10, fill: C.tickColor \}\}\s+tickFormatter=\{v => \`\$\{v\}%\`\}\s+\/>/,
\`<XAxis
                        type="number"
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: C.tickColor }}
                        tickFormatter={v => \`\${v}%\`}
                      />\`);

content = content.replace(/<YAxis\s+type="category"\s+dataKey="name"\s+width=\{155\}\s+tick=\{\{ fontSize: 11, fill: C.textMuted \}\}\s+\/>/,
\`<YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        width={155}
                        tick={{ fontSize: 11, fill: C.textMuted }}
                      />\`);

content = content.replace(/isDark \? 'rgba\\(255,255,255,0\.03\\)' : 'rgba\\(0,0,0,0\.03\\)'/, \`isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'\`);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Update script completed successfully!');
