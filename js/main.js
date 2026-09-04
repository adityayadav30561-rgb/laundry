/* ==========================================================================
   Aarika Fabric Care — site scripts
   Plain JavaScript, no libraries. Each block checks for what it needs, so a
   page without those elements simply skips it.

   1 Header state    2 Mobile menu    3 Scroll reveals
   4 Pickup form     5 Footer year
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Header state ----------
     Only toggles a class, and only when the value actually changes, so a
     scroll never causes a style recalculation it did not need. */
  var header = document.querySelector(".site-header");

  if (header) {
    var stuck = false;
    var headerTick = false;

    var measureHeader = function () {
      document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
    };

    var readHeader = function () {
      var now = (window.scrollY || document.documentElement.scrollTop || 0) > 8;
      if (now !== stuck) {
        stuck = now;
        header.classList.toggle("is-stuck", now);
      }
      headerTick = false;
    };

    window.addEventListener("scroll", function () {
      if (!headerTick) { headerTick = true; requestAnimationFrame(readHeader); }
    }, { passive: true });

    window.addEventListener("resize", measureHeader, { passive: true });
    measureHeader();
    readHeader();
  }

  /* ---------- 2. Mobile menu ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");

  if (toggle && links) {
    var setMenu = function (open) {
      links.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      // Stop the page behind the panel scrolling away under a finger
      document.documentElement.style.overflow = open ? "hidden" : "";
    };

    var closeMenu = function (refocus) {
      if (!links.classList.contains("is-open")) { return; }
      setMenu(false);
      if (refocus) { toggle.focus(); }
    };

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setMenu(!links.classList.contains("is-open"));
    });

    links.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("a")) { closeMenu(false); }
    });

    document.addEventListener("click", function (e) {
      if (!links.classList.contains("is-open")) { return; }
      if (!links.contains(e.target) && !toggle.contains(e.target)) { closeMenu(false); }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.key === "Esc") { closeMenu(true); }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) { closeMenu(false); }
    }, { passive: true });
  }

  /* ---------- 3. Scroll reveals ----------
     One IntersectionObserver, each element unobserved the moment it lands, and
     only opacity and transform animate — both composited, so scrolling never
     touches layout. Nothing here runs on the scroll event itself. */
  if (!reduceMotion && "IntersectionObserver" in window) {
    // Tells the failsafe in the page head that the reveals are being handled
    // here. Set inside this branch on purpose: a browser without
    // IntersectionObserver must fall through to the failsafe, not silence it.
    document.documentElement.classList.add("reveal-ready");

    var targets = [].slice.call(document.querySelectorAll("[data-reveal]"));

    var show = function (el, instant) {
      if (instant) {
        el.style.transition = "none";
        el.classList.add("is-in");
        requestAnimationFrame(function () { el.style.transition = ""; });
        return;
      }
      var delay = parseInt(el.getAttribute("data-delay"), 10);
      if (delay) { el.style.transitionDelay = delay + "ms"; }
      el.classList.add("is-in");
    };

    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) { continue; }
        observer.unobserve(entries[i].target);
        show(entries[i].target, false);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });

    // Stagger siblings inside a group so a row arrives as a wave, not at once
    var groups = document.querySelectorAll("[data-reveal-group]");
    for (var g = 0; g < groups.length; g++) {
      var kids = groups[g].children;
      for (var k = 0; k < kids.length; k++) {
        if (kids[k].hasAttribute("data-reveal") && !kids[k].hasAttribute("data-delay")) {
          kids[k].setAttribute("data-delay", String(k * 80));
        }
      }
    }

    for (var t = 0; t < targets.length; t++) { observer.observe(targets[t]); }

    /* An element that goes from below the fold to above it in one jump never
       intersects, so the observer never fires for it and it would stay
       invisible for good. That happens on anchor jumps, fast scrolling and
       when the browser restores a scroll position on reload. This sweep shows
       anything already scrolled past, with no animation. */
    var pending = targets.slice();
    var sweepQueued = false;

    var sweep = function () {
      sweepQueued = false;
      var left = [];
      for (var i = 0; i < pending.length; i++) {
        var el = pending[i];
        if (el.classList.contains("is-in")) { continue; }
        if (el.getBoundingClientRect().bottom < 0) {
          observer.unobserve(el);
          show(el, true);
          continue;
        }
        left.push(el);
      }
      pending = left;
    };

    window.addEventListener("scroll", function () {
      if (!sweepQueued && pending.length) { sweepQueued = true; requestAnimationFrame(sweep); }
    }, { passive: true });

    window.addEventListener("load", sweep);
    sweep();

    /* Last line of defence. The observer normally fires for anything already
       on screen the moment the page settles, but it can be starved — a tab
       restored from the background, a throttled or hidden renderer, a browser
       that never runs the callback. If that happens the content stays at
       opacity 0 with nothing left to trigger it. A few seconds in, anything
       still hidden at or above the fold is simply shown, with no animation.
       By then a working observer has already handled all of them, so this
       costs nothing in the normal case. */
    var rescue = function () {
      for (var i = 0; i < pending.length; i++) {
        var el = pending[i];
        if (el.classList.contains("is-in")) { continue; }
        if (el.getBoundingClientRect().top < window.innerHeight) {
          observer.unobserve(el);
          show(el, true);
        }
      }
    };
    setTimeout(rescue, 3000);
  }

  /* ---------- 4. Pickup form ---------- */
  var form = document.querySelector("#pickup-form");

  if (form) {
    var msg = document.querySelector("#form-msg");

    var say = function (text, isError) {
      if (!msg) { return; }
      msg.textContent = text;
      msg.classList.add("is-shown");
      msg.classList.toggle("is-error", !!isError);
      msg.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    };

    // send.php redirects back with ?sent=1 or ?error=1
    if (/[?&]sent=1/.test(location.search)) {
      say("Thank you — your pickup request is in. We will call to confirm your slot shortly.", false);
      form.reset();
      history.replaceState(null, "", location.pathname);
    } else if (/[?&]error=1/.test(location.search)) {
      say("Sorry, that did not send. Please call 8791088936 and we will book it for you.", true);
      history.replaceState(null, "", location.pathname);
    }

    // A pickup cannot be booked for a date already gone
    var dateField = form.querySelector('input[type="date"]');
    if (dateField && !dateField.min) {
      dateField.min = new Date().toISOString().slice(0, 10);
    }

    form.addEventListener("submit", function (e) {
      var name = form.elements.name.value.trim();
      var phone = form.elements.phone.value.replace(/\D/g, "");

      if (!name) {
        e.preventDefault();
        say("Please add your name so we know who to ask for.", true);
        form.elements.name.focus();
        return;
      }
      // Indian mobile numbers are 10 digits and never start below 6
      if (!/^[6-9]\d{9}$/.test(phone)) {
        e.preventDefault();
        say("Please enter a 10-digit mobile number so we can confirm the pickup.", true);
        form.elements.phone.focus();
        return;
      }
      // Valid — let it post to send.php
    });
  }

  /* ---------- 5. Rate card ----------
     Tabs while browsing; a single filtered list while searching. Searching
     across every category is the point — someone looking up "saree" should not
     have to guess which tab it lives under first. */
  var rates = document.querySelector(".rates");

  if (rates) {
    var rTabs   = [].slice.call(rates.querySelectorAll('[role="tab"]'));
    var rPanels = rTabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
    var rSearch = rates.querySelector("#rate-search");
    var rEmpty  = rates.querySelector(".rates-empty");
    var rItems  = [].slice.call(rates.querySelectorAll(".rate-list li")).map(function (li) {
      var name = li.querySelector(".rate-name");
      return { li: li, text: (name ? name.textContent : "").toLowerCase() };
    });

    var showTab = function (index, focus) {
      rTabs.forEach(function (tab, i) {
        var on = i === index;
        tab.classList.toggle("is-on", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        if (rPanels[i]) { rPanels[i].hidden = !on; }
      });
      if (focus) { rTabs[index].focus(); }
    };

    rTabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        if (rSearch && rSearch.value) { rSearch.value = ""; filter(); }
        showTab(i, false);
      });
      tab.addEventListener("keydown", function (e) {
        var to = e.key === "ArrowRight" ? i + 1
               : e.key === "ArrowLeft"  ? i - 1
               : e.key === "Home"       ? 0
               : e.key === "End"        ? rTabs.length - 1 : -1;
        if (to === -1) { return; }
        e.preventDefault();
        showTab((to + rTabs.length) % rTabs.length, true);
      });
    });

    var filter = function () {
      var q = rSearch.value.trim().toLowerCase();
      rates.classList.toggle("is-searching", q !== "");

      if (!q) {
        // back to browsing: whichever tab is selected wins
        var active = rTabs.findIndex ? rTabs.findIndex(function (t) { return t.classList.contains("is-on"); }) : 0;
        showTab(active < 0 ? 0 : active, false);
        rItems.forEach(function (it) { it.li.hidden = false; });
        if (rEmpty) { rEmpty.hidden = true; }
        return;
      }

      var found = 0;
      rItems.forEach(function (it) {
        var hit = it.text.indexOf(q) !== -1;
        it.li.hidden = !hit;
        if (hit) { found++; }
      });
      // every category is visible while searching, minus the empty ones
      rPanels.forEach(function (p) {
        if (!p) { return; }
        p.hidden = !p.querySelector(".rate-list li:not([hidden])");
      });
      if (rEmpty) { rEmpty.hidden = found !== 0; }
    };

    /* --- Filter sheet, for phones ---
       The category pills do not fit beside a search box on a narrow screen, so
       below that width they are replaced by one button that opens a sheet from
       the bottom. Built from the tabs rather than written out again, so the two
       can never disagree. */
    var fBtn = rates.querySelector(".rates-filter");

    if (fBtn) {
      var fVal   = fBtn.querySelector(".val");
      var sheet  = document.createElement("div");
      sheet.className = "sheet";
      sheet.hidden = true;
      sheet.innerHTML =
        '<div class="sheet-scrim" data-close></div>' +
        '<div class="sheet-panel" role="dialog" aria-modal="true" aria-label="Choose a category">' +
          '<div class="sheet-grip"></div>' +
          '<div class="sheet-head"><h3>Category</h3>' +
            '<button type="button" class="sheet-close" data-close>Done</button></div>' +
          '<ul class="sheet-list">' +
            rTabs.map(function (t, i) {
              var count = t.querySelector(".n");
              return '<li><button type="button" class="sheet-opt" data-i="' + i + '">' +
                '<span>' + t.childNodes[0].textContent.trim() + '</span>' +
                '<span class="count">' + (count ? count.textContent : "") + '</span>' +
                '<svg class="tick" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
                '<path d="m5.5 12.5 4 4 9-9.5" stroke="#3A6076" stroke-width="2.6" ' +
                'stroke-linecap="round" stroke-linejoin="round"/></svg></button></li>';
            }).join("") +
          '</ul>' +
        '</div>';
      document.body.appendChild(sheet);

      var opts = [].slice.call(sheet.querySelectorAll(".sheet-opt"));
      var lastFocus = null;

      var paint = function (index) {
        opts.forEach(function (o, i) { o.classList.toggle("is-on", i === index); });
        if (fVal) { fVal.textContent = rTabs[index].childNodes[0].textContent.trim(); }
      };

      var closeSheet = function () {
        if (sheet.hidden) { return; }
        sheet.hidden = true;
        document.documentElement.style.overflow = "";
        fBtn.setAttribute("aria-expanded", "false");
        if (lastFocus) { lastFocus.focus(); }
      };

      var openSheet = function () {
        lastFocus = document.activeElement;
        var active = 0;
        rTabs.forEach(function (t, i) { if (t.classList.contains("is-on")) { active = i; } });
        paint(active);
        sheet.hidden = false;
        document.documentElement.style.overflow = "hidden";
        fBtn.setAttribute("aria-expanded", "true");
        (opts[active] || opts[0]).focus();
      };

      fBtn.addEventListener("click", openSheet);

      sheet.addEventListener("click", function (e) {
        if (e.target.closest("[data-close]")) { closeSheet(); return; }
        var opt = e.target.closest(".sheet-opt");
        if (!opt) { return; }
        var i = +opt.getAttribute("data-i");
        if (rSearch && rSearch.value) { rSearch.value = ""; filter(); }
        showTab(i, false);
        paint(i);
        closeSheet();
      });

      document.addEventListener("keydown", function (e) {
        if (!sheet.hidden && (e.key === "Escape" || e.key === "Esc")) { closeSheet(); }
      });

      paint(0);
    }

    if (rSearch) {
      rSearch.addEventListener("input", filter);
      rSearch.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && rSearch.value) { e.stopPropagation(); rSearch.value = ""; filter(); }
      });
    }
  }

  /* ---------- 6. WhatsApp button ----------
     The link already carries the message on its own, so it works with no
     JavaScript, with geolocation blocked, and if the visitor refuses the
     prompt. All this adds is the location, when it is offered.

     Navigation stays in the same tab on purpose: a new window opened after an
     async permission prompt is what popup blockers exist to stop. */
  var waBtn = document.querySelector(".fab-wa");

  if (waBtn && navigator.geolocation) {
    waBtn.addEventListener("click", function (e) {
      var base = waBtn.getAttribute("data-wa");
      if (!base) { return; }
      e.preventDefault();

      var sent = false;
      var send = function (extra) {
        if (sent) { return; }
        sent = true;
        window.location.href = base + (extra ? encodeURIComponent(extra) : "");
      };

      // If the prompt is ignored, go anyway rather than leaving them waiting
      var giveUp = setTimeout(function () { send(""); }, 7000);

      navigator.geolocation.getCurrentPosition(
        function (pos) {
          clearTimeout(giveUp);
          var lat = pos.coords.latitude.toFixed(6);
          var lng = pos.coords.longitude.toFixed(6);
          var nl = String.fromCharCode(10);
          send(nl + nl + "My location: https://maps.google.com/?q=" + lat + "," + lng);
        },
        function () { clearTimeout(giveUp); send(""); },
        { enableHighAccuracy: true, timeout: 6500, maximumAge: 60000 }
      );
    });
  }

  /* ---------- 7. Footer year ---------- */
  var years = document.querySelectorAll(".js-year");
  for (var y = 0; y < years.length; y++) {
    years[y].textContent = new Date().getFullYear();
  }
})();
