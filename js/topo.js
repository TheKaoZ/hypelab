(function () {
  'use strict';

  var topo = document.getElementById('inicio');
  if (!topo) return;

  var pedeMenos = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var temObservador = 'IntersectionObserver' in window;

  /* ---------- Vídeo do topo (só existe quando a Hype Lab mandar o arquivo) ---------- */
  var video = topo.querySelector('video');
  if (video) {
    var naTela = true;
    topo.classList.add('com-video');
    video.muted = true; // sem som: o atributo muted sozinho nem sempre basta para o autoplay

    var atualizarVideo = function () {
      if (pedeMenos.matches || !naTela || document.hidden) {
        video.pause();
      } else {
        var promessa = video.play();
        // O navegador pode recusar o autoplay; nesse caso fica o poster, sem erro no console.
        if (promessa && promessa.catch) promessa.catch(function () {});
      }
    };

    // Quem pede menos movimento não toca nada: tira o autoplay para ficar só o poster.
    if (pedeMenos.matches) {
      video.removeAttribute('autoplay');
      video.pause();
    }
    // Se o arquivo não carregar, some o vídeo e fica o desenho de fundo.
    video.addEventListener('error', function () {
      video.classList.add('falhou');
      topo.classList.remove('com-video');
    }, true);

    if (temObservador) {
      new IntersectionObserver(function (itens) {
        naTela = itens[0].isIntersecting;
        atualizarVideo();
      }, { threshold: 0.05 }).observe(topo);
    }
    document.addEventListener('visibilitychange', atualizarVideo);
    if (pedeMenos.addEventListener) pedeMenos.addEventListener('change', atualizarVideo);
    else if (pedeMenos.addListener) pedeMenos.addListener(atualizarVideo);
  }

  /* ---------- Números: contam de 0 até data-valor quando aparecem na tela ---------- */
  var numeros = topo.querySelectorAll('.tp-valor[data-valor]');

  // Texto do número, com separador de milhar em português e prefixo e sufixo opcionais.
  function formatar(el, valor) {
    var casas = parseInt(el.getAttribute('data-decimais'), 10) || 0;
    var texto = valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
    return (el.getAttribute('data-prefixo') || '') + texto + (el.getAttribute('data-sufixo') || '');
  }

  function preparar(el) {
    var bruto = (el.getAttribute('data-valor') || '').trim().replace(',', '.');
    if (bruto === '') return; // valor ainda não chegou: fica o espaço reservado
    var alvo = Number(bruto);
    if (!isFinite(alvo)) return;

    var final = formatar(el, alvo);
    el.textContent = '';
    var visivel = document.createElement('span');
    visivel.setAttribute('aria-hidden', 'true');
    // O leitor de tela lê só o valor final, nunca a contagem no meio do caminho.
    var leitor = document.createElement('span');
    leitor.className = 'so-leitor';
    leitor.textContent = final;
    el.appendChild(visivel);
    el.appendChild(leitor);

    if (pedeMenos.matches || !temObservador) {
      visivel.textContent = final;
      return;
    }
    visivel.textContent = formatar(el, 0);

    var contar = function () {
      var duracao = 1600;
      var inicio = null;
      var passo = function (agora) {
        if (inicio === null) inicio = agora;
        var t = Math.min((agora - inicio) / duracao, 1);
        var suave = 1 - Math.pow(1 - t, 3); // começa rápido e desacelera no fim
        visivel.textContent = formatar(el, alvo * suave);
        if (t < 1) window.requestAnimationFrame(passo);
        else visivel.textContent = final;
      };
      window.requestAnimationFrame(passo);
    };

    var observador = new IntersectionObserver(function (itens) {
      if (!itens[0].isIntersecting) return;
      observador.disconnect();
      if (pedeMenos.matches) visivel.textContent = final;
      else contar();
    }, { threshold: 0.6 });
    observador.observe(el);
  }

  for (var i = 0; i < numeros.length; i++) preparar(numeros[i]);
})();
