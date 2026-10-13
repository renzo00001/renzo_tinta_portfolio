/* Formulario de contacto (solo en la página de inicio).
   FORM_ENDPOINT: URL de un servicio de formularios (p. ej. Formspree o Web3Forms).
   Vacío = formulario desactivado. El correo de destino se configura en ese servicio,
   por lo que no aparece en el código de la web. */
(function () {
  "use strict";
  const FORM_ENDPOINT = "";

  const form = document.getElementById("contact-form");
  const statusEl = document.getElementById("form-status");
  const sendBtn = document.getElementById("send");
  if (!form || !statusEl || !sendBtn) return;

  let lastKey = "";
  const say = key => { lastKey = key; statusEl.textContent = window.SITE.t(key) || ""; };
  window.SITE.onLang(() => { if (lastKey) say(lastKey); });

  if (!FORM_ENDPOINT) { sendBtn.disabled = true; say("f_off"); }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!FORM_ENDPOINT) return;
    const data = new FormData(form);
    if (data.get("_gotcha")) return;
    const okEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(data.get("email")));
    if (!String(data.get("name")).trim() || !okEmail || !String(data.get("message")).trim()) { say("f_invalid"); return; }
    sendBtn.disabled = true; say("f_sending");
    try {
      const r = await fetch(FORM_ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error(r.status);
      form.reset(); say("f_ok");
    } catch (err) { say("f_err"); }
    sendBtn.disabled = false;
  });
})();
