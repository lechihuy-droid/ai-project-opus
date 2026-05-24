// Lucida Design System — Tokens + Components
// Export: LucidaTokens, and all learning components to window

// ── TOKENS ──────────────────────────────────────────────────────
const D = {
  // Dark / Video mode
  bg:        '#0d0d16',
  card:      '#16161f',
  card2:     '#1c1c28',
  card3:     '#222235',
  fg:        '#e8e8f0',
  fgMuted:   '#7070a0',
  fgSub:     '#4a4a70',
  accent:    'oklch(74% 0.185 76)',   // amber
  accentDim: 'oklch(55% 0.12 76)',
  red:       'oklch(62% 0.22 22)',
  blue:      'oklch(68% 0.18 255)',
  green:     'oklch(66% 0.17 155)',
  border:    'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  mode: 'dark',
};

const L = {
  // Light / Study mode
  bg:        '#f5f2eb',
  card:      '#ffffff',
  card2:     '#edeae0',
  card3:     '#e4e0d5',
  fg:        '#1a1714',
  fgMuted:   '#8a7f6f',
  fgSub:     '#b0a898',
  accent:    'oklch(44% 0.22 22)',    // crimson
  accentDim: 'oklch(62% 0.16 22)',
  red:       'oklch(42% 0.20 22)',
  blue:      'oklch(42% 0.18 255)',
  green:     'oklch(40% 0.16 155)',
  border:    'rgba(0,0,0,0.09)',
  borderStrong: 'rgba(0,0,0,0.16)',
  mode: 'light',
};

const FONTS = {
  display: "'Space Grotesk', 'Noto Sans JP', sans-serif",
  body:    "'DM Sans', 'Noto Sans JP', sans-serif",
  jp:      "'Noto Sans JP', sans-serif",
  mono:    "'Space Mono', 'Noto Sans JP', monospace",
};

// ── MICRO HELPERS ───────────────────────────────────────────────
function bg(t, level = 1) {
  return level === 1 ? t.card : level === 2 ? t.card2 : t.card3;
}

// ── WORDMARK ────────────────────────────────────────────────────
function LucidaWordmark({ t, size = 40 }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', gap:3, fontFamily:FONTS.display }}>
      <span style={{
        fontSize:size,
        fontWeight:700,
        color:t.fg,
        letterSpacing:'-0.035em',
        lineHeight:1,
      }}>lucida</span>
      <span style={{
        display:'inline-block',
        width: size * 0.13,
        height: size * 0.13,
        borderRadius:'50%',
        background:t.accent,
        marginBottom: size * 0.05,
        flexShrink:0,
      }}/>
    </div>
  );
}

