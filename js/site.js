/* Menu do celular, entrada suave dos blocos ao rolar e links que abrem áreas fechadas (perguntas, privacidade). */
(function () {
  'use strict';

  // MENU DO CELULAR
  var botao = document.querySelector('.botao-menu');
  var menu = document.getElementById('menu');

  function fecharMenu() {
    if (!menu || !menu.classList.contains('aberto')) return;
    menu.classList.remove('aberto');
    botao.setAttribute('aria-expanded', 'false');
  }

  if (botao && menu) {
    botao.addEventListener('click', function () {
      var abrir = !menu.classList.contains('aberto');
      menu.classList.toggle('aberto', abrir);
      botao.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    });
    // Tocar num item leva até a seção e fecha o menu.
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) fecharMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('aberto')) {
        fecharMenu();
        botao.focus();
      }
    });
    // Ao girar o tablet ou alargar a janela, o menu largo assume e o do celular fecha.
    var largo = window.matchMedia('(min-width: 1200px)');
    var aoMudar = function (m) { if (m.matches) fecharMenu(); };
    if (largo.addEventListener) largo.addEventListener('change', aoMudar);
    else if (largo.addListener) largo.addListener(aoMudar);
  }

  // ENTRADA SUAVE: blocos com data-surge aparecem quando chegam na tela.
  // Irmãos entram um pouco depois do outro, até um limite, para a grade não demorar.
  var blocos = Array.prototype.slice.call(document.querySelectorAll('[data-surge]'));
  blocos.forEach(function (el) {
    var irmaos = Array.prototype.filter.call(el.parentElement.children, function (x) { return x.hasAttribute('data-surge'); });
    var posicao = irmaos.indexOf(el);
    if (posicao > 0) el.style.transitionDelay = Math.min(posicao, 5) * 80 + 'ms';
  });
  if ('IntersectionObserver' in window) {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('visivel');
        observador.unobserve(entrada.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    blocos.forEach(function (el) { observador.observe(el); });
  } else {
    blocos.forEach(function (el) { el.classList.add('visivel'); });
  }

  // LINK PARA DENTRO DE ÁREA FECHADA: abre a área antes de o navegador rolar até ela.
  function abrirEmVolta(alvo) {
    for (var d = alvo; d; d = d.parentElement) {
      if (d.tagName === 'DETAILS') d.open = true;
    }
  }
  function alvoDoEndereco(hash) {
    if (!hash || hash.length < 2) return null;
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) { return null; }
  }
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    var alvo = link && alvoDoEndereco(link.getAttribute('href'));
    if (alvo) abrirEmVolta(alvo);
  });
  var inicial = alvoDoEndereco(location.hash);
  if (inicial && inicial.tagName === 'DETAILS') {
    abrirEmVolta(inicial);
    inicial.scrollIntoView();
  }
})();
