/* OGgames: the home page grid and the play page. */
window.OG = (function () {
  var YOUTUBE = "https://www.youtube.com/channel/UCQ1P8B75CzSpf7KZPjvYejQ";
  var games = window.OG_GAMES || [];

  function $(id) { return document.getElementById(id); }

  // Browser storage can be blocked (private windows), so never rely on it
  function loadRecent() {
    try { return JSON.parse(localStorage.getItem("og_recent")) || []; } catch (e) { return []; }
  }
  function saveRecent(id) {
    try {
      var list = loadRecent().filter(function (x) { return x !== id; });
      list.unshift(id);
      localStorage.setItem("og_recent", JSON.stringify(list.slice(0, 6)));
    } catch (e) { /* the site works without it */ }
  }

  // Fetch the big engine files when someone points at a game, so it opens faster.
  // Only then: nobody downloads 20 MB just by looking at the home page.
  var ENGINE = "https://pygame-web.github.io/cdn/0.9.3/cpython312/";
  var warmed = false;
  function warmUp() {
    if (warmed) return;
    warmed = true;
    ["main.wasm", "main.data", "main.js"].forEach(function (file) {
      var link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "fetch";
      link.crossOrigin = "anonymous";
      link.href = ENGINE + file;
      document.head.appendChild(link);
    });
  }

  function tile(game) {
    var a = document.createElement("a");
    if (game.ready) {
      a.addEventListener("pointerenter", warmUp);
      a.addEventListener("touchstart", warmUp, { passive: true });
      a.addEventListener("focus", warmUp);
    }
    a.className = "tile";
    a.href = "game.html?id=" + encodeURIComponent(game.id);
    var img = document.createElement("img");
    img.src = game.thumb;
    img.alt = "";
    img.loading = "lazy";
    img.onerror = function () { img.remove(); a.classList.add("no-thumb"); };
    var name = document.createElement("span");
    name.className = "tile-name";
    name.textContent = game.name;
    a.appendChild(img);
    a.appendChild(name);
    if (!game.ready) {
      var soon = document.createElement("span");
      soon.className = "soon";
      soon.textContent = "Coming soon";
      a.appendChild(soon);
    }
    return a;
  }

  function fill(box, list) {
    box.textContent = "";
    list.forEach(function (g) { box.appendChild(tile(g)); });
  }

  function home() {
    var category = "All", query = "";
    var cats = ["All"];
    games.forEach(function (g) { if (cats.indexOf(g.category) < 0) cats.push(g.category); });

    function draw() {
      var q = query.trim().toLowerCase();
      var list = games.filter(function (g) {
        return (category === "All" || g.category === category) && g.name.toLowerCase().indexOf(q) >= 0;
      });
      fill($("grid"), list);
      $("empty").hidden = list.length > 0;
      $("grid-title").textContent = category === "All" ? "All games" : category + " games";
      var chips = $("chips");
      chips.textContent = "";
      cats.forEach(function (c) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "chip" + (c === category ? " on" : "");
        b.textContent = c;
        b.onclick = function () { category = c; draw(); };
        chips.appendChild(b);
      });
    }
    $("search").oninput = function (e) { query = e.target.value; draw(); };
    draw();

    var recent = loadRecent().map(function (id) {
      return games.filter(function (g) { return g.id === id && g.ready; })[0];
    }).filter(Boolean);
    if (recent.length) {
      fill($("recent"), recent);
      $("recent-wrap").hidden = false;
    }
  }

  function isPhone() {
    return window.matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 600;
  }

  /* The page itself always fills the screen, because iPhones don't let websites use real
     fullscreen. Where the browser does allow it, real fullscreen also hides its bars. */
  function enterFullscreen(stage, frame) {
    document.body.classList.add("game-full");
    window.scrollTo(0, 0);
    if (stage.requestFullscreen) {
      stage.requestFullscreen().then(function () {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock("landscape").catch(function () { /* the "turn your phone" message covers it */ });
        }
        // Chrome and Edge: Esc pauses the game, holding Esc leaves fullscreen
        if (navigator.keyboard && navigator.keyboard.lock) return navigator.keyboard.lock(["Escape"]);
      }).catch(function () { /* the page still fills the screen */ });
    }
    frame.focus();
  }

  function leaveFullscreen() {
    document.body.classList.remove("game-full");
    if (document.fullscreenElement) document.exitFullscreen();
  }

  /* The loading screen. A browser can't tell how far along a game's start-up is, so the
     bar is a time-based estimate that never reaches the end until the game says it's ready. */
  function startLoader(game) {
    var box = $("loader"), fill = $("loader-fill"), bar = $("loader-bar");
    var text = $("loader-text"), playBtn = $("loader-play"), tip = $("loader-tip");
    var STEPS = [[0, "Warming up the game..."], [25, "Loading the game engine..."],
                 [60, "Building the worlds..."], [85, "Almost there..."]];
    var tips = game.tips || [];
    var started = Date.now(), done = false, wantsPlay = false, loaderApi = {};
    var EXPECTED = 12000;       // about how long a first visit takes, in ms

    box.hidden = false;
    $("loader-name").textContent = game.name;
    var pic = $("loader-pic");
    pic.src = game.thumb;
    pic.onerror = function () { pic.hidden = true; };

    function setBar(p) {
      fill.style.width = p + "%";
      bar.setAttribute("aria-valuenow", Math.round(p));
    }
    var tipIndex = 0;
    function showTip() {
      tip.textContent = tips.length ? "TIP: " + tips[tipIndex++ % tips.length] : "";
    }
    showTip();
    var tipTimer = setInterval(showTip, 3500);
    var barTimer = setInterval(function () {
      var seconds = Date.now() - started;
      var p = 95 * (1 - Math.exp(-2.2 * seconds / EXPECTED));
      setBar(p);
      STEPS.forEach(function (s) { if (p >= s[0]) text.textContent = s[1]; });
      if (seconds > 60000) text.textContent = "Taking longer than usual. Your connection may be slow.";
    }, 100);
    setBar(1);
    text.textContent = STEPS[0][1];

    function enter() {
      clearInterval(tipTimer);
      box.hidden = true;
      if (loaderApi.onEnter) loaderApi.onEnter();
      window.removeEventListener("keydown", onKey);
      var f = loaderApi.frame;
      if (!f) return;
      try {
        // this click is what browsers want before they allow a game to make sound
        var w = f.contentWindow;
        if (w.MM) w.MM.UME = true;
        (w.__ogAudio || []).forEach(function (a) { a.resume(); });
        f.focus();
        var c = w.document.getElementById("canvas");
        if (c) c.focus();
      } catch (e) { /* the game still runs, maybe silently until it's clicked */ }
    }
    function press() {
      if (done) enter();
      else {
        wantsPlay = true;
        text.textContent = "Starting as soon as it's ready...";
      }
    }
    function onKey(e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        press();
      }
    }
    box.addEventListener("click", press);
    window.addEventListener("keydown", onKey);

    loaderApi.finish = function () {
      if (done) return;
      done = true;
      clearInterval(barTimer);
      setBar(100);
      if (wantsPlay) { enter(); return; }
      text.textContent = "Ready!";
      playBtn.hidden = false;
      playBtn.focus();
    };
    return loaderApi;
  }

  function play() {
    var id = new URLSearchParams(location.search).get("id");
    var game = games.filter(function (g) { return g.id === id; })[0];
    var stage = $("stage");
    if (!game) {
      $("name").textContent = "Game not found";
      $("fullscreen").hidden = true;
      stage.innerHTML = '<div class="stage-msg">That game isn\'t here. <a href="index.html">See all games</a></div>';
      return;
    }
    document.title = game.name + " - Play on OGgames";
    $("name").textContent = game.name;
    $("about").textContent = game.about;
    $("controls").textContent = game.controls;

    var others = games.filter(function (g) { return g.id !== id; });
    if (others.length) {
      fill($("more"), others);
      $("more-wrap").hidden = false;
    }
    if (!game.ready) {
      $("fullscreen").hidden = true;
      stage.innerHTML = '<div class="stage-msg">Coming soon!</div>';
      return;
    }
    var loader = startLoader(game);

    saveRecent(id);
    var frame = document.createElement("iframe");
    frame.src = "games/" + encodeURIComponent(id) + "/index.html";
    frame.title = game.name;
    frame.allow = "fullscreen; autoplay; gamepad";
    frame.onload = function () {
      frame.focus();
      if (!game.loader) loader.finish();    // this game has no "ready" signal: it's ready when loaded
    };
    stage.insertBefore(frame, stage.firstChild);
    loader.frame = frame;

    $("fullscreen").onclick = function () { enterFullscreen(stage, frame); };
    $("exit-full").onclick = function () { leaveFullscreen(); };
    document.addEventListener("fullscreenchange", function () {
      if (!document.fullscreenElement) document.body.classList.remove("game-full");
    });
    loader.onEnter = function () {
      if (isPhone()) enterFullscreen(stage, frame);     // on a phone, Play goes straight to full screen
    };

    // The game says it was beaten: only believe the game in our own frame
    var shown = false;
    window.addEventListener("message", function (e) {
      if (e.source !== frame.contentWindow || !e.data || e.data.source !== "oggames") return;
      if (e.data.type === "ready") loader.finish();
      if (e.data.type !== "complete" || shown) return;
      shown = true;
      leaveFullscreen();
      $("popup-title").textContent = "You beat " + game.name + "!";
      $("popup-link").href = YOUTUBE;
      $("popup").hidden = false;
      $("popup-link").focus();
    });
    $("popup-close").onclick = function () {
      $("popup").hidden = true;
      frame.focus();
    };
  }

  return { home: home, play: play };
})();
