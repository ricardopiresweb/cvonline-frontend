"use client";

import { useState } from "react";

// ============================================================
// UTILS
// ============================================================

/**
 * Parser do formato de intervalo PostgreSQL "[from,to)"
 * Suporta datas completas "[2015-03-02,2025-12-19)" e só anos "[2019,2022)"
 */
function parseInterval(interval) {
    if (!interval) return { from: "—", to: "Presente" };
    const clean = interval.replace(/[\[\]\(\)]/g, "");
    const [from, to] = clean.split(",").map((s) => s.trim());

    const fmt = (s, fallback = "Presente") => {
        if (!s) return fallback;
        if (/^\d{4}$/.test(s)) return s;
        const d = new Date(s);
        return isNaN(d) ? s : d.getFullYear().toString();
    };

    return { from: fmt(from, "—"), to: fmt(to, "Presente") };
}

/**
 * Soma todos os intervalos de experiência e retorna anos totais.
 */
function calcYearsExp(experiencias) {
    if (!experiencias?.length) return 0;
    let totalMs = 0;
    for (const ex of experiencias) {
        const clean = (ex.dt_intervalo ?? "").replace(/[\[\]\(\)]/g, "");
        const [from, to] = clean.split(",").map((s) => s.trim());
        const start = from ? new Date(from) : null;
        const end = to ? new Date(to) : new Date();
        if (start && !isNaN(start) && !isNaN(end)) {
            totalMs += Math.max(0, end - start);
        }
    }
    return Math.round(totalMs / (1000 * 60 * 60 * 24 * 365));
}

// ============================================================
// DADOS FIXOS NO FRONT
// ============================================================

const MOCK_SKILLS = [
    { id: 1, nome: "JavaScript", nivel: 4 },
    { id: 2, nome: "Node.js", nivel: 3 },
    { id: 3, nome: "React", nivel: 3 },
    { id: 4, nome: "SQL / PostgreSQL", nivel: 4 },
    { id: 5, nome: "Excel Avançado", nivel: 5 },
    { id: 6, nome: "CRM / Atendimento", nivel: 5 },
];

const SKILL_LABELS = { 1: "Iniciante", 2: "Básico", 3: "Treinado", 4: "Experiente", 5: "Mestre" };

const FIXED_ATTRIBUTES = [
    { stat: "FOR", skill: "Execução", value: 16, max: 20, desc: "Entrega sob pressão e foco em resultado" },
    { stat: "DES", skill: "Adaptabilidade", value: 15, max: 20, desc: "Velocidade de aprendizado e flexibilidade" },
    { stat: "INT", skill: "Raciocínio", value: 18, max: 20, desc: "Resolução de problemas e profundidade analítica" },
    { stat: "CAR", skill: "Comunicação", value: 14, max: 20, desc: "Influência, clareza e liderança de pessoas" },
    { stat: "SAB", skill: "Estratégia", value: 13, max: 20, desc: "Tomada de decisão e pensamento sistêmico" },
    { stat: "CON", skill: "Resiliência", value: 12, max: 20, desc: "Consistência, confiabilidade e foco longo prazo" },
];

// ============================================================
// ADAPTADOR — JSON da API → shape interno
// ============================================================

function adaptApiData(raw) {
    const yearsExp = calcYearsExp(raw.experiencias);

    return {
        personal: {
            name: raw.nome ?? "Nome não informado",
            title: raw.cargo_pretendido ?? "Cargo não informado",
            email: raw.email ?? "",
            phone: Array.isArray(raw.telefones)
                ? raw.telefones[0]
                : (raw.telefones ?? ""),
            location: raw.endereco ?? "",
            summary: raw.sobre ?? "",
            link: raw.link ?? null,   // null → não renderiza
            yearsExp,
        },
        experience: (raw.experiencias ?? []).map((ex) => {
            const { from, to } = parseInterval(ex.dt_intervalo);
            return {
                id: ex.id,
                role: ex.cargo ?? "Cargo não informado",
                company: ex.empresa ?? "Empresa não informada",
                period: `${from} – ${to}`,
                desc: ex.funcoes ?? "",
            };
        }),
        education: (raw.competencias ?? []).map((comp) => {
            const { from, to } = parseInterval(comp.intervalo);
            return {
                id: comp.id,
                degree: comp.curso ?? "Curso não informado",
                institution: comp.instituicao ?? "Instituição não informada",
                period: `${from} – ${to}`,
                obs: comp.obs ?? "",
            };
        }),
        skills: MOCK_SKILLS,
        attributes: FIXED_ATTRIBUTES,
    };
}

// ============================================================
// SAMPLE — espelho exato do JSON da API
// ============================================================

const API_SAMPLE = {
    id_usuario: "1",
    nome: "Ricardo Fernandes Pires",
    email: "ricardo@powerdev.com.br",
    endereco: "São Paulo, SP",
    telefones: "+55 11 98888-0000",
    cargo_pretendido: "Consultor de Sistemas",
    sobre: "Profissional com ampla experiência em consultoria de sistemas e atendimento técnico. Comprometido com entregas de qualidade e aprendizado contínuo.",
    link: "https://linkedin.com/in/ricardofpires",
    experiencias: [
        { id: 1, empresa: "Atento", cargo: "Consultor de Sistemas", funcoes: "Atendimento e consultoria técnica a clientes corporativos, resolução de incidentes e melhoria de processos internos.", dt_intervalo: "[2015-03-02,2025-12-19)" },
        { id: 2, empresa: "Empresa 1", cargo: "Analista de Suporte", funcoes: "Suporte técnico de primeiro nível, triagem de chamados e documentação de soluções.", dt_intervalo: "[2007-10-15,2007-11-20)" },
    ],
    competencias: [
        { id: 1, instituicao: "Unicid", curso: "Marketing", obs: "Ênfase em marketing digital e comportamento do consumidor.", intervalo: "[2019,2022)" },
        { id: 2, instituicao: "Microlins", curso: "Digitação", obs: "", intervalo: "[2005,2007)" },
    ],
};

