/* Procedural SVG character generator for brainrot cards.
   Each card gets a unique silhouette, face, and decoration set. */
window.BRAINROT_VISUALS = (() => {

  /* ── Body shape renderers ─────────────────────────────────────── */
  const bodyRenderers = {
    blob(cx, cy, w, h, color) {
      const hw = w / 2, hh = h / 2;
      return `<path d="M${cx} ${cy - hh}C${cx + hw + 6} ${cy - hh - 4},${cx + hw + 4} ${cy + hh / 2},${cx + hw / 3} ${cy + hh}C${cx + hw / 6} ${cy + hh + 6},${cx - hw / 6} ${cy + hh + 6},${cx - hw / 3} ${cy + hh}C${cx - hw - 4} ${cy + hh / 2},${cx - hw - 6} ${cy - hh - 4},${cx} ${cy - hh}Z" fill="${color}"/>`;
    },
    rect(cx, cy, w, h, color) {
      return `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="12" fill="${color}"/>`;
    },
    circle(cx, cy, w, h, color) {
      const r = Math.min(w, h) / 2;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;
    },
    triangle(cx, cy, w, h, color) {
      return `<path d="M${cx} ${cy - h / 2}L${cx + w / 2} ${cy + h / 2}Q${cx} ${cy + h / 2 + 6},${cx - w / 2} ${cy + h / 2}Z" fill="${color}"/>`;
    },
    tall(cx, cy, w, h, color) {
      const nw = w * 0.62;
      return `<rect x="${cx - nw / 2}" y="${cy - h / 2}" width="${nw}" height="${h}" rx="16" fill="${color}"/>`;
    },
    wide(cx, cy, w, h, color) {
      const nh = h * 0.58;
      return `<rect x="${cx - w / 2}" y="${cy - nh / 2}" width="${w}" height="${nh}" rx="14" fill="${color}"/>`;
    },
    star(cx, cy, w, h, color) {
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const a1 = (i * 72 - 90) * Math.PI / 180;
        const a2 = ((i * 72) + 36 - 90) * Math.PI / 180;
        pts.push(`${cx + Math.cos(a1) * w / 2},${cy + Math.sin(a1) * h / 2}`);
        pts.push(`${cx + Math.cos(a2) * w / 4},${cy + Math.sin(a2) * h / 4}`);
      }
      return `<polygon points="${pts.join(" ")}" fill="${color}"/>`;
    },
    drop(cx, cy, w, h, color) {
      return `<path d="M${cx} ${cy - h / 2}Q${cx + w / 4} ${cy - h / 6},${cx + w / 2} ${cy + h / 6}Q${cx + w / 2} ${cy + h / 2},${cx} ${cy + h / 2}Q${cx - w / 2} ${cy + h / 2},${cx - w / 2} ${cy + h / 6}Q${cx - w / 4} ${cy - h / 6},${cx} ${cy - h / 2}Z" fill="${color}"/>`;
    },
    hex(cx, cy, w, h, color) {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * 60 - 90) * Math.PI / 180;
        pts.push(`${cx + Math.cos(a) * w / 2},${cy + Math.sin(a) * h / 2}`);
      }
      return `<polygon points="${pts.join(" ")}" fill="${color}"/>`;
    },
    bean(cx, cy, w, h, color) {
      return `<path d="M${cx - w / 3} ${cy - h / 2}Q${cx + w / 2} ${cy - h / 2 - 10},${cx + w / 3} ${cy}Q${cx + w / 2} ${cy + h / 2 + 10},${cx - w / 3} ${cy + h / 2}Q${cx - w / 2} ${cy + h / 4},${cx - w / 3} ${cy - h / 2}Z" fill="${color}"/>`;
    },
    diamond(cx, cy, w, h, color) {
      return `<path d="M${cx} ${cy - h / 2}L${cx + w / 2} ${cy}L${cx} ${cy + h / 2}L${cx - w / 2} ${cy}Z" fill="${color}"/>`;
    },
    cloud(cx, cy, w, h, color) {
      const r1 = w * 0.26, r2 = w * 0.22, r3 = w * 0.2;
      return `<circle cx="${cx - w * 0.18}" cy="${cy + h * 0.12}" r="${r1}" fill="${color}"/>` +
        `<circle cx="${cx + w * 0.16}" cy="${cy + h * 0.1}" r="${r2}" fill="${color}"/>` +
        `<circle cx="${cx}" cy="${cy - h * 0.12}" r="${r3 + 2}" fill="${color}"/>` +
        `<circle cx="${cx + w * 0.3}" cy="${cy - h * 0.05}" r="${r3 - 1}" fill="${color}"/>` +
        `<circle cx="${cx - w * 0.28}" cy="${cy - h * 0.02}" r="${r3}" fill="${color}"/>` +
        `<rect x="${cx - w * 0.38}" y="${cy}" width="${w * 0.76}" height="${h * 0.28}" rx="4" fill="${color}"/>`;
    }
  };

  /* ── Face renderers ───────────────────────────────────────────── */
  const faceRenderers = {
    happy(cx, fy, sp, fc, bg) {
      return `<circle cx="${cx - sp}" cy="${fy}" r="4" fill="${fc}"/>` +
        `<circle cx="${cx + sp}" cy="${fy}" r="4" fill="${fc}"/>` +
        `<path d="M${cx - 8} ${fy + 10}Q${cx} ${fy + 18},${cx + 8} ${fy + 10}" stroke="${fc}" fill="none" stroke-width="2.5" stroke-linecap="round"/>`;
    },
    angry(cx, fy, sp, fc) {
      return `<circle cx="${cx - sp}" cy="${fy}" r="3.5" fill="${fc}"/>` +
        `<circle cx="${cx + sp}" cy="${fy}" r="3.5" fill="${fc}"/>` +
        `<line x1="${cx - sp - 5}" y1="${fy - 9}" x2="${cx - sp + 4}" y2="${fy - 5}" stroke="${fc}" stroke-width="2.8" stroke-linecap="round"/>` +
        `<line x1="${cx + sp + 5}" y1="${fy - 9}" x2="${cx + sp - 4}" y2="${fy - 5}" stroke="${fc}" stroke-width="2.8" stroke-linecap="round"/>` +
        `<path d="M${cx - 7} ${fy + 14}Q${cx} ${fy + 8},${cx + 7} ${fy + 14}" stroke="${fc}" fill="none" stroke-width="2.5" stroke-linecap="round"/>`;
    },
    crazy(cx, fy, sp, fc, bg) {
      return `<circle cx="${cx - sp}" cy="${fy}" r="6" fill="${fc}"/>` +
        `<circle cx="${cx - sp}" cy="${fy}" r="2.5" fill="${bg}"/>` +
        `<circle cx="${cx + sp}" cy="${fy - 2}" r="3.5" fill="${fc}"/>` +
        `<path d="M${cx - 10} ${fy + 12}L${cx - 4} ${fy + 8}L${cx + 4} ${fy + 14}L${cx + 10} ${fy + 10}" stroke="${fc}" fill="none" stroke-width="2" stroke-linecap="round"/>`;
    },
    chill(cx, fy, sp, fc) {
      return `<path d="M${cx - sp - 4} ${fy}Q${cx - sp} ${fy + 5},${cx - sp + 4} ${fy}" stroke="${fc}" fill="none" stroke-width="2.5" stroke-linecap="round"/>` +
        `<path d="M${cx + sp - 4} ${fy}Q${cx + sp} ${fy + 5},${cx + sp + 4} ${fy}" stroke="${fc}" fill="none" stroke-width="2.5" stroke-linecap="round"/>` +
        `<path d="M${cx - 5} ${fy + 12}Q${cx} ${fy + 15},${cx + 5} ${fy + 12}" stroke="${fc}" fill="none" stroke-width="2" stroke-linecap="round"/>`;
    },
    shocked(cx, fy, sp, fc, bg) {
      return `<circle cx="${cx - sp}" cy="${fy}" r="6" fill="${fc}"/>` +
        `<circle cx="${cx - sp}" cy="${fy}" r="3" fill="${bg}"/>` +
        `<circle cx="${cx + sp}" cy="${fy}" r="6" fill="${fc}"/>` +
        `<circle cx="${cx + sp}" cy="${fy}" r="3" fill="${bg}"/>` +
        `<circle cx="${cx}" cy="${fy + 14}" r="5" fill="${fc}"/>` +
        `<circle cx="${cx}" cy="${fy + 14}" r="3" fill="${bg}"/>`;
    },
    evil(cx, fy, sp, fc) {
      return `<path d="M${cx - sp - 4} ${fy}L${cx - sp + 4} ${fy - 2}" stroke="${fc}" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M${cx + sp - 4} ${fy - 2}L${cx + sp + 4} ${fy}" stroke="${fc}" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M${cx - 10} ${fy + 10}L${cx - 6} ${fy + 14}L${cx - 2} ${fy + 10}L${cx + 2} ${fy + 14}L${cx + 6} ${fy + 10}L${cx + 10} ${fy + 14}" stroke="${fc}" fill="none" stroke-width="2" stroke-linecap="round"/>`;
    },
    derp(cx, fy, sp, fc, bg) {
      return `<circle cx="${cx - sp}" cy="${fy - 3}" r="5" fill="${fc}"/>` +
        `<circle cx="${cx - sp + 2}" cy="${fy - 4}" r="2" fill="${bg}"/>` +
        `<circle cx="${cx + sp}" cy="${fy + 2}" r="4" fill="${fc}"/>` +
        `<circle cx="${cx + sp - 1}" cy="${fy + 1}" r="2" fill="${bg}"/>` +
        `<path d="M${cx - 4} ${fy + 14}Q${cx + 4} ${fy + 18},${cx + 8} ${fy + 12}" stroke="${fc}" fill="none" stroke-width="2.5" stroke-linecap="round"/>`;
    },
    sleepy(cx, fy, sp, fc, bg) {
      return `<line x1="${cx - sp - 4}" y1="${fy}" x2="${cx - sp + 4}" y2="${fy}" stroke="${fc}" stroke-width="2.5" stroke-linecap="round"/>` +
        `<line x1="${cx + sp - 4}" y1="${fy}" x2="${cx + sp + 4}" y2="${fy}" stroke="${fc}" stroke-width="2.5" stroke-linecap="round"/>` +
        `<ellipse cx="${cx + 2}" cy="${fy + 14}" rx="4" ry="5" fill="${fc}"/>` +
        `<ellipse cx="${cx + 2}" cy="${fy + 14}" rx="2.5" ry="3.5" fill="${bg}"/>`;
    }
  };

  /* ── Decoration renderers ─────────────────────────────────────── */
  const decoRenderers = {
    antenna(cx, cy, h, ac) {
      const top = cy - h / 2;
      return `<line x1="${cx}" y1="${top}" x2="${cx}" y2="${top - 14}" stroke="${ac}" stroke-width="2.5"/>` +
        `<circle cx="${cx}" cy="${top - 16}" r="3.5" fill="${ac}"/>`;
    },
    horns(cx, cy, h, ac) {
      const top = cy - h / 2;
      return `<path d="M${cx - 10} ${top}L${cx - 16} ${top - 16}" stroke="${ac}" stroke-width="3.5" stroke-linecap="round"/>` +
        `<path d="M${cx + 10} ${top}L${cx + 16} ${top - 16}" stroke="${ac}" stroke-width="3.5" stroke-linecap="round"/>`;
    },
    crown(cx, cy, h, ac) {
      const top = cy - h / 2 - 2;
      return `<path d="M${cx - 14} ${top}L${cx - 10} ${top - 14}L${cx} ${top - 6}L${cx + 10} ${top - 14}L${cx + 14} ${top}Z" fill="${ac}"/>`;
    },
    wings(cx, cy, w, h, ac) {
      return `<path d="M${cx - w / 2 - 2} ${cy - 4}Q${cx - w / 2 - 20} ${cy - 18},${cx - w / 2 - 8} ${cy + 8}" fill="${ac}" opacity=".65"/>` +
        `<path d="M${cx + w / 2 + 2} ${cy - 4}Q${cx + w / 2 + 20} ${cy - 18},${cx + w / 2 + 8} ${cy + 8}" fill="${ac}" opacity=".65"/>`;
    },
    legs(cx, cy, w, h, ac) {
      const bot = cy + h / 2;
      return `<line x1="${cx - 8}" y1="${bot}" x2="${cx - 12}" y2="${bot + 14}" stroke="${ac}" stroke-width="3" stroke-linecap="round"/>` +
        `<line x1="${cx + 8}" y1="${bot}" x2="${cx + 12}" y2="${bot + 14}" stroke="${ac}" stroke-width="3" stroke-linecap="round"/>`;
    },
    arms(cx, cy, w, h, ac) {
      return `<line x1="${cx - w / 2}" y1="${cy}" x2="${cx - w / 2 - 14}" y2="${cy + 10}" stroke="${ac}" stroke-width="3" stroke-linecap="round"/>` +
        `<line x1="${cx + w / 2}" y1="${cy}" x2="${cx + w / 2 + 14}" y2="${cy + 10}" stroke="${ac}" stroke-width="3" stroke-linecap="round"/>`;
    },
    lightning(cx, cy, w, h, ac) {
      return `<path d="M${cx + w / 2 + 8} ${cy - h / 3}L${cx + w / 2 + 14} ${cy - 2}L${cx + w / 2 + 10} ${cy}L${cx + w / 2 + 16} ${cy + h / 3}" stroke="${ac}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    },
    sparkle(cx, cy, w, h, ac) {
      const sx = cx - w / 2 - 10, sy = cy - h / 3;
      return `<path d="M${sx} ${sy - 6}L${sx + 2} ${sy - 1}L${sx + 7} ${sy}L${sx + 2} ${sy + 1}L${sx} ${sy + 6}L${sx - 2} ${sy + 1}L${sx - 7} ${sy}L${sx - 2} ${sy - 1}Z" fill="${ac}"/>` +
        `<path d="M${cx + w / 2 + 10} ${cy + h / 4 - 5}L${cx + w / 2 + 12} ${cy + h / 4 - 1}L${cx + w / 2 + 16} ${cy + h / 4}L${cx + w / 2 + 12} ${cy + h / 4 + 1}L${cx + w / 2 + 10} ${cy + h / 4 + 5}L${cx + w / 2 + 8} ${cy + h / 4 + 1}L${cx + w / 2 + 4} ${cy + h / 4}L${cx + w / 2 + 8} ${cy + h / 4 - 1}Z" fill="${ac}" opacity=".7"/>`;
    },
    flames(cx, cy, w, h, ac) {
      const bot = cy + h / 2;
      return `<path d="M${cx - 8} ${bot}Q${cx - 12} ${bot + 10},${cx - 6} ${bot + 16}Q${cx - 4} ${bot + 10},${cx} ${bot + 14}Q${cx + 4} ${bot + 10},${cx + 6} ${bot + 16}Q${cx + 12} ${bot + 10},${cx + 8} ${bot}" fill="${ac}" opacity=".75"/>`;
    },
    hat(cx, cy, h, ac) {
      const top = cy - h / 2;
      return `<rect x="${cx - 16}" y="${top - 2}" width="32" height="4" rx="2" fill="${ac}"/>` +
        `<rect x="${cx - 8}" y="${top - 18}" width="16" height="18" rx="3" fill="${ac}"/>`;
    },
    sword(cx, cy, w, h, ac) {
      return `<line x1="${cx + w / 2 + 4}" y1="${cy + 4}" x2="${cx + w / 2 + 22}" y2="${cy - 14}" stroke="${ac}" stroke-width="3" stroke-linecap="round"/>` +
        `<line x1="${cx + w / 2 + 6}" y1="${cy + 2}" x2="${cx + w / 2 + 14}" y2="${cy + 6}" stroke="${ac}" stroke-width="2.5" stroke-linecap="round"/>`;
    },
    tail(cx, cy, w, h, ac) {
      return `<path d="M${cx + w / 2 - 4} ${cy + h / 3}Q${cx + w / 2 + 16} ${cy + h / 2 + 6},${cx + w / 2 + 8} ${cy + h / 2 + 16}" stroke="${ac}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    },
    scarf(cx, cy, w, h, ac) {
      return `<path d="M${cx - w / 2 + 2} ${cy - h / 6}Q${cx} ${cy - h / 6 + 6},${cx + w / 2 - 2} ${cy - h / 6}" stroke="${ac}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
        `<line x1="${cx + w / 2 - 6}" y1="${cy - h / 6}" x2="${cx + w / 2}" y2="${cy + h / 6}" stroke="${ac}" stroke-width="4" stroke-linecap="round"/>`;
    },
    mask(cx, fy, sp, ac) {
      return `<rect x="${cx - sp - 7}" y="${fy - 6}" width="${sp * 2 + 14}" height="12" rx="6" fill="${ac}" opacity=".85"/>` +
        `<circle cx="${cx - sp}" cy="${fy}" r="4" fill="#fff"/>` +
        `<circle cx="${cx + sp}" cy="${fy}" r="4" fill="#fff"/>`;
    },
    spots(cx, cy, w, h, ac) {
      return `<circle cx="${cx - w / 4}" cy="${cy - h / 5}" r="3" fill="${ac}" opacity=".4"/>` +
        `<circle cx="${cx + w / 5}" cy="${cy + h / 6}" r="4" fill="${ac}" opacity=".35"/>` +
        `<circle cx="${cx + w / 4}" cy="${cy - h / 4}" r="2.5" fill="${ac}" opacity=".3"/>`;
    },
    stripes(cx, cy, w, h, ac) {
      const top = cy - h / 4;
      return `<line x1="${cx - w / 3}" y1="${top}" x2="${cx + w / 3}" y2="${top}" stroke="${ac}" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>` +
        `<line x1="${cx - w / 3}" y1="${top + 8}" x2="${cx + w / 3}" y2="${top + 8}" stroke="${ac}" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>` +
        `<line x1="${cx - w / 3}" y1="${top + 16}" x2="${cx + w / 3}" y2="${top + 16}" stroke="${ac}" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>`;
    }
  };

  /* ── Per-brainrot visual specifications ───────────────────────── */
  const visualSpecs = {
    "br-pigeon-turbo":       { shape: "drop",    w: 44, h: 54, face: "crazy",   bg: "#E8F4FD", body: "#5DADE2", fc: "#1B4F72", accent: "#F39C12", decos: ["wings", "lightning"] },
    "br-banane-nucleaire":   { shape: "tall",    w: 36, h: 64, face: "evil",    bg: "#FFF9C4", body: "#F9E44C", fc: "#4A4A22", accent: "#76FF03", decos: ["sparkle", "flames"] },
    "br-grille-pain-possede":{ shape: "rect",    w: 52, h: 42, face: "angry",   bg: "#FFEBEE", body: "#E57373", fc: "#B71C1C", accent: "#FF6F00", decos: ["horns", "flames"] },
    "br-chaussette-laser":   { shape: "tall",    w: 30, h: 62, face: "shocked", bg: "#F3E5F5", body: "#BA68C8", fc: "#4A148C", accent: "#00E5FF", decos: ["lightning"] },
    "br-biscuit-orbitale":   { shape: "circle",  w: 52, h: 52, face: "chill",   bg: "#FFF3E0", body: "#FFB74D", fc: "#4E342E", accent: "#90CAF9", decos: ["sparkle", "spots"] },
    "br-cactus-disco":       { shape: "tall",    w: 34, h: 58, face: "happy",   bg: "#E8F5E9", body: "#66BB6A", fc: "#1B5E20", accent: "#E040FB", decos: ["sparkle", "arms"] },
    "br-canape-toxique":     { shape: "wide",    w: 62, h: 38, face: "sleepy",  bg: "#E0F2F1", body: "#80CBC4", fc: "#004D40", accent: "#EEFF41", decos: ["legs", "spots"] },
    "br-micro-onde-gobelin": { shape: "rect",    w: 50, h: 44, face: "evil",    bg: "#FBE9E7", body: "#8D6E63", fc: "#3E2723", accent: "#69F0AE", decos: ["antenna", "sparkle"] },
    "br-patate-satellite":   { shape: "blob",    w: 50, h: 46, face: "derp",    bg: "#EFEBE9", body: "#D7CCC8", fc: "#3E2723", accent: "#42A5F5", decos: ["antenna"] },
    "br-lama-wifi":          { shape: "tall",    w: 38, h: 60, face: "chill",   bg: "#EDE7F6", body: "#B39DDB", fc: "#311B92", accent: "#00E676", decos: ["antenna", "scarf"] },
    "br-cornichon-plasma":   { shape: "tall",    w: 28, h: 62, face: "crazy",   bg: "#F1F8E9", body: "#AED581", fc: "#33691E", accent: "#D500F9", decos: ["lightning", "sparkle"] },
    "br-croissant-mutant":   { shape: "bean",    w: 52, h: 44, face: "happy",   bg: "#FFF8E1", body: "#FFD54F", fc: "#5D4037", accent: "#FF5252", decos: ["arms", "legs"] },
    "br-mouette-cyberpunk":  { shape: "triangle",w: 48, h: 52, face: "evil",    bg: "#E3F2FD", body: "#64B5F6", fc: "#0D47A1", accent: "#F50057", decos: ["wings", "mask"] },
    "br-frigo-karate":       { shape: "rect",    w: 42, h: 60, face: "angry",   bg: "#E8EAF6", body: "#9FA8DA", fc: "#1A237E", accent: "#FF1744", decos: ["arms", "scarf"] },
    "br-kebab-quantique":    { shape: "drop",    w: 40, h: 58, face: "shocked", bg: "#FFF3E0", body: "#FF8A65", fc: "#BF360C", accent: "#7C4DFF", decos: ["sparkle", "flames", "lightning"] },
    "br-pneu-chaman":        { shape: "circle",  w: 56, h: 56, face: "sleepy",  bg: "#ECEFF1", body: "#78909C", fc: "#263238", accent: "#FFD740", decos: ["sparkle", "stripes"] },
    "br-dragon-peluche":     { shape: "blob",    w: 52, h: 50, face: "happy",   bg: "#FCE4EC", body: "#F48FB1", fc: "#880E4F", accent: "#B388FF", decos: ["wings", "tail", "horns"] },
    "br-clavier-fantome":    { shape: "wide",    w: 58, h: 34, face: "shocked", bg: "#E8EAF6", body: "#C5CAE9", fc: "#283593", accent: "#00E5FF", decos: ["sparkle", "lightning"] },
    "br-pizza-galactique":   { shape: "triangle",w: 54, h: 52, face: "chill",   bg: "#FFF8E1", body: "#FFE082", fc: "#E65100", accent: "#448AFF", decos: ["sparkle", "spots"] },
    "br-trottinette-vampire":{ shape: "tall",    w: 32, h: 56, face: "evil",    bg: "#F3E5F5", body: "#CE93D8", fc: "#4A148C", accent: "#FF1744", decos: ["scarf", "legs"] },
    "br-ananas-mecha":       { shape: "hex",     w: 50, h: 54, face: "angry",   bg: "#F9FBE7", body: "#DCE775", fc: "#33691E", accent: "#FF6D00", decos: ["crown", "arms", "stripes"] },
    "br-bonnet-sismique":    { shape: "blob",    w: 48, h: 44, face: "derp",    bg: "#E3F2FD", body: "#90CAF9", fc: "#0D47A1", accent: "#FF9100", decos: ["hat"] },
    "br-hamster-ministere":  { shape: "circle",  w: 46, h: 46, face: "happy",   bg: "#FFF8E1", body: "#FFE0B2", fc: "#4E342E", accent: "#7986CB", decos: ["scarf", "spots"] },
    "br-radiateur-shuriken": { shape: "star",    w: 52, h: 52, face: "angry",   bg: "#FFEBEE", body: "#EF9A9A", fc: "#B71C1C", accent: "#212121", decos: ["flames"] },
    "br-canard-overclock":   { shape: "blob",    w: 48, h: 48, face: "crazy",   bg: "#FFFDE7", body: "#FFF176", fc: "#F57F17", accent: "#00BCD4", decos: ["lightning", "tail"] },
    "br-sushi-volcanique":   { shape: "wide",    w: 54, h: 36, face: "shocked", bg: "#FBE9E7", body: "#FFAB91", fc: "#BF360C", accent: "#F44336", decos: ["flames", "spots"] },
    "br-brique-oracle":      { shape: "rect",    w: 54, h: 40, face: "chill",   bg: "#EFEBE9", body: "#BCAAA4", fc: "#3E2723", accent: "#7E57C2", decos: ["sparkle", "stripes"] },
    "br-manette-sorcier":    { shape: "wide",    w: 56, h: 38, face: "crazy",   bg: "#EDE7F6", body: "#9575CD", fc: "#311B92", accent: "#76FF03", decos: ["sparkle", "lightning"] },
    "br-toboggan-apocalypse":{ shape: "diamond",  w: 54, h: 56, face: "evil",   bg: "#FFF3E0", body: "#FF7043", fc: "#BF360C", accent: "#FFEA00", decos: ["flames", "lightning", "sparkle"] },
    "br-aspirateur-samourai":{ shape: "tall",    w: 40, h: 62, face: "angry",   bg: "#E8EAF6", body: "#7986CB", fc: "#1A237E", accent: "#FF1744", decos: ["sword", "scarf"] }
  };

  /* ── Main generator ───────────────────────────────────────────── */
  function generate(cardId) {
    const spec = visualSpecs[cardId];
    if (!spec) {
      return null;
    }

    const cx = 64, cy = 66;
    const { shape, w, h, face, bg, body, fc, accent, decos } = spec;
    const parts = [];

    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">`);

    // Background fill
    parts.push(`<rect width="128" height="128" rx="18" fill="${bg}"/>`);

    // Ground shadow
    parts.push(`<ellipse cx="${cx}" cy="${cy + h / 2 + 6}" rx="${w / 2 + 2}" ry="5" fill="rgba(0,0,0,.06)"/>`);

    // Body
    const bodyFn = bodyRenderers[shape] || bodyRenderers.blob;
    parts.push(bodyFn(cx, cy, w, h, body));

    // Face
    const fy = cy - h / 8;
    const eyeSpacing = w / 5;
    const faceFn = faceRenderers[face] || faceRenderers.happy;
    parts.push(faceFn(cx, fy, eyeSpacing, fc, bg));

    // Decorations
    if (decos && decos.length) {
      decos.forEach(function (decoName) {
        const fn = decoRenderers[decoName];
        if (!fn) {
          return;
        }

        if (decoName === "mask") {
          parts.push(fn(cx, fy, eyeSpacing, accent));
        } else if (decoName === "antenna" || decoName === "horns" || decoName === "crown" || decoName === "hat") {
          parts.push(fn(cx, cy, h, accent));
        } else {
          parts.push(fn(cx, cy, w, h, accent));
        }
      });
    }

    parts.push(`</svg>`);

    return `data:image/svg+xml;utf8,${encodeURIComponent(parts.join(""))}`;
  }

  return { generate, visualSpecs };
})();
