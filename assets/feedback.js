/* The feedback and bug report form. The site has no server, so Web3Forms delivers messages by email. */
(function () {
  var ENDPOINT = "https://api.web3forms.com/submit";
  var form = document.getElementById("fb-form");
  var thanks = document.getElementById("fb-thanks");
  var status = document.getElementById("fb-status");
  var send = document.getElementById("fb-send");
  var message = document.getElementById("fb-message");
  var email = document.getElementById("fb-email");
  var game = document.getElementById("fb-game");
  var stepsWrap = document.getElementById("fb-steps-wrap");
  var steps = document.getElementById("fb-steps");
  var note = document.getElementById("fb-device-note");
  var count = document.getElementById("fb-count");
  var label = document.getElementById("fb-message-label");
  var params = new URLSearchParams(location.search);

  (window.OG_GAMES || []).forEach(function (g) {
    var o = document.createElement("option");
    o.value = g.name;
    o.textContent = g.name;
    if (g.id === params.get("game")) o.selected = true;
    game.appendChild(o);
  });
  var other = document.createElement("option");
  other.value = "The website / something else";
  other.textContent = "The website / something else";
  game.appendChild(other);

  function kind() {
    return form.querySelector('input[name="type"]:checked').value;
  }
  function updateKind() {
    var bug = kind() === "Bug report";
    stepsWrap.hidden = !bug;
    note.hidden = !bug;
    label.textContent = bug ? "What went wrong?" : kind() === "Game idea" ? "What's your idea?" : "Your message";
  }
  form.querySelectorAll('input[name="type"]').forEach(function (r) { r.addEventListener("change", updateKind); });
  var wanted = params.get("type");
  if (wanted === "bug") form.querySelector('input[value="Bug report"]').checked = true;
  updateKind();

  message.addEventListener("input", function () {
    count.textContent = message.value.length + " / 2000";
    message.removeAttribute("aria-invalid");
  });
  email.addEventListener("input", function () { email.removeAttribute("aria-invalid"); });

  function show(text, isError) {
    status.textContent = text;
    status.className = "fb-status" + (isError ? " bad" : "");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (document.getElementById("fb-website").value) return;       // a bot filled in the hidden box
    if (message.value.trim().length < 3) {
      message.setAttribute("aria-invalid", "true");
      show("Please write a little more first.", true);
      message.focus();
      return;
    }
    if (email.value && !email.checkValidity()) {
      email.setAttribute("aria-invalid", "true");
      show("That email doesn't look right. You can also leave it empty.", true);
      email.focus();
      return;
    }
    if (!window.OG_FEEDBACK_KEY) {
      show("The feedback form isn't connected yet, so this wasn't sent.", true);
      return;
    }
    var type = kind();
    var data = {
      access_key: window.OG_FEEDBACK_KEY,
      subject: "OGgames " + type + ": " + game.value,
      from_name: document.getElementById("fb-name").value.trim() || "OGgames player",
      Type: type,
      Game: game.value,
      Message: message.value.trim(),
      botcheck: ""
    };
    if (email.value) data.email = email.value.trim();
    if (type === "Bug report") {
      if (steps.value.trim()) data["How to make it happen"] = steps.value.trim();
      data.Device = navigator.userAgent;
    }
    send.disabled = true;
    show("Sending...", false);
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data)
    }).then(function (r) {
      return r.json().then(function (j) { return r.ok && j.success; });
    }).then(function (ok) {
      send.disabled = false;
      if (!ok) throw new Error("not sent");
      show("", false);
      form.hidden = true;
      thanks.hidden = false;
      thanks.focus();
    }).catch(function () {
      send.disabled = false;
      show("That didn't send. Your message is still here, so please try again in a minute.", true);
    });
  });

  document.getElementById("fb-again").addEventListener("click", function () {
    form.reset();
    updateKind();
    count.textContent = "0 / 2000";
    thanks.hidden = true;
    form.hidden = false;
    message.focus();
  });
})();
