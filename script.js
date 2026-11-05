/* =========================================================
   Colchões Sultan — interações da landing page
   ========================================================= */
(() => {
  "use strict";

  const WHATS = "5512988997000";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const waLink = (msg) => `https://wa.me/${WHATS}?text=${encodeURIComponent(msg)}`;
  const openWhats = (msg) => window.open(waLink(msg), "_blank", "noopener");

  /* ---------- Horário (sempre no fuso de Caçapava/SP) ---------- */
  // 0 = domingo ... 6 = sábado  → [abre, fecha] em minutos
  const HOURS = { 0: null, 1: [540, 1080], 2: [540, 1080], 3: [540, 1080], 4: [540, 1080], 5: [540, 1080], 6: [540, 840] };
  const DAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

  function nowSP() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short"
    }).formatToParts(new Date()).reduce((o, p) => (o[p.type] = p.value, o), {});
    const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
    const h = parseInt(parts.hour, 10) % 24;
    return {
      day: wd,
      minutes: h * 60 + parseInt(parts.minute, 10),
      iso: `${parts.year}-${parts.month}-${parts.day}`
    };
  }
  const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

  function updateStatus() {
    const el = $("#openStatus");
    if (!el) return;
    const { day, minutes } = nowSP();
    const today = HOURS[day];
    const text = $(".status__text", el);
    el.classList.remove("is-open", "is-closed");

    if (today && minutes >= today[0] && minutes < today[1]) {
      el.classList.add("is-open");
      const left = today[1] - minutes;
      text.textContent = left <= 60 ? `Aberto · fecha às ${fmt(today[1])}` : `Aberto agora · até ${fmt(today[1])}`;
    } else {
      el.classList.add("is-closed");
      if (today && minutes < today[0]) {
        text.textContent = `Fechado · abre hoje às ${fmt(today[0])}`;
      } else {
        let d = (day + 1) % 7, i = 1;
        while (!HOURS[d]) { d = (d + 1) % 7; i++; }
        text.textContent = `Fechado · abre ${i === 1 ? "amanhã" : DAY_NAMES[d]} às ${fmt(HOURS[d][0])}`;
      }
    }
    $$("#hours tr").forEach((tr) => tr.classList.toggle("is-today", Number(tr.dataset.day) === day));
  }
  updateStatus();
  setInterval(updateStatus, 60 * 1000);

  /* ---------- Header / menu mobile ---------- */
  const header = $("#header");
  const burger = $("#burger");
  const nav = $("#nav");

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const closeMenu = () => {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Abrir menu");
  };
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });
  $$("a", nav).forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());

  // Destaca o link da seção visível
  const navLinks = $$('.nav a[href^="#"]');
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === `#${en.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  navLinks.forEach((a) => { const s = $(a.getAttribute("href")); s && sectionObs.observe(s); });

  /* ---------- Revelar ao rolar ---------- */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-visible"); revealObs.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    revealObs.observe(el);
  });

  /* ---------- Filtro de produtos ---------- */
  $$(".chip").forEach((chip) => chip.addEventListener("click", () => {
    $$(".chip").forEach((c) => { c.classList.remove("is-active"); c.setAttribute("aria-selected", "false"); });
    chip.classList.add("is-active");
    chip.setAttribute("aria-selected", "true");
    const f = chip.dataset.filter;
    $$(".product").forEach((p) => p.classList.toggle("is-hidden", f !== "all" && p.dataset.cat !== f));
  }));

  // Botões "Pedir orçamento"
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".js-quote");
    if (!btn) return;
    openWhats(`Olá! Vim pelo site e gostaria de um orçamento de: ${btn.dataset.product}.`);
  });

  /* ---------- Quiz: colchão ideal ---------- */
  const quiz = $("#quiz");
  const steps = $$(".quiz__step", quiz);
  const total = steps.length;
  const answers = {};
  let current = 1;

  const LABELS = {
    quem: { solteiro: "Só para mim", casal: "Casal", crianca: "Criança / adolescente", idoso: "Pessoa idosa" },
    posicao: { lado: "De lado", costas: "De barriga para cima", "bruços": "De bruços", varia: "Muda de posição" },
    peso: { leve: "Até 60 kg", medio: "61 a 90 kg", pesado: "91 a 120 kg", extra: "Acima de 120 kg" },
    dor: { costas: "Dor nas costas", calor: "Calor à noite", parceiro: "Movimento do parceiro(a)", nada: "Mais conforto" }
  };

  function showStep(n) {
    current = n;
    steps.forEach((s) => s.classList.toggle("is-active", Number(s.dataset.step) === n));
    $("#quizBar").style.width = `${(n / total) * 100}%`;
    $("#quizCount").textContent = `Pergunta ${n} de ${total}`;
    $("#quizBack").hidden = n === 1;
  }

  function recommend(a) {
    let tipo, firmeza, extra = [];

    // Firmeza pelo peso + posição
    const firmScale = { leve: 1, medio: 2, pesado: 3, extra: 4 }[a.peso];
    const posAdj = { lado: -1, costas: 0, "bruços": 1, varia: 0 }[a.posicao];
    const f = Math.max(1, Math.min(4, firmScale + posAdj + (a.dor === "costas" ? 1 : 0)));
    firmeza = ["", "Macio a médio", "Médio", "Médio-firme", "Firme"][f];

    const densidade = { leve: "D28 / D33", medio: "D33", pesado: "D45", extra: "D45 ou molas reforçadas" }[a.peso];

    // Tecnologia
    if (a.dor === "parceiro" || a.dor === "calor" || a.posicao === "varia" || (a.quem === "casal" && a.peso !== "leve")) {
      tipo = "Colchão de molas ensacadas";
      if (a.dor === "parceiro") extra.push("as molas individuais evitam que um acorde o outro");
      if (a.dor === "calor") extra.push("a estrutura de molas deixa o ar circular e o colchão fica mais fresco");
      if (a.posicao === "varia") extra.push("ele acompanha as mudanças de posição sem afundar");
    } else if (a.posicao === "lado" && a.dor !== "costas" && a.peso !== "extra") {
      tipo = "Colchão com Pillow Top";
      extra.push("a camada de conforto alivia a pressão em ombros e quadril para quem dorme de lado");
    } else {
      tipo = "Colchão de espuma de alta densidade";
      extra.push("a espuma certificada oferece suporte firme e uniforme para a coluna");
    }
    if (a.dor === "costas") extra.push("para quem sente dor nas costas, o suporte firme ajuda a manter a coluna alinhada");
    if (a.quem === "idoso") extra.push("combinado com uma cama box mais alta, fica mais fácil deitar e levantar");
    if (a.quem === "crianca") extra.push("para os pequenos, a densidade deve acompanhar o peso — revise a cada fase de crescimento");

    const tamanho = { solteiro: "Solteiro ou Solteirão", casal: "Casal ou Queen", crianca: "Solteiro", idoso: "Solteirão ou Casal" }[a.quem];

    return {
      tipo,
      texto: `Pelo seu perfil, um bom ponto de partida é o ${tipo.toLowerCase()} — ${extra.join("; ")}.`,
      meta: [["Tecnologia", tipo.replace(/^Colchão (de |com )?/, "").replace(/^./, (c) => c.toUpperCase())], ["Firmeza", firmeza], ["Densidade / suporte", densidade], ["Tamanho sugerido", tamanho]]
    };
  }

  function showResult() {
    steps.forEach((s) => s.classList.remove("is-active"));
    $("#quizBar").style.width = "100%";
    $("#quizCount").textContent = "Resultado";
    $("#quizBack").hidden = true;

    const r = recommend(answers);
    $("#resultTitle").textContent = r.tipo;
    $("#resultText").textContent = r.texto;
    $("#resultMeta").innerHTML = r.meta.map(([k, v]) => `<li>${k}<strong>${v}</strong></li>`).join("");

    const msg =
      `Olá! Fiz o teste do colchão ideal no site:\n` +
      `• Para: ${LABELS.quem[answers.quem]}\n` +
      `• Posição: ${LABELS.posicao[answers.posicao]}\n` +
      `• Peso: ${LABELS.peso[answers.peso]}\n` +
      `• Incômodo: ${LABELS.dor[answers.dor]}\n` +
      `Indicação: ${r.tipo} (${r.meta[1][1]}). Pode me ajudar?`;
    $("#resultWhats").href = waLink(msg);
    $("#quizResult").hidden = false;
  }

  $$(".option", quiz).forEach((opt) => opt.addEventListener("click", () => {
    const { key, value } = opt.dataset;
    answers[key] = value;
    $$(`.option[data-key="${key}"]`, quiz).forEach((o) => o.classList.toggle("is-selected", o === opt));
    setTimeout(() => (current < total ? showStep(current + 1) : showResult()), 220);
  }));
  $("#quizBack").addEventListener("click", () => current > 1 && showStep(current - 1));
  $("#quizRestart").addEventListener("click", () => {
    Object.keys(answers).forEach((k) => delete answers[k]);
    $$(".option", quiz).forEach((o) => o.classList.remove("is-selected"));
    $("#quizResult").hidden = true;
    showStep(1);
  });

  /* ---------- Guia de medidas ---------- */
  const REF = 260; // cm de referência para a escala do "quarto"
  const bed = $("#sizeBed");
  function setSize(btn) {
    $$(".size-btn").forEach((b) => { b.classList.toggle("is-active", b === btn); b.setAttribute("aria-selected", String(b === btn)); });
    const w = Number(btn.dataset.w), l = Number(btn.dataset.l);
    bed.style.width = `${(w / REF) * 100}%`;
    bed.style.height = `${(l / (REF / 1.1)) * 100 * 0.92}%`;
    $("#sizeName").textContent = btn.dataset.name;
    $("#sizeW").textContent = w;
    $("#sizeL").textContent = l;
    $("#sizeFor").textContent = btn.dataset.for;
    const roomW = ((w + 120) / 100).toFixed(2).replace(".", ",");
    const roomL = ((l + 60) / 100).toFixed(2).replace(".", ",");
    $("#sizeRoom").textContent = `${roomW} × ${roomL} m`;
    $("#sizeQuote").dataset.product = `Colchão tamanho ${btn.dataset.name} (${w} × ${l} cm)`;
  }
  $$(".size-btn").forEach((b) => b.addEventListener("click", () => setSize(b)));
  setSize($(".size-btn.is-active"));

  /* ---------- Agendamento de visita ---------- */
  const form = $("#visitForm");
  const fDate = $("#fDate");
  const fTime = $("#fTime");
  const today = nowSP();
  fDate.min = today.iso;
  const max = new Date(`${today.iso}T12:00:00`);
  max.setDate(max.getDate() + 60);
  fDate.max = max.toISOString().slice(0, 10);

  const weekdayOf = (iso) => new Date(`${iso}T12:00:00`).getDay();

  function fillSlots() {
    const field = fDate.closest(".field");
    fTime.innerHTML = "";
    if (!fDate.value) {
      fTime.disabled = true;
      fTime.innerHTML = `<option value="">Escolha o dia primeiro</option>`;
      return;
    }
    const hours = HOURS[weekdayOf(fDate.value)];
    const isToday = fDate.value === nowSP().iso;
    const slots = [];
    if (hours) {
      for (let m = hours[0]; m <= hours[1] - 30; m += 30) {
        if (!isToday || m > nowSP().minutes + 30) slots.push(m);
      }
    }
    if (!slots.length || fDate.value < fDate.min) {
      field.classList.add("has-error");
      $(".field__error", field).textContent = !hours ? "Aos domingos a loja fica fechada. Escolha outro dia." : "Não há mais horários hoje. Escolha outro dia.";
      fTime.disabled = true;
      fTime.innerHTML = `<option value="">Sem horários</option>`;
      return;
    }
    field.classList.remove("has-error");
    fTime.disabled = false;
    fTime.innerHTML = `<option value="">Selecione</option>` + slots.map((m) => `<option>${fmt(m)}</option>`).join("");
  }
  fDate.addEventListener("change", fillSlots);
  $$("input, select", form).forEach((el) => el.addEventListener("input", () => {
    if (el !== fDate) el.closest(".field")?.classList.remove("has-error");
  }));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    const name = $("#fName");
    if (name.value.trim().length < 2) { name.closest(".field").classList.add("has-error"); ok = false; }
    if (!fDate.value || fDate.closest(".field").classList.contains("has-error")) {
      fDate.closest(".field").classList.add("has-error"); ok = false;
    }
    if (!fTime.value) { fTime.closest(".field").classList.add("has-error"); ok = false; }
    if (!ok) { form.querySelector(".has-error input, .has-error select")?.focus(); return; }

    const [y, mo, d] = fDate.value.split("-");
    const dia = DAY_NAMES[weekdayOf(fDate.value)];
    const obs = $("#fMsg").value.trim();
    const msg =
      `Olá! Gostaria de agendar uma visita à Colchões Sultan.\n` +
      `• Nome: ${name.value.trim()}\n` +
      `• Dia: ${d}/${mo}/${y} (${dia})\n` +
      `• Horário: ${fTime.value}\n` +
      `• Interesse: ${$("#fInterest").value}` +
      (obs ? `\n• Obs.: ${obs}` : "");
    openWhats(msg);
  });

  /* ---------- Diversos ---------- */
  $("#year").textContent = new Date().getFullYear();

  // Mostra a dica do WhatsApp flutuante uma vez, após alguns segundos
  const wf = $(".whats-float");
  setTimeout(() => { wf.classList.add("show-tip"); setTimeout(() => wf.classList.remove("show-tip"), 4000); }, 6000);
})();