// ============================================================
// SHARED COMPONENTS
// ============================================================

function SkillPips({ level, max = 5, filledColor, emptyColor, size = 13 }) {
    return (
        <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: max }).map((_, i) => (
                <div key={i} style={{
                    width: size, height: size, borderRadius: "50%", flexShrink: 0,
                    background: i < level ? filledColor : emptyColor,
                    border: `1.5px solid ${filledColor}`,
                }} />
            ))}
        </div>
    );
}

function AttributeBox({ attr, styles = {} }) {
    const [hovered, setHovered] = useState(false);
    const pct = Math.round((attr.value / attr.max) * 100);
    return (
        <div
            style={{ position: "relative", textAlign: "center", cursor: "default", ...styles.box }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div style={styles.statLabel}>{attr.stat}</div>
            <div style={styles.statValue}>{attr.value}</div>
            <div style={styles.skillName}>{attr.skill}</div>
            {hovered && (
                <div style={{
                    position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
                    transform: "translateX(-50%)", background: "rgba(0,0,0,0.93)",
                    color: "#f0e8d0", fontSize: "0.68rem", fontFamily: "serif",
                    fontStyle: "italic", padding: "8px 12px", borderRadius: 3,
                    zIndex: 99, border: "1px solid rgba(200,164,74,0.5)",
                    pointerEvents: "none", lineHeight: 1.5, width: 190, textAlign: "center",
                    ...styles.tooltip,
                }}>
                    <div style={{ fontWeight: "bold", marginBottom: 3, fontSize: "0.6rem", letterSpacing: 2, color: "#c4a44a", fontStyle: "normal", textTransform: "uppercase" }}>
                        {attr.skill}
                    </div>
                    <div>{attr.desc}</div>
                    <div style={{ marginTop: 5, fontSize: "0.58rem", color: "#888", fontStyle: "normal" }}>
                        Autoavaliação · {attr.value}/{attr.max} ({pct}%)
                    </div>
                    <div style={{
                        position: "absolute", bottom: -5, left: "50%", width: 8, height: 8,
                        background: "rgba(0,0,0,0.93)",
                        borderRight: "1px solid rgba(200,164,74,0.5)",
                        borderBottom: "1px solid rgba(200,164,74,0.5)",
                        transform: "translateX(-50%) rotate(45deg)",
                    }} />
                </div>
            )}
        </div>
    );
}

// ============================================================
// THEME: MEDIEVAL / FANTASY
// ============================================================
function MedievalTheme({ data }) {
    const { personal, skills, experience, education, attributes } = data;

    const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
    .med-wrap * { box-sizing:border-box; margin:0; padding:0; }
    .med-wrap { font-family:'Crimson Text',serif; background:#f4e4b8; background-image:linear-gradient(135deg,#f9eed0 0%,#f0d99a 30%,#f4e4b8 60%,#eddfa0 100%); border:3px solid #8b6914; box-shadow:inset 0 0 80px rgba(139,90,30,0.2),0 0 0 6px #5a4008,0 0 0 8px #8b6914; color:#3d2b0a; padding:3rem 3.5rem; position:relative; max-width:900px; margin:0 auto; }
    .med-name { font-family:'Cinzel',serif; font-size:2.2rem; font-weight:700; color:#2a1a00; letter-spacing:3px; }
    .med-subtitle { font-family:'Cinzel',serif; font-size:0.85rem; color:#7a5510; letter-spacing:4px; text-transform:uppercase; margin:4px 0 0.8rem; }
    .med-meta { display:flex; flex-wrap:wrap; gap:0.8rem 1.5rem; font-size:0.86rem; color:#5a3e10; }
    .med-meta a { color:#7a5510; text-decoration:none; border-bottom:1px dotted #c4a44a; }
    .med-section-title { font-family:'Cinzel',serif; font-size:0.72rem; letter-spacing:3px; text-transform:uppercase; color:#8b6914; border-bottom:1px solid #c4a44a; padding-bottom:4px; margin:1.5rem 0 1rem; display:flex; align-items:center; gap:8px; }
    .med-section-title::before { content:'◆'; font-size:9px; }
    .med-two-col { display:grid; grid-template-columns:1fr 2fr; gap:2rem; }
    .med-stat-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .med-xp-bar { background:rgba(90,60,8,0.2); border:1px solid #c4a44a; height:10px; border-radius:2px; overflow:hidden; margin-top:6px; }
    .med-xp-fill { height:100%; background:linear-gradient(90deg,#8b5e14,#d4a017); }
    .med-quest { padding-left:1.2rem; border-left:2px solid #c4a44a; position:relative; margin-bottom:1.3rem; }
    .med-quest::before { content:'⚜'; position:absolute; left:-10px; top:0; font-size:13px; color:#8b6914; background:#f4e4b8; line-height:1; }
    .med-quest-role { font-family:'Cinzel',serif; font-size:0.92rem; font-weight:700; color:#2a1a00; }
    .med-quest-company { font-size:0.82rem; color:#7a5510; font-style:italic; }
    .med-quest-period { font-family:'Cinzel',serif; font-size:0.62rem; letter-spacing:1px; color:#9b7a30; text-transform:uppercase; margin:3px 0 5px; }
    .med-quest-desc { font-size:0.86rem; line-height:1.6; color:#3d2b0a; }
    .med-scroll { display:flex; gap:12px; align-items:flex-start; padding:10px 12px; border:1px solid #c4a44a; border-radius:3px; background:rgba(139,105,20,0.05); margin-bottom:10px; }
    .med-scroll-degree { font-family:'Cinzel',serif; font-size:0.82rem; font-weight:700; color:#2a1a00; }
    .med-scroll-inst { font-size:0.78rem; color:#7a5510; font-style:italic; }
    .med-scroll-period { font-family:'Cinzel',serif; font-size:0.62rem; letter-spacing:1px; color:#9b7a30; text-transform:uppercase; }
    .med-scroll-obs { font-size:0.76rem; color:#6b4a18; font-style:italic; margin-top:2px; }
    .med-header-border { border-bottom:2px solid #8b6914; padding-bottom:1.5rem; margin-bottom:0.5rem; position:relative; }
    .med-header-border::after { content:'⚔'; position:absolute; bottom:-13px; left:50%; transform:translateX(-50%); background:#f4e4b8; padding:0 12px; font-size:18px; color:#8b6914; }
    .med-divider { text-align:center; color:#c4a44a; font-size:11px; letter-spacing:8px; margin:1.5rem 0; }
    .med-seal { text-align:center; margin-top:1.5rem; padding-top:1rem; border-top:2px solid #8b6914; font-family:'Cinzel',serif; font-size:0.62rem; letter-spacing:3px; color:#9b7a30; text-transform:uppercase; }
  `;

    const xpPct = Math.min(100, Math.round((personal.yearsExp / 15) * 100));

    return (
        <>
            <style>{css}</style>
            <div className="med-wrap">
                {/* Header */}
                <div className="med-header-border">
                    <div className="med-name">{personal.name}</div>
                    <div className="med-subtitle">
                        {personal.title} · {personal.yearsExp} {personal.yearsExp === 1 ? "ano" : "anos"} de campanha
                    </div>
                    <div className="med-meta">
                        {personal.location && <span>📍 {personal.location}</span>}
                        {personal.email && <span>✉ {personal.email}</span>}
                        {personal.phone && <span>📜 {personal.phone}</span>}
                        {personal.link && <span>🔗 <a href={personal.link} target="_blank" rel="noreferrer">{personal.link.replace(/^https?:\/\//, "")}</a></span>}
                    </div>
                    {personal.summary && (
                        <p style={{ marginTop: "0.8rem", fontSize: "0.88rem", fontStyle: "italic", color: "#5a3e10", lineHeight: 1.6 }}>
                            "{personal.summary}"
                        </p>
                    )}
                </div>

                <div className="med-two-col" style={{ marginTop: "2rem" }}>
                    {/* LEFT */}
                    <div>
                        <div className="med-section-title">Atributos</div>
                        <div className="med-stat-grid">
                            {attributes.map((attr) => (
                                <AttributeBox key={attr.stat} attr={attr} styles={{
                                    box: { border: "1px solid #c4a44a", borderRadius: 3, padding: "8px 10px", background: "rgba(139,105,20,0.07)" },
                                    statLabel: { fontFamily: "'Cinzel',serif", fontSize: "0.58rem", letterSpacing: "1.5px", color: "#7a5510", textTransform: "uppercase", display: "block", marginBottom: 2 },
                                    statValue: { fontFamily: "'Cinzel',serif", fontSize: "1.4rem", fontWeight: 700, color: "#2a1a00" },
                                    skillName: { fontFamily: "'Crimson Text',serif", fontSize: "0.6rem", color: "#9b7a30", fontStyle: "italic", marginTop: 1 },
                                }} />
                            ))}
                        </div>

                        <div style={{ marginTop: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", fontFamily: "'Cinzel',serif", color: "#7a5510", textTransform: "uppercase", letterSpacing: 2 }}>
                                <span>XP Acumulado</span><span>{personal.yearsExp} anos</span>
                            </div>
                            <div className="med-xp-bar"><div className="med-xp-fill" style={{ width: `${xpPct}%` }} /></div>
                        </div>

                        <div className="med-section-title" style={{ marginTop: "1.5rem" }}>Habilidades</div>
                        {skills.map((sk) => (
                            <div key={sk.id} style={{ marginBottom: 10 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ fontFamily: "'Cinzel',serif", fontSize: "0.76rem", color: "#2a1a00" }}>{sk.nome}</span>
                                    <span style={{ fontSize: "0.7rem", color: "#8b6914", fontStyle: "italic" }}>{SKILL_LABELS[sk.nivel]}</span>
                                </div>
                                <SkillPips level={sk.nivel} filledColor="#8b5e14" emptyColor="rgba(90,60,8,0.15)" />
                            </div>
                        ))}
                    </div>

                    {/* RIGHT */}
                    <div>
                        <div className="med-section-title">Missões Concluídas</div>
                        {experience.map((ex) => (
                            <div className="med-quest" key={ex.id}>
                                <div className="med-quest-role">{ex.role}</div>
                                <div className="med-quest-company">{ex.company}</div>
                                <div className="med-quest-period">{ex.period}</div>
                                {ex.desc && <div className="med-quest-desc">{ex.desc}</div>}
                            </div>
                        ))}

                        <div className="med-section-title">Pergaminhos de Saber</div>
                        {education.map((ed) => (
                            <div className="med-scroll" key={ed.id}>
                                <div style={{ fontSize: 20 }}>📜</div>
                                <div>
                                    <div className="med-scroll-degree">{ed.degree}</div>
                                    <div className="med-scroll-inst">{ed.institution}</div>
                                    <div className="med-scroll-period">{ed.period}</div>
                                    {ed.obs && <div className="med-scroll-obs">{ed.obs}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="med-divider">· · · ✦ · · ·</div>
                <div className="med-seal">⚔ &nbsp; Ficha de Personagem · Campanha em andamento &nbsp; ⚔</div>
            </div>
        </>
    );
}

// ============================================================
// THEME: PIXEL ART / RETRO SNES
// ============================================================
function PixelTheme({ data }) {
    const { personal, skills, experience, education, attributes } = data;

    const css = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    .px-wrap * { box-sizing:border-box; margin:0; padding:0; image-rendering:pixelated; }
    .px-wrap { font-family:'Press Start 2P',monospace; background:#0a0a1a; color:#e8e8e8; padding:2rem; max-width:900px; margin:0 auto; border:4px solid #4488ff; box-shadow:0 0 0 4px #0a0a1a,0 0 0 8px #4488ff,inset 0 0 60px rgba(0,0,100,0.3); position:relative; }
    .px-scanline { position:absolute; inset:0; pointer-events:none; background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px); z-index:1; }
    .px-content { position:relative; z-index:2; }
    .px-title-bar { background:#4488ff; color:#fff; padding:8px 12px; font-size:0.5rem; letter-spacing:2px; display:flex; justify-content:space-between; margin-bottom:1.5rem; }
    .px-name { font-size:0.9rem; color:#ffdd00; text-shadow:2px 2px #cc8800; margin-bottom:4px; line-height:1.4; }
    .px-class { font-size:0.42rem; color:#88ccff; letter-spacing:1px; margin-bottom:0.6rem; }
    .px-level-badge { background:#ffdd00; color:#0a0a1a; font-size:0.38rem; padding:2px 6px; display:inline-block; margin-bottom:6px; }
    .px-contact { font-size:0.3rem; color:#888; margin-bottom:2px; }
    .px-contact a { color:#88ccff; text-decoration:none; }
    .px-bar-label { font-size:0.38rem; color:#aaaaaa; margin-bottom:3px; }
    .px-bar-outer { background:#333; border:2px solid #555; height:13px; position:relative; margin-bottom:10px; }
    .px-bar-inner { height:100%; }
    .px-bar-text { position:absolute; right:4px; top:50%; transform:translateY(-50%); font-size:0.35rem; color:#fff; }
    .px-section-header { font-size:0.42rem; color:#ffdd00; letter-spacing:2px; border-bottom:2px solid #4488ff; padding-bottom:4px; margin:1.2rem 0 0.8rem; }
    .px-two-col { display:grid; grid-template-columns:200px 1fr; gap:1.5rem; }
    .px-quest-block { border:2px solid #333; padding:10px; margin-bottom:10px; background:rgba(0,20,60,0.5); }
    .px-quest-role { font-size:0.42rem; color:#ffdd00; margin-bottom:4px; line-height:1.5; }
    .px-quest-meta { font-size:0.33rem; color:#88ccff; margin-bottom:5px; }
    .px-quest-desc { font-size:0.28rem; color:#aaaaaa; line-height:1.8; }
    .px-edu-block { display:flex; gap:8px; align-items:flex-start; border:2px solid #333; padding:8px; margin-bottom:8px; background:rgba(0,20,60,0.4); }
    .px-edu-degree { font-size:0.36rem; color:#e8e8e8; margin-bottom:3px; line-height:1.5; }
    .px-edu-inst { font-size:0.28rem; color:#88ccff; }
    .px-edu-period { font-size:0.28rem; color:#ffdd00; }
    .px-edu-obs { font-size:0.26rem; color:#888; font-style:italic; margin-top:2px; }
    .px-footer { text-align:center; margin-top:1.5rem; font-size:0.36rem; color:#4488ff; letter-spacing:2px; animation:blink 1.2s step-end infinite; }
    .px-cursor { display:inline-block; width:8px; height:13px; background:#e8e8e8; animation:blink 0.8s step-end infinite; margin-left:2px; vertical-align:middle; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  `;

    const xpPct = Math.min(100, Math.round((personal.yearsExp / 15) * 100));

    return (
        <>
            <style>{css}</style>
            <div className="px-wrap">
                <div className="px-scanline" />
                <div className="px-content">
                    <div className="px-title-bar">
                        <span>▶ CHARACTER STATUS</span>
                        <span>SAVE SLOT 01</span>
                    </div>

                    {/* Header */}
                    <div style={{ marginBottom: "1.5rem" }}>
                        <div className="px-name">{personal.name}</div>
                        <div className="px-class">CLASS: {personal.title.toUpperCase()} · LV.{personal.yearsExp * 5}</div>
                        <div className="px-level-badge">★ LV {personal.yearsExp * 5}</div>
                        {personal.location && <div className="px-contact">📍 {personal.location}</div>}
                        {personal.email && <div className="px-contact">✉ {personal.email}</div>}
                        {personal.phone && <div className="px-contact">☎ {personal.phone}</div>}
                        {personal.link && <div className="px-contact">🔗 <a href={personal.link} target="_blank" rel="noreferrer">{personal.link.replace(/^https?:\/\//, "")}</a></div>}
                    </div>

                    {/* Bars */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1.5rem" }}>
                        {[
                            { label: "XP", pct: xpPct, color: "#ffdd00", val: `${personal.yearsExp} ANOS` },
                            { label: "HP", pct: 90, color: "#33cc44", val: "900/1000" },
                            { label: "MP", pct: Math.round((attributes[2].value / 20) * 100), color: "#4488ff", val: `${attributes[2].value}/20` },
                            { label: "REP", pct: 75, color: "#ff88cc", val: "750/1000" },
                        ].map((b) => (
                            <div key={b.label}>
                                <div className="px-bar-label">{b.label}</div>
                                <div className="px-bar-outer">
                                    <div className="px-bar-inner" style={{ width: `${b.pct}%`, background: b.color }} />
                                    <div className="px-bar-text">{b.val}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="px-two-col">
                        {/* LEFT */}
                        <div>
                            <div className="px-section-header">► STATS</div>
                            {attributes.map((attr) => (
                                <AttributeBox key={attr.stat} attr={attr} styles={{
                                    box: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #222", textAlign: "left" },
                                    statLabel: { fontSize: "0.36rem", color: "#aaaaaa", display: "inline" },
                                    statValue: { fontSize: "0.48rem", color: "#ffdd00", display: "inline" },
                                    skillName: { display: "none" },
                                    tooltip: { background: "rgba(0,0,30,0.97)", border: "2px solid #4488ff", fontFamily: "'Press Start 2P',monospace", fontSize: "0.45rem" },
                                }} />
                            ))}

                            <div className="px-section-header">► SKILLS</div>
                            {skills.map((sk) => (
                                <div key={sk.id} style={{ marginBottom: 10 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                        <span style={{ fontSize: "0.32rem", color: "#e8e8e8" }}>{sk.nome}</span>
                                        <span style={{ fontSize: "0.32rem", color: "#ffdd00" }}>{sk.nivel * 20}%</span>
                                    </div>
                                    <div style={{ background: "#222", border: "1px solid #444", height: 7 }}>
                                        <div style={{ height: "100%", width: `${sk.nivel * 20}%`, background: sk.nivel >= 4 ? "#ffdd00" : sk.nivel >= 3 ? "#33cc44" : "#4488ff" }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* RIGHT */}
                        <div>
                            <div className="px-section-header">► QUEST LOG</div>
                            {experience.map((ex) => (
                                <div className="px-quest-block" key={ex.id}>
                                    <div className="px-quest-role">◆ {ex.role}</div>
                                    <div className="px-quest-meta">{ex.company} · {ex.period}</div>
                                    {ex.desc && <div className="px-quest-desc">{ex.desc}</div>}
                                </div>
                            ))}

                            <div className="px-section-header">► LEARNED SPELLS</div>
                            {education.map((ed) => (
                                <div className="px-edu-block" key={ed.id}>
                                    <span style={{ fontSize: 16, flexShrink: 0 }}>📖</span>
                                    <div>
                                        <div className="px-edu-degree">{ed.degree}</div>
                                        <div className="px-edu-inst">{ed.institution}</div>
                                        <div className="px-edu-period">{ed.period}</div>
                                        {ed.obs && <div className="px-edu-obs">{ed.obs}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="px-footer">▼ PRESS START TO HIRE ▼<div className="px-cursor" /></div>
                </div>
            </div>
        </>
    );
}

// ============================================================
// THEME: DARK FANTASY / SOULS-LIKE
// ============================================================
function DarkTheme({ data }) {
    const { personal, skills, experience, education, attributes } = data;

    const css = `
    @import url('https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=IM+Fell+English:ital@0;1&display=swap');
    .dk-wrap * { box-sizing:border-box; margin:0; padding:0; }
    .dk-wrap { font-family:'IM Fell English',serif; background:#0d0d0d; background-image:radial-gradient(ellipse at 30% 20%,rgba(80,10,10,0.4) 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,rgba(40,5,5,0.3) 0%,transparent 50%); color:#c8b89a; padding:3rem; max-width:900px; margin:0 auto; border:1px solid #3a2010; box-shadow:0 0 0 1px #1a0a05,0 0 80px rgba(150,30,10,0.15),inset 0 0 100px rgba(0,0,0,0.8); position:relative; }
    .dk-wrap::before { content:''; position:absolute; inset:12px; border:1px solid rgba(200,100,30,0.15); pointer-events:none; }
    .dk-name { font-family:'UnifrakturMaguntia',cursive; font-size:2.8rem; color:#cc3300; text-shadow:0 0 20px rgba(200,50,10,0.5),0 2px 4px #000; line-height:1; margin-bottom:4px; }
    .dk-subtitle { font-size:0.85rem; color:#8b6040; font-style:italic; letter-spacing:2px; margin-bottom:0.6rem; }
    .dk-meta { font-size:0.8rem; color:#6b4828; display:flex; flex-wrap:wrap; gap:0.6rem 1.2rem; }
    .dk-meta a { color:#8b6040; text-decoration:none; border-bottom:1px dotted #5a3020; }
    .dk-divider { display:flex; align-items:center; gap:1rem; margin:1.2rem 0; }
    .dk-divider-line { flex:1; height:1px; background:linear-gradient(90deg,transparent,#5a2010,transparent); }
    .dk-divider-icon { color:#cc3300; font-size:14px; }
    .dk-summary { font-size:0.85rem; line-height:1.7; color:#8b6040; font-style:italic; margin-bottom:0.5rem; }
    .dk-section-title { font-size:0.68rem; letter-spacing:4px; text-transform:uppercase; color:#cc3300; margin:1.5rem 0 1rem; opacity:0.9; }
    .dk-two-col { display:grid; grid-template-columns:1fr 2fr; gap:2.5rem; }
    .dk-skill-row { margin-bottom:12px; }
    .dk-skill-name-txt { font-size:0.82rem; color:#c8b89a; display:flex; justify-content:space-between; margin-bottom:5px; }
    .dk-skill-track { display:flex; gap:3px; }
    .dk-quest { margin-bottom:1.5rem; padding:1rem; border:1px solid rgba(90,40,10,0.4); background:rgba(10,5,2,0.5); position:relative; }
    .dk-quest::before { content:''; position:absolute; top:0; left:0; width:3px; height:100%; background:linear-gradient(180deg,#cc3300,transparent); }
    .dk-quest-role { font-size:1rem; color:#c8b89a; margin-bottom:3px; }
    .dk-quest-company { font-size:0.78rem; color:#8b6040; font-style:italic; margin-bottom:3px; }
    .dk-quest-period { font-size:0.68rem; color:#5a3a20; letter-spacing:1px; margin-bottom:6px; }
    .dk-quest-desc { font-size:0.82rem; line-height:1.7; color:#9a8060; }
    .dk-edu { display:flex; gap:12px; align-items:flex-start; padding:10px; border:1px solid rgba(90,40,10,0.3); margin-bottom:8px; background:rgba(10,5,2,0.4); }
    .dk-edu-degree { font-size:0.85rem; color:#c8b89a; margin-bottom:2px; }
    .dk-edu-inst { font-size:0.75rem; color:#8b6040; font-style:italic; }
    .dk-edu-period { font-size:0.68rem; color:#5a3a20; }
    .dk-edu-obs { font-size:0.72rem; color:#6b4828; font-style:italic; margin-top:2px; }
    .dk-bonfire { text-align:center; margin-top:2rem; padding-top:1.5rem; border-top:1px solid rgba(90,40,10,0.3); font-size:0.62rem; letter-spacing:4px; color:#5a3020; text-transform:uppercase; }
  `;

    return (
        <>
            <style>{css}</style>
            <div className="dk-wrap">
                <div className="dk-name">{personal.name}</div>
                <div className="dk-subtitle">{personal.title} · {personal.yearsExp} {personal.yearsExp === 1 ? "Ano" : "Anos"} de Provação</div>
                <div className="dk-meta">
                    {personal.location && <span>☽ {personal.location}</span>}
                    {personal.email && <span>✦ {personal.email}</span>}
                    {personal.phone && <span>⚰ {personal.phone}</span>}
                    {personal.link && <span>🔗 <a href={personal.link} target="_blank" rel="noreferrer">{personal.link.replace(/^https?:\/\//, "")}</a></span>}
                </div>

                {personal.summary && (
                    <>
                        <div className="dk-divider"><div className="dk-divider-line" /><div className="dk-divider-icon">☩</div><div className="dk-divider-line" /></div>
                        <div className="dk-summary">"{personal.summary}"</div>
                    </>
                )}

                <div className="dk-divider"><div className="dk-divider-line" /><div className="dk-divider-icon">☩</div><div className="dk-divider-line" /></div>

                <div className="dk-two-col">
                    {/* LEFT */}
                    <div>
                        <div className="dk-section-title">— Atributos —</div>
                        {attributes.map((attr) => (
                            <AttributeBox key={attr.stat} attr={attr} styles={{
                                box: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(90,40,10,0.3)", textAlign: "left" },
                                statLabel: { fontSize: "0.75rem", color: "#8b6040", fontStyle: "italic", display: "inline" },
                                statValue: { fontSize: "1rem", color: "#c8b89a", display: "inline" },
                                skillName: { display: "none" },
                                tooltip: { background: "rgba(5,0,0,0.97)", border: "1px solid rgba(204,51,0,0.6)", color: "#c8b89a" },
                            }} />
                        ))}

                        <div className="dk-section-title" style={{ marginTop: "1.8rem" }}>— Magias —</div>
                        {skills.map((sk) => (
                            <div className="dk-skill-row" key={sk.id}>
                                <div className="dk-skill-name-txt">
                                    <span>{sk.nome}</span>
                                    <span style={{ color: "#cc3300", fontSize: "0.7rem" }}>{SKILL_LABELS[sk.nivel]}</span>
                                </div>
                                <div className="dk-skill-track">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} style={{ height: 4, flex: 1, background: i < sk.nivel ? "#cc3300" : "#1a0a05", border: `1px solid ${i < sk.nivel ? "#cc3300" : "#3a1a0a"}` }} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* RIGHT */}
                    <div>
                        <div className="dk-section-title">— Batalhas Travadas —</div>
                        {experience.map((ex) => (
                            <div className="dk-quest" key={ex.id}>
                                <div className="dk-quest-role">{ex.role}</div>
                                <div className="dk-quest-company">{ex.company}</div>
                                <div className="dk-quest-period">{ex.period}</div>
                                {ex.desc && <div className="dk-quest-desc">{ex.desc}</div>}
                            </div>
                        ))}

                        <div className="dk-section-title">— Conhecimentos Adquiridos —</div>
                        {education.map((ed) => (
                            <div className="dk-edu" key={ed.id}>
                                <span style={{ fontSize: 20, flexShrink: 0 }}>🕯</span>
                                <div>
                                    <div className="dk-edu-degree">{ed.degree}</div>
                                    <div className="dk-edu-inst">{ed.institution}</div>
                                    <div className="dk-edu-period">{ed.period}</div>
                                    {ed.obs && <div className="dk-edu-obs">{ed.obs}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dk-bonfire">🔥 &nbsp; acenda a chama · a jornada continua &nbsp; 🔥</div>
            </div>
        </>
    );
}

// ============================================================
// THEME: STEAMPUNK
// ============================================================
function SteampunkTheme({ data }) {
    const { personal, skills, experience, education, attributes } = data;

    const css = `
    @import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=Josefin+Slab:wght@400;700&display=swap');
    .sp-wrap * { box-sizing:border-box; margin:0; padding:0; }
    .sp-wrap { font-family:'Special Elite',serif; background:#1a1208; background-image:repeating-linear-gradient(45deg,rgba(139,90,30,0.03) 0px,rgba(139,90,30,0.03) 1px,transparent 1px,transparent 8px),repeating-linear-gradient(-45deg,rgba(139,90,30,0.03) 0px,rgba(139,90,30,0.03) 1px,transparent 1px,transparent 8px); color:#d4b896; padding:2.5rem; max-width:900px; margin:0 auto; border:3px solid #8b5e14; box-shadow:inset 0 0 60px rgba(139,90,30,0.1),0 0 0 1px #4a3008,0 0 40px rgba(0,0,0,0.6); position:relative; }
    .sp-rivet { width:16px; height:16px; border-radius:50%; background:radial-gradient(circle at 35% 35%,#e8c060,#8b5e14); border:2px solid #5a3a08; position:absolute; }
    .sp-name { font-family:'Josefin Slab',serif; font-size:1.9rem; font-weight:700; color:#e8c060; letter-spacing:4px; text-transform:uppercase; margin-bottom:2px; line-height:1; }
    .sp-subtitle { font-family:'Special Elite',serif; font-size:0.78rem; color:#a07840; letter-spacing:3px; text-transform:uppercase; margin-bottom:0.6rem; }
    .sp-meta { font-size:0.8rem; color:#8b6840; display:flex; flex-wrap:wrap; gap:0.5rem 1.2rem; }
    .sp-meta a { color:#a07840; text-decoration:none; border-bottom:1px dotted #5a3a10; }
    .sp-summary { font-size:0.84rem; line-height:1.7; color:#a08860; font-style:italic; margin-top:0.8rem; }
    .sp-gear-title { font-family:'Josefin Slab',serif; font-size:0.65rem; letter-spacing:4px; text-transform:uppercase; color:#e8c060; margin:1.5rem 0 1rem; display:flex; align-items:center; gap:8px; }
    .sp-gear-title::before { content:'⚙'; font-size:14px; }
    .sp-two-col { display:grid; grid-template-columns:1fr 2fr; gap:2rem; }
    .sp-gauge { margin-bottom:14px; }
    .sp-gauge-header { display:flex; justify-content:space-between; margin-bottom:4px; }
    .sp-gauge-name { font-size:0.76rem; color:#d4b896; }
    .sp-gauge-pct { font-family:'Josefin Slab',serif; font-size:0.65rem; color:#e8c060; }
    .sp-gauge-outer { border:1px solid #8b5e14; height:12px; background:#0a0800; position:relative; }
    .sp-gauge-fill { height:100%; background:linear-gradient(90deg,#4a2808,#e8c060); position:relative; }
    .sp-gauge-fill::after { content:''; position:absolute; right:0; top:0; bottom:0; width:2px; background:#fff8e0; }
    .sp-gauge-notches { position:absolute; inset:0; display:flex; }
    .sp-gauge-notch { flex:1; border-right:1px solid rgba(139,94,20,0.3); }
    .sp-log { border-left:2px solid #8b5e14; padding-left:1rem; margin-bottom:1.2rem; position:relative; }
    .sp-log::before { content:'⚙'; position:absolute; left:-10px; top:0; font-size:12px; color:#8b5e14; background:#1a1208; line-height:1; }
    .sp-log-role { font-family:'Josefin Slab',serif; font-size:0.9rem; font-weight:700; color:#e8c060; margin-bottom:2px; text-transform:uppercase; letter-spacing:1px; }
    .sp-log-company { font-size:0.76rem; color:#a07840; font-style:italic; margin-bottom:3px; }
    .sp-log-period { font-family:'Josefin Slab',serif; font-size:0.6rem; letter-spacing:2px; color:#6b4820; text-transform:uppercase; margin-bottom:5px; }
    .sp-log-desc { font-size:0.8rem; line-height:1.7; color:#a08860; }
    .sp-blueprint { display:flex; gap:10px; padding:10px; border:1px dashed #5a3a10; margin-bottom:8px; background:rgba(10,8,0,0.5); }
    .sp-blueprint-degree { font-size:0.8rem; color:#d4b896; margin-bottom:2px; }
    .sp-blueprint-inst { font-size:0.7rem; color:#8b6840; font-style:italic; }
    .sp-blueprint-period { font-family:'Josefin Slab',serif; font-size:0.6rem; color:#e8c060; letter-spacing:2px; text-transform:uppercase; }
    .sp-blueprint-obs { font-size:0.68rem; color:#6b4820; font-style:italic; margin-top:2px; }
    .sp-footer { text-align:center; margin-top:1.5rem; padding-top:1rem; border-top:2px solid #4a3008; font-family:'Josefin Slab',serif; font-size:0.6rem; letter-spacing:4px; color:#6b4820; text-transform:uppercase; }
  `;

    return (
        <>
            <style>{css}</style>
            <div className="sp-wrap">
                {[{ top: 10, left: 10 }, { top: 10, right: 10 }, { bottom: 10, left: 10 }, { bottom: 10, right: 10 }].map((pos, i) => (
                    <div key={i} className="sp-rivet" style={pos} />
                ))}

                {/* Header */}
                <div style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "2px solid #4a3008" }}>
                    <div className="sp-name">{personal.name}</div>
                    <div className="sp-subtitle">{personal.title} · Mestre Artífice · {personal.yearsExp} anos de ofício</div>
                    <div className="sp-meta">
                        {personal.location && <span>◈ {personal.location}</span>}
                        {personal.email && <span>◈ {personal.email}</span>}
                        {personal.phone && <span>◈ {personal.phone}</span>}
                        {personal.link && <span>◈ <a href={personal.link} target="_blank" rel="noreferrer">{personal.link.replace(/^https?:\/\//, "")}</a></span>}
                    </div>
                    {personal.summary && <div className="sp-summary">"{personal.summary}"</div>}
                </div>

                {/* Attribute gauges */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: "1.5rem" }}>
                    {attributes.map((attr) => (
                        <AttributeBox key={attr.stat} attr={attr} styles={{
                            box: { border: "2px solid #4a3008", padding: "10px 8px", background: "rgba(10,8,0,0.5)" },
                            statLabel: { fontFamily: "'Josefin Slab',serif", fontSize: "0.58rem", color: "#a07840", letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 4 },
                            statValue: { fontFamily: "'Josefin Slab',serif", fontSize: "1.3rem", color: "#e8c060", fontWeight: 700, lineHeight: 1, display: "block" },
                            skillName: { fontFamily: "'Special Elite',serif", fontSize: "0.62rem", color: "#6b4820", display: "block", marginTop: 3 },
                            tooltip: { background: "rgba(10,6,0,0.97)", border: "1px solid #8b5e14", color: "#d4b896", fontFamily: "'Special Elite',serif" },
                        }} />
                    ))}
                </div>

                <div className="sp-two-col">
                    {/* LEFT */}
                    <div>
                        <div className="sp-gear-title">Medidores de Proficiência</div>
                        {skills.map((sk) => (
                            <div className="sp-gauge" key={sk.id}>
                                <div className="sp-gauge-header">
                                    <span className="sp-gauge-name">{sk.nome}</span>
                                    <span className="sp-gauge-pct">{sk.nivel * 20}%</span>
                                </div>
                                <div className="sp-gauge-outer">
                                    <div className="sp-gauge-fill" style={{ width: `${sk.nivel * 20}%` }} />
                                    <div className="sp-gauge-notches">
                                        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="sp-gauge-notch" />)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* RIGHT */}
                    <div>
                        <div className="sp-gear-title">Diário de Projetos</div>
                        {experience.map((ex) => (
                            <div className="sp-log" key={ex.id}>
                                <div className="sp-log-role">{ex.role}</div>
                                <div className="sp-log-company">{ex.company}</div>
                                <div className="sp-log-period">Período: {ex.period}</div>
                                {ex.desc && <div className="sp-log-desc">{ex.desc}</div>}
                            </div>
                        ))}

                        <div className="sp-gear-title">Patentes & Certificações</div>
                        {education.map((ed) => (
                            <div className="sp-blueprint" key={ed.id}>
                                <div style={{ fontSize: 20, flexShrink: 0 }}>📐</div>
                                <div>
                                    <div className="sp-blueprint-degree">{ed.degree}</div>
                                    <div className="sp-blueprint-inst">{ed.institution}</div>
                                    <div className="sp-blueprint-period">{ed.period}</div>
                                    {ed.obs && <div className="sp-blueprint-obs">{ed.obs}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="sp-footer">
                    ⚙ &nbsp; fabricado com precisão · {personal.name.split(" ")[0].toLowerCase()} & cia · ano {new Date().getFullYear()} &nbsp; ⚙
                </div>
            </div>
        </>
    );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

const THEMES = {
    medieval: { label: "⚔ Medieval", Component: MedievalTheme },
    pixel: { label: "👾 Pixel Art", Component: PixelTheme },
    dark: { label: "💀 Dark Fantasy", Component: DarkTheme },
    steampunk: { label: "⚙ Steampunk", Component: SteampunkTheme },
};

/**
 * Uso:
 *   // Passando dados da API diretamente:
 *   <RpgLayout apiData={dadosDaApi} />
 *
 *   // Sem props usa o sample interno (dev/preview):
 *   <RpgLayout />
 */
export default function RpgLayout({ data }) {
    const [activeTheme, setActiveTheme] = useState("medieval");

    const raw = data ?? API_SAMPLE;
    const viewData = adaptApiData(raw);

    const { Component } = THEMES[activeTheme];

    return (
        <div style={{ padding: "1rem", background: "#111", minHeight: "100vh" }}>
            {/* Seletor de tema */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", justifyContent: "center" }}>
                {Object.entries(THEMES).map(([id, { label }]) => (
                    <button
                        key={id}
                        onClick={() => setActiveTheme(id)}
                        style={{
                            padding: "8px 18px", fontFamily: "monospace", fontSize: "0.78rem",
                            letterSpacing: "1px", cursor: "pointer", borderRadius: 2,
                            border: activeTheme === id ? "2px solid #fff" : "2px solid #555",
                            background: activeTheme === id ? "#333" : "transparent",
                            color: activeTheme === id ? "#fff" : "#888",
                            transition: "all 0.2s",
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <Component data={viewData} />
        </div>
    );
}
