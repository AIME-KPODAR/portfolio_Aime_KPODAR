/* ==========================================================================
   Portfolio — script commun : menu mobile, bilingue FR/EN, texte défilant,
   formulaires WhatsApp. Les traductions sont dans js/translations.js.
   ========================================================================== */
(function () {
    'use strict';

    var I18N = window.I18N || { fr: {}, en: {} };
    var SUPPORTED = ['fr', 'en'];
    var WHATSAPP_NUMBER = '22897953754'; // format international, sans + ni espaces
    var currentLang = 'fr';

    /* ---------- Langue ---------- */
    function detectLang() {
        try {
            var q = new URLSearchParams(window.location.search).get('lang');
            if (SUPPORTED.indexOf(q) !== -1) return q;
        } catch (e) { /* ignore */ }
        try {
            var saved = window.localStorage.getItem('lang');
            if (SUPPORTED.indexOf(saved) !== -1) return saved;
        } catch (e) { /* stockage indisponible (navigation privée…) */ }
        var nav = (navigator.language || 'fr').slice(0, 2).toLowerCase();
        return nav === 'fr' ? 'fr' : 'en';
    }

    function t(key) {
        var d = I18N[currentLang] || {};
        if (d[key] !== undefined) return d[key];
        return (I18N.fr || {})[key];
    }

    function setLogo(el, word) {
        if (!word) return;
        el.textContent = '';
        var first = document.createElement('span');
        first.textContent = word.charAt(0);
        el.appendChild(first);
        el.appendChild(document.createTextNode(word.slice(1)));
        var dot = document.createElement('b');
        dot.textContent = '.';
        el.appendChild(dot);
    }

    function applyLang(lang) {
        if (SUPPORTED.indexOf(lang) === -1) lang = 'fr';
        currentLang = lang;
        document.documentElement.lang = lang;
        try { window.localStorage.setItem('lang', lang); } catch (e) { /* ignore */ }

        var nodes, i, v;

        nodes = document.querySelectorAll('[data-i18n]');
        for (i = 0; i < nodes.length; i++) {
            v = t(nodes[i].getAttribute('data-i18n'));
            if (v !== undefined) nodes[i].textContent = v;
        }
        nodes = document.querySelectorAll('[data-i18n-html]');
        for (i = 0; i < nodes.length; i++) {
            v = t(nodes[i].getAttribute('data-i18n-html'));
            if (v !== undefined) nodes[i].innerHTML = v;
        }
        var attrMap = {
            'data-i18n-aria': 'aria-label',
            'data-i18n-ph': 'placeholder',
            'data-i18n-alt': 'alt',
            'data-i18n-title': 'title'
        };
        Object.keys(attrMap).forEach(function (dataAttr) {
            var list = document.querySelectorAll('[' + dataAttr + ']');
            for (var j = 0; j < list.length; j++) {
                var val = t(list[j].getAttribute(dataAttr));
                if (val !== undefined) list[j].setAttribute(attrMap[dataAttr], val);
            }
        });
        nodes = document.querySelectorAll('[data-logo]');
        for (i = 0; i < nodes.length; i++) setLogo(nodes[i], t(nodes[i].getAttribute('data-logo')));

        var page = document.body.getAttribute('data-page');
        var title = page && t('title_' + page);
        if (title) document.title = title;

        var buttons = document.querySelectorAll('.lang button[data-lang]');
        for (i = 0; i < buttons.length; i++) {
            buttons[i].setAttribute('aria-pressed', buttons[i].getAttribute('data-lang') === lang ? 'true' : 'false');
        }

        document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
    }

    /* ---------- Menu mobile ---------- */
    function initMenu() {
        var burger = document.querySelector('.burger');
        var panel = document.getElementById('menu-panel');
        if (!burger || !panel) return;
        var desktop = window.matchMedia('(min-width: 1100px)');

        function setOpen(open) {
            panel.classList.toggle('open', open);
            burger.setAttribute('aria-expanded', open ? 'true' : 'false');
            burger.setAttribute('aria-label', t(open ? 'aria_menu_close' : 'aria_menu_open') || '');
            burger.setAttribute('data-i18n-aria', open ? 'aria_menu_close' : 'aria_menu_open');
            document.body.classList.toggle('menu-open', open);
        }

        burger.addEventListener('click', function () {
            setOpen(burger.getAttribute('aria-expanded') !== 'true');
        });
        panel.addEventListener('click', function (e) {
            if (e.target.closest('a')) setOpen(false);
        });
        document.addEventListener('click', function (e) {
            if (burger.getAttribute('aria-expanded') === 'true' &&
                !e.target.closest('.menu-panel') && !e.target.closest('.burger')) setOpen(false);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
                setOpen(false);
                burger.focus();
            }
        });
        var onChange = function () { if (desktop.matches) setOpen(false); };
        if (desktop.addEventListener) desktop.addEventListener('change', onChange);
        else if (desktop.addListener) desktop.addListener(onChange);
    }

    /* ---------- Texte défilant (accueil) — sans dépendance externe ---------- */
    function initTyped() {
        var el = document.getElementById('textDefile');
        if (!el) return;
        var timer = null;
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function start() {
            if (timer) clearTimeout(timer);
            var strings = t('typed');
            if (!strings || !strings.length) return;
            if (reduce) { el.textContent = strings[0]; return; }
            var s = 0, c = 0, deleting = false;
            (function tick() {
                var word = strings[s];
                c += deleting ? -1 : 1;
                el.textContent = word.slice(0, c);
                var delay = deleting ? 45 : 85;
                if (!deleting && c === word.length) { deleting = true; delay = 1400; }
                else if (deleting && c === 0) { deleting = false; s = (s + 1) % strings.length; delay = 400; }
                timer = setTimeout(tick, delay);
            })();
        }
        document.addEventListener('langchange', start);
        start();
    }

    /* ---------- Formulaires -> WhatsApp ---------- */
    function initForms() {
        var form = document.querySelector('form[data-wa-form]');
        if (!form) return;
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var name = form.elements.nom.value.trim();
            var email = form.elements.email.value.trim();
            var message = form.elements.message.value.trim();
            var subject = t(form.getAttribute('data-wa-subject'));
            var text = [
                (t('wa_hello') || '').replace('{name}', name),
                (t('wa_subject') || '') + ' ' + subject,
                (t('wa_email') || '') + ' ' + email,
                (t('wa_message') || '') + ' ' + message
            ].join('\n');
            var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
            var w = window.open(url, '_blank', 'noopener');
            if (!w) window.location.href = url;
        });
    }

    /* ---------- Démarrage ---------- */
    document.addEventListener('DOMContentLoaded', function () {
        var buttons = document.querySelectorAll('.lang button[data-lang]');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function (e) {
                applyLang(e.currentTarget.getAttribute('data-lang'));
            });
        }
        initMenu();
        applyLang(detectLang());
        initTyped();
        initForms();
    });
})();
