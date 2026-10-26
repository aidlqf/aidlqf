const X = 2;
const Y = 6;
const state = { w: 1, lr: 0.10, history: [1], bpMode: "forward", timer: null };
const $ = (id) => document.getElementById(id);
const prediction = (w) => w * X;
const residual = (w) => prediction(w) - Y;
const mse = (w) => residual(w) ** 2;
const gradient = (w) => 2 * residual(w) * X;
const minus = (s) => String(s).replaceAll("-", "−");
const fmt = (v, digits = 2) => minus(Number(v).toFixed(digits));
const smart = (v) => {
  const a = Math.abs(v);
  if (!Number.isFinite(v)) return "—";
  if (a >= 100000 || (a > 0 && a < 0.0001)) return minus(v.toExponential(2));
  if (a >= 1000) return fmt(v, 1);
  return fmt(v, 4);
};
const tick = (v) => {
  const a = Math.abs(v);
  if (a >= 10000) return minus(v.toExponential(0));
  if (a >= 100) return fmt(v, 0);
  if (a >= 10) return fmt(v, 1);
  return fmt(v, 2);
};
const pathFrom = (points) => points.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");

function drawLossChart(nextW) {
  const svg = $("loss-chart");
  const mobile = window.innerWidth <= 620;
  const W = mobile ? 360 : 620, H = 360, m = { l: mobile ? 44 : 58, r: mobile ? 12 : 24, t: 24, b: 48 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const allW = [...state.history, state.w, nextW, 3];
  let xMin = Math.min(-1, ...allW) - 0.35;
  let xMax = Math.max(7, ...allW) + 0.35;
  if (xMax - xMin < 4) { const mid = (xMin + xMax) / 2; xMin = mid - 2; xMax = mid + 2; }
  const losses = [...state.history.map(mse), mse(state.w), mse(nextW)];
  const yMax = Math.max(20, ...losses) * 1.12;
  const sx = (w) => m.l + (w - xMin) / (xMax - xMin) * iw;
  const sy = (l) => m.t + ih - Math.min(l, yMax) / yMax * ih;
  const curve = [];
  for (let i = 0; i <= 160; i++) {
    const w = xMin + (xMax - xMin) * i / 160;
    curve.push([sx(w), sy(mse(w))]);
  }
  const g = gradient(state.w);
  const span = (xMax - xMin) * 0.18;
  const ta = Math.max(xMin, state.w - span), tb = Math.min(xMax, state.w + span);
  const tangentA = mse(state.w) + g * (ta - state.w);
  const tangentB = mse(state.w) + g * (tb - state.w);
  let grid = "";
  for (let i = 0; i <= 4; i++) {
    const y = m.t + ih * i / 4;
    const val = yMax * (1 - i / 4);
    grid += `<line class="grid" x1="${m.l}" y1="${y}" x2="${W-m.r}" y2="${y}"/><text x="${m.l-9}" y="${y+4}" text-anchor="end">${tick(val)}</text>`;
  }
  for (let i = 0; i <= 5; i++) {
    const x = m.l + iw * i / 5;
    const val = xMin + (xMax - xMin) * i / 5;
    grid += `<line class="grid" x1="${x}" y1="${m.t}" x2="${x}" y2="${m.t+ih}"/><text x="${x}" y="${H-23}" text-anchor="middle">${tick(val)}</text>`;
  }
  const optX = sx(3), optY = sy(0);
  const cx = sx(state.w), cy = sy(mse(state.w));
  const nx = sx(nextW), ny = sy(mse(nextW));
  svg.innerHTML = `
    <defs><clipPath id="plot-clip"><rect x="${m.l}" y="${m.t}" width="${iw}" height="${ih}"/></clipPath><marker id="next-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 0 6 7 3z" fill="#d93454"/></marker></defs>
    ${grid}
    <line class="axis" x1="${m.l}" y1="${m.t+ih}" x2="${W-m.r}" y2="${m.t+ih}"/>
    <g clip-path="url(#plot-clip)">
      <line class="grid" x1="${optX}" y1="${m.t}" x2="${optX}" y2="${m.t+ih}" stroke-dasharray="3 4"/>
      <path class="curve" d="${pathFrom(curve)}"/>
      <line class="tangent" x1="${sx(ta)}" y1="${sy(tangentA)}" x2="${sx(tb)}" y2="${sy(tangentB)}"/>
      <line class="update" x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" marker-end="url(#next-arrow)"/>
    </g>
    <circle class="point" cx="${cx}" cy="${cy}" r="7"/><circle class="next" cx="${nx}" cy="${ny}" r="6"/>
    <circle cx="${optX}" cy="${optY}" r="4" fill="#363e40"/>
    <text class="label" x="${Math.min(optX+8,W-110)}" y="${m.t+16}">Minimum w = 3</text>
    <text class="label" x="${W-m.r}" y="${H-5}" text-anchor="end">Weight w →</text>
    <text class="label" x="10" y="${m.t+3}">MSE</text>`;
  svg.setAttribute("aria-label", `Current w ${fmt(state.w)}, MSE ${fmt(mse(state.w))}; predicted next w ${fmt(nextW)}, MSE ${fmt(mse(nextW))}`);
}

function drawHistoryChart() {
  const svg = $("history-chart");
  const mobile = window.innerWidth <= 620;
  const W = mobile ? 360 : 480, H = 360, m = { l: mobile ? 42 : 48, r: mobile ? 12 : 20, t: 24, b: 48 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const vals = state.history.map(mse);
  const logs = vals.map((v) => Math.log10(Math.max(v, 1e-8)));
  let lo = Math.min(0, ...logs), hi = Math.max(2, ...logs);
  if (hi - lo < 2) hi = lo + 2;
  lo -= 0.15; hi += 0.25;
  const steps = state.history.length - 1;
  const xMax = Math.max(10, steps);
  const sx = (i) => m.l + i / xMax * iw;
  const sy = (v) => m.t + (hi - Math.log10(Math.max(v, 1e-8))) / (hi - lo) * ih;
  let grid = "";
  for (let i = 0; i <= 4; i++) {
    const y = m.t + ih * i / 4;
    const lv = hi - (hi - lo) * i / 4;
    grid += `<line class="grid" x1="${m.l}" y1="${y}" x2="${W-m.r}" y2="${y}"/><text x="${m.l-8}" y="${y+4}" text-anchor="end">10${toSup(Math.round(lv))}</text>`;
  }
  for (let i = 0; i <= 5; i++) {
    const x = m.l + iw * i / 5;
    grid += `<line class="grid" x1="${x}" y1="${m.t}" x2="${x}" y2="${m.t+ih}"/><text x="${x}" y="${H-23}" text-anchor="middle">${Math.round(xMax*i/5)}</text>`;
  }
  const pts = vals.map((v, i) => [sx(i), sy(v)]);
  const last = pts.at(-1);
  svg.innerHTML = `${grid}<line class="axis" x1="${m.l}" y1="${m.t+ih}" x2="${W-m.r}" y2="${m.t+ih}"/>
    ${pts.length > 1 ? `<path class="history" d="${pathFrom(pts)}"/>` : ""}
    <circle class="point" cx="${last[0]}" cy="${last[1]}" r="6"/>
    <text class="label" x="${W-m.r}" y="${H-5}" text-anchor="end">Update step →</text>
    <text class="label" x="8" y="${m.t+3}">MSE</text>`;
  svg.setAttribute("aria-label", `After ${steps} steps, MSE changed from ${fmt(vals[0])} to ${fmt(vals.at(-1))}`);
}

function toSup(n) {
  const chars = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  return String(n).split("").map((c) => chars[c] || c).join("");
}

function renderBackprop() {
  const yhat = prediction(state.w), r = residual(state.w), l = mse(state.w), g = gradient(state.w);
  $("bp-w").textContent = fmt(state.w);
  $("bp-y").textContent = fmt(yhat);
  $("bp-r").textContent = fmt(r);
  $("bp-l").textContent = fmt(l);
  $("bp-g").textContent = `gradient = ${fmt(g)}`;
  document.querySelectorAll("[data-bp-mode]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.bpMode === state.bpMode));
  });
  const forward = state.bpMode === "forward";
  $("bp-mode-label").textContent = forward ? "Forward pass" : "Backward pass";
  document.querySelectorAll(".flow-f").forEach((el) => el.classList.toggle("active-f", forward));
  document.querySelectorAll(".flow-b").forEach((el) => el.classList.toggle("active-b", !forward));
  document.querySelectorAll(".bp-graph .box").forEach((el) => {
    el.classList.toggle("active-f", forward);
    el.classList.toggle("active-b", !forward);
  });
  $("bp-explanation").innerHTML = forward
    ? `The forward pass moves left to right: <span class="math">w = ${fmt(state.w)} → ŷ = ${fmt(yhat)} → r = ${fmt(r)} → MSE = ${fmt(l)}</span>. It only computes the prediction and error.`
    : `The backward pass moves right to left: <strong>upstream gradient × local derivative</strong>. Here, <span class="math">1 × (2r) × 1 × x = 1 × (${fmt(2*r)}) × 1 × 2 = ${fmt(g)}</span>, so <span class="math">∂MSE/∂w = ${fmt(g)}</span>.`;
}

function render() {
  const w = state.w, g = gradient(w), currentMSE = mse(w);
  const nextW = w - state.lr * g, nextMSE = mse(nextW);
  const steps = state.history.length - 1;
  $("lr").value = state.lr;
  $("lr-out").textContent = fmt(state.lr);
  $("start-out").textContent = fmt(Number($("start-w").value));
  $("m-step").textContent = steps;
  $("m-w").textContent = smart(w);
  $("m-y").textContent = smart(prediction(w));
  $("m-g").textContent = smart(g);
  $("m-l").textContent = smart(currentMSE);
  $("update-equation").innerHTML = `Next step: w<sub>new</sub> = ${smart(w)} − ${fmt(state.lr)} × (<b>${smart(g)}</b>) = <b>${smart(nextW)}</b>`;
  const down = nextMSE <= currentMSE;
  const change = currentMSE === 0 ? 0 : Math.abs(nextMSE - currentMSE) / currentMSE * 100;
  $("delta").className = `delta ${down ? "down" : "up"}`;
  $("delta").innerHTML = `Predicted MSE ${down ? "decrease" : "increase"}<strong>${smart(currentMSE)} → ${smart(nextMSE)}</strong>${Number.isFinite(change) ? `${down ? "↓" : "↑"} ${fmt(change, 1)}%` : ""}`;
  drawLossChart(nextW);
  drawHistoryChart();
  renderBackprop();
}

function stopPlay() {
  if (state.timer !== null) clearInterval(state.timer);
  state.timer = null;
  $("play").textContent = "Auto play";
  $("play").setAttribute("aria-pressed", "false");
}

function takeStep() {
  const oldW = state.w, oldMSE = mse(oldW), g = gradient(oldW);
  const newW = oldW - state.lr * g;
  if (!Number.isFinite(newW) || Math.abs(newW) > 1e6 || mse(newW) > 1e14) {
    stopPlay();
    $("lab-status").textContent = "The values are now too large for this demo: this learning rate makes the updates diverge. Reset and try a smaller η.";
    return;
  }
  state.w = newW;
  state.history.push(newW);
  render();
  const newMSE = mse(newW), fell = newMSE <= oldMSE;
  $("lab-status").textContent = `Step ${state.history.length - 1}: w changed from ${smart(oldW)} to ${smart(newW)}; MSE ${fell ? "fell" : "rose"} from ${smart(oldMSE)} to ${smart(newMSE)}. ${fell ? "The new weight moves the prediction closer to 6." : "This step overshot the minimum because the learning rate is too large."}`;
  if (newMSE < 1e-10) {
    stopPlay();
    $("lab-status").textContent += " The result is now very close to the minimum.";
  } else if (state.history.length > 60) {
    stopPlay();
    $("lab-status").textContent += " The 60-step demo limit has been reached; reset to compare another run.";
  }
}

$("step").addEventListener("click", takeStep);
$("play").addEventListener("click", () => {
  if (state.timer !== null) {
    stopPlay();
    $("lab-status").textContent = "Paused. You can continue one step at a time or change the learning rate.";
    return;
  }
  if (mse(state.w) < 1e-10 || state.history.length > 60) {
    $("lab-status").textContent = "This run is complete. Select Reset or move the starting-weight slider to begin another experiment.";
    return;
  }
  $("play").textContent = "Pause";
  $("play").setAttribute("aria-pressed", "true");
  $("lab-status").textContent = "Updating automatically: each step computes the gradient, updates the weight, and recalculates MSE.";
  state.timer = setInterval(takeStep, 700);
  takeStep();
});
$("reset").addEventListener("click", () => {
  stopPlay();
  state.w = Number($("start-w").value);
  state.history = [state.w];
  render();
  $("lab-status").textContent = `Reset to w = ${fmt(state.w)}. Select “Take a step” and compare the predicted destination with the actual change in MSE.`;
});
$("lr").addEventListener("input", (event) => {
  stopPlay();
  state.lr = Number(event.target.value);
  render();
  $("lab-status").textContent = state.lr > 0.25
    ? "η > 0.25: this example will diverge. Take a step to see why MSE rises instead."
    : state.lr === 0.25
      ? "η = 0.25: the weight will bounce between the two sides of the minimum without improving MSE."
      : "Learning rate changed. Previous steps are preserved so you can compare the next update directly.";
});
$("start-w").addEventListener("input", (event) => {
  stopPlay();
  state.w = Number(event.target.value);
  state.history = [state.w];
  render();
  $("lab-status").textContent = `Starting weight set to w = ${fmt(state.w)}; the step count is back to zero.`;
});
document.querySelectorAll("[data-lr]").forEach((button) => {
  button.addEventListener("click", () => {
    stopPlay();
    state.lr = Number(button.dataset.lr);
    render();
    $("lab-status").textContent = `Selected η = ${fmt(state.lr)}. Now select “Take a step” or “Auto play” to observe the result.`;
    $("lab").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  });
});
document.querySelectorAll("[data-bp-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    state.bpMode = button.dataset.bpMode;
    renderBackprop();
  });
});
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(render, 100);
});
window.addEventListener("pagehide", stopPlay);
render();