// ── CHIP / TAG ──────────────────────────────────────────────────
function Chip({ children, t, variant = 'default', size = 13 }) {
  const styles = {
    default: { bg: t.card2, color: t.fgMuted, border: t.border },
    accent:  { bg: t.mode==='dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: t.accent, border: t.accentDim },
    solid:   { bg: t.accent, color: t.mode==='dark' ? '#0d0d16' : '#fff', border: 'transparent' },
  };
  const s = styles[variant];
  return (
    <span style={{
      display:'inline-block',
      padding:`${size*0.35}px ${size*0.9}px`,
      borderRadius: size * 0.6,
      background: s.bg,
      border: `1.5px solid ${s.border}`,
      fontSize: size,
      fontWeight:600,
      color: s.color,
      letterSpacing:'0.08em',
      textTransform:'uppercase',
      fontFamily: FONTS.body,
      lineHeight:1,
    }}>{children}</span>
  );
}

// ── RULE ────────────────────────────────────────────────────────
function Rule({ t, width = 48 }) {
  return <div style={{ width, height:3, background:t.accent, borderRadius:2, marginBottom:20 }} />;
}

// ── JP TOKEN (grammar pattern in mono) ─────────────────────────
function JpToken({ children, t, size = 16, highlight }) {
  return (
    <span style={{
      fontFamily: FONTS.mono,
      fontSize: size,
      letterSpacing:'0.04em',
      background: highlight ? (t.mode==='dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent',
      padding: highlight ? '2px 8px' : '0',
      borderRadius: 4,
      color: highlight ? t.accent : t.fg,
      fontWeight: highlight ? 700 : 400,
    }}>{children}</span>
  );
}

// ── CARD WRAPPER ────────────────────────────────────────────────
function Card({ t, children, accentLeft, style = {} }) {
  return (
    <div style={{
      background: t.card,
      border: `1px solid ${t.border}`,
      borderLeft: accentLeft ? `4px solid ${t.accent}` : undefined,
      borderRadius: 12,
      padding:'24px 28px',
      ...style,
    }}>{children}</div>
  );
}

// ── SECTION LABEL ───────────────────────────────────────────────
function SectionLabel({ children, t, size = 11 }) {
  return (
    <div style={{
      fontSize:size,
      color:t.fgMuted,
      letterSpacing:'0.14em',
      textTransform:'uppercase',
      fontFamily:FONTS.body,
      fontWeight:600,
      marginBottom:14,
    }}>{children}</div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LEARNING COMPONENTS
// ═══════════════════════════════════════════════════════════════

// 1. HOOK CONTRAST — two sentences showing the problem
function HookContrast({ t }) {
  return (
    <div style={{ background:t.bg, padding:32, display:'flex', flexDirection:'column', gap:24, height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <SectionLabel t={t}>Hook Contrast</SectionLabel>
        <Chip t={t} variant="accent">Component 01</Chip>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {[
          { num:'①', jp:'行きたくない', hi:'わけではありません', end:'。', vn:'Không phải là tôi không muốn đi.' },
          { num:'②', jp:'今日は行く', hi:'わけにはいきません', end:'。', vn:'Hôm nay tôi không thể đi.', red:true },
        ].map(s => (
          <div key={s.num} style={{ background:t.card, borderRadius:10, padding:'18px 22px', border:`1px solid ${t.border}` }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:8 }}>
              <span style={{ fontSize:12, color:t.fgMuted, fontFamily:FONTS.body, minWidth:16 }}>{s.num}</span>
              <span style={{ fontSize:28, fontFamily:FONTS.jp, letterSpacing:'0.03em', color:t.fg, lineHeight:1.4 }}>
                {s.jp}<span style={{ color: s.red ? t.red : t.accent, fontWeight:700 }}>{s.hi}</span>{s.end}
              </span>
            </div>
            <div style={{ fontSize:13, color:t.fgMuted, fontFamily:FONTS.body, marginLeft:26 }}>{s.vn}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 20px', borderRadius:8, background:t.mode==='dark'?'rgba(255,255,255,0.03)':'rgba(0,0,0,0.04)', border:`1px solid ${t.border}` }}>
        <div style={{ width:7, height:7, borderRadius:'50%', background:t.accent, flexShrink:0 }}/>
        <div style={{ fontSize:13, color:t.fgMuted, fontFamily:FONTS.body }}>
          Cùng có <span style={{ color:t.accent, fontWeight:700, fontFamily:FONTS.jp }}>わけ</span> — nhưng không cùng mạch logic
        </div>
      </div>
    </div>
  );
}

// 2. QUIZ CARD
function QuizCard({ t }) {
  return (
    <div style={{ background:t.bg, padding:32, display:'flex', flexDirection:'column', gap:20, height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <SectionLabel t={t}>Quiz</SectionLabel>
        <Chip t={t} variant="accent">Component 02</Chip>
      </div>
      <div style={{ background:t.card, borderRadius:10, padding:'20px 24px', borderLeft:`4px solid ${t.accent}`, border:`1px solid ${t.border}`, borderLeftWidth:4, borderLeftColor:t.accent, borderLeftStyle:'solid' }}>
        <div style={{ fontSize:20, fontFamily:FONTS.jp, letterSpacing:'0.04em', color:t.fg, lineHeight:1.8 }}>
          行きたくない<span style={{ display:'inline-block', minWidth:52, borderBottom:`2.5px solid ${t.accent}`, marginBottom:2, marginInline:4 }}/> ありません。
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {[
          { label:'A', text:'わけでは ／ わけには', correct:true },
          { label:'B', text:'わけが ／ わけでは' },
          { label:'C', text:'わけだ ／ わけが' },
        ].map(o => (
          <div key={o.label} style={{
            display:'flex', alignItems:'center', gap:14,
            padding:'12px 18px', borderRadius:8,
            background: o.correct ? (t.mode==='dark'?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)') : 'transparent',
            border: `1.5px solid ${o.correct ? t.accentDim : t.border}`,
          }}>
            <span style={{ fontSize:13, fontWeight:700, color: o.correct ? t.accent : t.fgMuted, fontFamily:FONTS.body, minWidth:18 }}>{o.label}.</span>
            <span style={{ fontSize:16, fontFamily:FONTS.jp, color:t.fg, letterSpacing:'0.03em' }}>{o.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. GRAMMAR CARD — Nghĩa – Hình – Dụng
function GrammarCardComponent({ t }) {
  return (
    <div style={{ background:t.bg, padding:32, display:'flex', flexDirection:'column', gap:20, height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <SectionLabel t={t}>Grammar Card · Nghĩa–Hình–Dụng</SectionLabel>
        <Chip t={t} variant="accent">Component 03</Chip>
      </div>
      <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
        <div style={{ fontSize:36, fontWeight:700, color:t.accent, fontFamily:FONTS.display, letterSpacing:'0.02em' }}>わけではない</div>
        <Chip t={t}>Mẫu 1</Chip>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {[
          { label:'Nghĩa', content:'không phải là… / không có nghĩa là…', icon:'意' },
          { label:'Hình', content:<span style={{ fontFamily:FONTS.mono, fontSize:14 }}>普通形 + わけではない</span>, icon:'形' },
          { label:'Dụng', content:'Sửa hiểu nhầm / phủ định nhận định. Tone mềm.', icon:'用' },
        ].map(r => (
          <div key={r.label} style={{ display:'flex', gap:14, padding:'14px 18px', borderRadius:8, background:t.card, border:`1px solid ${t.border}` }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:6, background:t.card2, flexShrink:0 }}>
              <span style={{ fontSize:13, fontFamily:FONTS.jp, color:t.accent, fontWeight:700 }}>{r.icon}</span>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:t.accent, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:FONTS.body, marginBottom:4 }}>{r.label}</div>
              <div style={{ fontSize:14, color:t.fg, fontFamily:FONTS.body, lineHeight:1.5 }}>{r.content}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:'14px 18px', borderRadius:8, background:t.card2, border:`1px solid ${t.border}` }}>
        <div style={{ fontSize:11, color:t.fgMuted, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:FONTS.body, marginBottom:8 }}>Ví dụ</div>
        <div style={{ fontSize:20, fontFamily:FONTS.jp, color:t.fg, letterSpacing:'0.03em', marginBottom:6 }}>行きたくない<span style={{ color:t.accent, fontWeight:700 }}>わけではありません</span>。</div>
        <div style={{ fontSize:13, color:t.fgMuted, fontFamily:FONTS.body }}>Không phải là tôi không muốn đi.</div>
      </div>
    </div>
  );
}

// 4. NGƯỜI NÓI ĐANG LÀM GÌ
function ActionLabel({ t }) {
  const actions = [
    { jp:'わけだ',          vn:'kết luận hợp lý',         color:t.blue },
    { jp:'わけではない',    vn:'phủ định nhận định',       color:t.accent },
    { jp:'わけがない',      vn:'bác bỏ khả năng mạnh',    color:t.green },
    { jp:'わけにはいかない',vn:'ràng buộc, không thể làm', color:t.red },
  ];
  return (
    <div style={{ background:t.bg, padding:32, display:'flex', flexDirection:'column', gap:20, height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <SectionLabel t={t}>Người nói đang làm gì</SectionLabel>
        <Chip t={t} variant="accent">Component 04</Chip>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {actions.map(a => (
          <div key={a.jp} style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px', borderRadius:10, background:t.card, border:`1px solid ${t.border}` }}>
            <div style={{ width:4, height:36, borderRadius:2, background:a.color, flexShrink:0 }}/>
            <div style={{ fontSize:20, fontFamily:FONTS.jp, color:a.color, fontWeight:700, letterSpacing:'0.03em', minWidth:190 }}>{a.jp}</div>
            <div style={{ fontSize:14, color:t.fgMuted, fontFamily:FONTS.body }}>→ {a.vn}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. DẤU HIỆU CHỌN MẪU (Exam Signal)
function ExamSignal({ t }) {
  return (
    <div style={{ background:t.bg, padding:32, display:'flex', flexDirection:'column', gap:20, height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <SectionLabel t={t}>Dấu hiệu chọn mẫu</SectionLabel>
        <Chip t={t} variant="accent">Component 05</Chip>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {[
          { step:'01', label:'Cụm từ đi trước', desc:'Trước chỗ trống có từ / cụm nào quan trọng?' },
          { step:'02', label:'Cụm từ đi sau',   desc:'Sau chỗ trống có kết quả / sắc thái gì?' },
          { step:'03', label:'Mạch logic',       desc:'Người nói đang kết luận, phủ định, bác bỏ, hay bị ràng buộc?' },
        ].map(s => (
          <div key={s.step} style={{ display:'flex', gap:16, padding:'14px 18px', borderRadius:8, background:t.card, border:`1px solid ${t.border}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:t.accent, fontFamily:FONTS.mono, minWidth:26, paddingTop:2 }}>{s.step}</div>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:t.fg, fontFamily:FONTS.body, marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize:13, color:t.fgMuted, fontFamily:FONTS.body, lineHeight:1.5 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:t.card2, borderRadius:8, padding:'14px 18px', border:`1px solid ${t.border}` }}>
        <div style={{ fontSize:11, color:t.fgMuted, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:FONTS.body, marginBottom:10 }}>Mini map</div>
        {[
          ['締切がある', '→', 'わけだ / わけにはいかない'],
          ['絶対ありえない', '→', 'わけがない'],
          ['sửa hiểu nhầm', '→', 'わけではない'],
        ].map(r => (
          <div key={r[0]} style={{ display:'flex', gap:8, alignItems:'baseline', marginBottom:6 }}>
            <span style={{ fontSize:13, fontFamily:FONTS.jp, color:t.fg }}>{r[0]}</span>
            <span style={{ fontSize:11, color:t.fgSub }}>{r[1]}</span>
            <span style={{ fontSize:13, fontFamily:FONTS.jp, color:t.accent, fontWeight:600 }}>{r[2]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 6. BẪY ĐỂ NHẦM (Trap Warning)
function TrapWarning({ t }) {
  return (
    <div style={{ background:t.bg, padding:32, display:'flex', flexDirection:'column', gap:20, height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <SectionLabel t={t}>Bẫy để nhầm</SectionLabel>
        <Chip t={t} variant="accent">Component 06</Chip>
      </div>
      <div style={{ padding:'14px 18px', borderRadius:8, background:t.mode==='dark'?'rgba(255,80,60,0.08)':'rgba(180,40,20,0.06)', border:`1.5px solid ${t.red}40`, display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ fontSize:16, color:t.red }}>⚠</div>
        <div style={{ fontSize:13, color:t.mode==='dark'?'oklch(75% 0.16 22)':t.red, fontFamily:FONTS.body, fontWeight:500 }}>Cặp dễ nhầm: わけではない vs わけがない</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={{ padding:'18px 18px', borderRadius:10, background:t.card, border:`1px solid ${t.border}` }}>
          <div style={{ fontSize:18, fontFamily:FONTS.jp, color:t.accent, fontWeight:700, marginBottom:8 }}>わけではない</div>
          <div style={{ fontSize:13, color:t.fg, fontFamily:FONTS.body, marginBottom:4 }}>không phải là A</div>
          <div style={{ fontSize:12, color:t.fgMuted, fontFamily:FONTS.body, lineHeight:1.5 }}>Sửa hiểu nhầm. Tone mềm, còn khả năng A một phần.</div>
        </div>
        <div style={{ padding:'18px 18px', borderRadius:10, background:t.card, border:`1px solid ${t.border}` }}>
          <div style={{ fontSize:18, fontFamily:FONTS.jp, color:t.green, fontWeight:700, marginBottom:8 }}>わけがない</div>
          <div style={{ fontSize:13, color:t.fg, fontFamily:FONTS.body, marginBottom:4 }}>không thể nào là A</div>
          <div style={{ fontSize:12, color:t.fgMuted, fontFamily:FONTS.body, lineHeight:1.5 }}>Bác bỏ hoàn toàn. Tone mạnh, chắc chắn.</div>
        </div>
      </div>
      <div style={{ fontSize:13, fontFamily:FONTS.jp, color:t.fg, padding:'12px 16px', background:t.card2, borderRadius:8 }}>
        嫌いな<span style={{ color:t.accent, fontWeight:700 }}>わけではない</span> vs 嫌いな<span style={{ color:t.green, fontWeight:700 }}>わけがない</span>
      </div>
    </div>
  );
}

// 7. COMPARISON
function ComparisonCard({ t }) {
  return (
    <div style={{ background:t.bg, padding:32, display:'flex', flexDirection:'column', gap:20, height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <SectionLabel t={t}>Comparison</SectionLabel>
        <Chip t={t} variant="accent">Component 07</Chip>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, flex:1 }}>
        {[
          { jp:'わけがない', label:'không thể nào xảy ra', desc:'Nhận định về khả năng / sự thật.', ex:'彼がそんなことを言うわけがない。', exVn:'Không thể nào anh ấy nói vậy.', color:t.green },
          { jp:'わけにはいかない', label:'muốn cũng không thể làm', desc:'Hành động bị hoàn cảnh giữ lại.', ex:'今日は休むわけにはいかない。', exVn:'Hôm nay không thể nghỉ vì ràng buộc.', color:t.red },
        ].map(c => (
          <div key={c.jp} style={{ display:'flex', flexDirection:'column', gap:12, padding:'20px 20px', borderRadius:10, background:t.card, border:`1px solid ${t.border}`, borderTop:`3px solid ${c.color}` }}>
            <div style={{ fontSize:18, fontFamily:FONTS.jp, color:c.color, fontWeight:700, letterSpacing:'0.02em' }}>{c.jp}</div>
            <div style={{ fontSize:13, fontWeight:600, color:t.fg, fontFamily:FONTS.body }}>{c.label}</div>
            <div style={{ fontSize:12, color:t.fgMuted, fontFamily:FONTS.body, lineHeight:1.5, flex:1 }}>{c.desc}</div>
            <div style={{ padding:'10px 12px', background:t.card2, borderRadius:6 }}>
              <div style={{ fontSize:14, fontFamily:FONTS.jp, color:t.fg, marginBottom:4 }}>{c.ex}</div>
              <div style={{ fontSize:12, color:t.fgMuted, fontFamily:FONTS.body }}>{c.exVn}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 8. PRACTICE CARD
function PracticeCard({ t }) {
  return (
    <div style={{ background:t.bg, padding:32, display:'flex', flexDirection:'column', gap:20, height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <SectionLabel t={t}>Practice</SectionLabel>
        <Chip t={t} variant="accent">Component 08</Chip>
      </div>
      <div style={{ padding:'20px 22px', borderRadius:10, background:t.card, border:`1px solid ${t.border}`, borderLeft:`4px solid ${t.accent}` }}>
        <div style={{ fontSize:11, color:t.fgMuted, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:FONTS.body, marginBottom:12 }}>Câu hỏi</div>
        <div style={{ fontSize:22, fontFamily:FONTS.jp, color:t.fg, letterSpacing:'0.04em', lineHeight:1.7 }}>
          Namさんがみんなを嫌いな<span style={{ display:'inline-block', minWidth:52, borderBottom:`2.5px solid ${t.accent}`, marginBottom:2, marginInline:4 }}/>。
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {[
          { label:'A', jp:'わけではない', vn:'không phải là ghét' },
          { label:'B', jp:'わけがない',   vn:'không thể nào ghét', correct:true },
          { label:'C', jp:'わけだ',       vn:'kết luận là ghét' },
        ].map(o => (
          <div key={o.label} style={{
            display:'flex', alignItems:'center', gap:14,
            padding:'12px 18px', borderRadius:8,
            background: o.correct ? (t.mode==='dark'?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)') : 'transparent',
            border: `1.5px solid ${o.correct ? t.accentDim : t.border}`,
          }}>
            <span style={{ fontSize:13, fontWeight:700, color:o.correct?t.accent:t.fgMuted, fontFamily:FONTS.body, minWidth:18 }}>{o.label}.</span>
            <span style={{ fontSize:17, fontFamily:FONTS.jp, color:t.fg, letterSpacing:'0.02em' }}>{o.jp}</span>
            <span style={{ fontSize:12, color:t.fgMuted, fontFamily:FONTS.body, marginLeft:'auto' }}>{o.vn}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 9. ANSWER REVEAL
function AnswerReveal({ t }) {
  return (
    <div style={{ background:t.bg, padding:32, display:'flex', flexDirection:'column', gap:20, height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <SectionLabel t={t}>Answer Reveal</SectionLabel>
        <Chip t={t} variant="accent">Component 09</Chip>
      </div>
      <div style={{ padding:'20px 22px', borderRadius:10, background:t.card, border:`1px solid ${t.border}` }}>
        <div style={{ fontSize:22, fontFamily:FONTS.jp, color:t.fg, letterSpacing:'0.04em', lineHeight:1.7 }}>
          Namさんがみんなを嫌いな<span style={{ color:t.accent, fontWeight:700 }}>わけがない</span>。
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:8, background:t.mode==='dark'?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)', border:`1.5px solid ${t.accentDim}` }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:t.accent, flexShrink:0 }}/>
          <div style={{ fontSize:13, fontFamily:FONTS.body, color:t.fg, fontWeight:600 }}>Đáp án: B — わけがない</div>
        </div>
        <div style={{ padding:'14px 18px', borderRadius:8, background:t.card, border:`1px solid ${t.border}` }}>
          <div style={{ fontSize:11, color:t.fgMuted, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:FONTS.body, marginBottom:8 }}>Lý do</div>
          <div style={{ fontSize:13, color:t.fg, fontFamily:FONTS.body, lineHeight:1.6 }}>Người nói bác bỏ khả năng rất mạnh: "Làm gì có chuyện Nam ghét mọi người." Dùng <span style={{ color:t.accent, fontWeight:600, fontFamily:FONTS.jp }}>わけがない</span>, không phải <span style={{ fontFamily:FONTS.jp }}>わけではない</span> (sửa hiểu nhầm nhẹ hơn).</div>
        </div>
        <div style={{ padding:'12px 16px', borderRadius:8, background:t.card2, border:`1px solid ${t.border}` }}>
          <div style={{ fontSize:11, color:t.fgMuted, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:FONTS.body, marginBottom:6 }}>Lưu ý hình thức</div>
          <div style={{ fontSize:14, fontFamily:FONTS.jp, color:t.fg }}>嫌い = tính từ な → <span style={{ color:t.accent, fontWeight:700 }}>嫌いな</span>わけがない</div>
        </div>
      </div>
    </div>
  );
}

// 10. RECAP TABLE
function RecapTable({ t }) {
  const rows = [
    { jp:'わけだ',           vn:'kết luận hợp lý',        color:t.blue },
    { jp:'わけではない',     vn:'không phải là…',          color:t.accent },
    { jp:'わけがない',       vn:'không thể nào…',          color:t.green },
    { jp:'わけにはいかない', vn:'không thể vì ràng buộc',  color:t.red },
  ];
  return (
    <div style={{ background:t.bg, padding:32, display:'flex', flexDirection:'column', gap:20, height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <SectionLabel t={t}>Recap</SectionLabel>
        <Chip t={t} variant="accent">Component 10</Chip>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1 }}>
        {rows.map(r => (
          <div key={r.jp} style={{ display:'flex', alignItems:'center', gap:20, padding:'18px 22px', borderRadius:10, background:t.card, border:`1px solid ${t.border}` }}>
            <div style={{ fontSize:22, fontFamily:FONTS.jp, fontWeight:700, color:r.color, letterSpacing:'0.03em', minWidth:200 }}>{r.jp}</div>
            <div style={{ width:1, height:28, background:t.border }}/>
            <div style={{ fontSize:15, color:t.fg, fontFamily:FONTS.body }}>{r.vn}</div>
          </div>
        ))}
      </div>
      <div style={{ padding:'12px 18px', borderRadius:8, background:t.card2, border:`1px solid ${t.border}` }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontSize:12, color:t.fgMuted, fontFamily:FONTS.body }}>Bonus nhỏ:</div>
          <div style={{ fontSize:14, fontFamily:FONTS.jp, color:t.fgMuted }}>Vない + <span style={{ color:t.accent }}>わけにはいかない</span></div>
          <div style={{ fontSize:12, color:t.fgMuted, fontFamily:FONTS.body }}>= buộc phải làm</div>
        </div>
      </div>
    </div>
  );
}

// 11. CTA WORKSHEET
function CTAWorksheet({ t }) {
  return (
    <div style={{ background:t.bg, padding:32, display:'flex', flexDirection:'column', gap:20, height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <SectionLabel t={t}>CTA Worksheet</SectionLabel>
        <Chip t={t} variant="accent">Component 11</Chip>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ fontSize:22, fontWeight:600, color:t.fg, fontFamily:FONTS.display, lineHeight:1.4 }}>Hiểu rồi — nhưng vào đề vẫn phân vân?</div>
        <div style={{ fontSize:14, color:t.fgMuted, fontFamily:FONTS.body, lineHeight:1.6 }}>Worksheet bài わけ giúp bạn luyện phần chọn mẫu đúng, không chỉ đọc lại lý thuyết.</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {['Bảng Nghĩa – Hình – Dụng','Dấu hiệu chọn mẫu','Bài tập JLPT-style','Bonus practice'].map(item => (
            <div key={item} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:7, background:t.card, border:`1px solid ${t.border}` }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:t.accent, flexShrink:0 }}/>
              <div style={{ fontSize:14, color:t.fg, fontFamily:FONTS.body }}>{item}</div>
            </div>
          ))}
        </div>
        <button style={{
          background:t.accent,
          color: t.mode==='dark' ? '#0d0d16' : '#fff',
          border:'none',
          borderRadius:8,
          padding:'14px 24px',
          fontSize:15,
          fontWeight:700,
          fontFamily:FONTS.body,
          cursor:'pointer',
          letterSpacing:'0.02em',
          marginTop:4,
        }}>Tải Worksheet Miễn Phí</button>
      </div>
    </div>
  );
}

// Export everything to window
Object.assign(window, {
  LucidaD: D, LucidaL: L, LucidaFonts: FONTS,
  LucidaWordmark, Chip, Rule, SectionLabel, Card, JpToken,
  HookContrast, QuizCard, GrammarCardComponent, ActionLabel,
  ExamSignal, TrapWarning, ComparisonCard, PracticeCard,
  AnswerReveal, RecapTable, CTAWorksheet,
});
