// Portfólio (carrossel e vídeos), trabalhos (filtro) e nada mais.
// Cada bloco confere se o seu elemento existe e sai quieto se não existir.
(function () {
  'use strict';

  var reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Carrossel: botões, contador e barra de progresso ---------- */
  function iniciarCarrossel() {
    var raiz = document.getElementById('portfolio');
    if (!raiz) return;
    var pista = raiz.querySelector('.pf-pista');
    if (!pista || !pista.children.length) return;

    var cartoes = Array.prototype.slice.call(pista.children);
    var anterior = raiz.querySelector('.pf-anterior');
    var proximo = raiz.querySelector('.pf-proximo');
    var contagem = raiz.querySelector('.pf-contagem');
    var marca = raiz.querySelector('.pf-barra-marca');
    var primeiro = 0;
    var ultimo = 0;
    var agendado = false;

    // Passo de um cartão: largura dele mais o espaço entre os dois.
    function passo() {
      return cartoes.length > 1 ? cartoes[1].offsetLeft - cartoes[0].offsetLeft : pista.clientWidth;
    }

    function ir(sentido) {
      pista.scrollBy({ left: sentido * passo(), behavior: reduzMovimento.matches ? 'auto' : 'smooth' });
    }

    // Cartões que aparecem inteiros na pista. Se nenhum aparece inteiro (rolagem no meio), mantém o último resultado.
    function calcularVisiveis() {
      var caixa = pista.getBoundingClientRect();
      var a = -1;
      var b = -1;
      cartoes.forEach(function (cartao, i) {
        var r = cartao.getBoundingClientRect();
        if (r.left >= caixa.left - 4 && r.right <= caixa.right + 4) {
          if (a < 0) a = i;
          b = i;
        }
      });
      if (a >= 0) { primeiro = a; ultimo = b; }
    }

    function atualizar() {
      agendado = false;
      calcularVisiveis();
      var max = pista.scrollWidth - pista.clientWidth;
      var noInicio = pista.scrollLeft <= 1;
      var noFim = pista.scrollLeft >= max - 1;
      // Nas pontas, o primeiro e o último cartão contam como visíveis mesmo se cortados por poucos pixels.
      if (noInicio) primeiro = 0;
      if (noFim) ultimo = cartoes.length - 1;
      if (contagem) {
        contagem.textContent = (primeiro === ultimo ? (primeiro + 1) : (primeiro + 1) + ' a ' + (ultimo + 1)) + ' de ' + cartoes.length;
      }
      if (marca) {
        var total = pista.scrollWidth || 1;
        marca.style.width = Math.min(100, pista.clientWidth / total * 100) + '%';
        marca.style.left = (max > 0 ? pista.scrollLeft / total * 100 : 0) + '%';
      }
      // aria-disabled em vez de disabled: o foco do teclado não se perde ao chegar na ponta.
      if (anterior) anterior.setAttribute('aria-disabled', noInicio ? 'true' : 'false');
      if (proximo) proximo.setAttribute('aria-disabled', noFim ? 'true' : 'false');
    }

    function agendar() {
      if (agendado) return;
      agendado = true;
      window.requestAnimationFrame(atualizar);
    }

    function clicar(botao, sentido) {
      if (!botao) return;
      botao.addEventListener('click', function () {
        if (botao.getAttribute('aria-disabled') === 'true') return;
        ir(sentido);
      });
    }
    clicar(anterior, -1);
    clicar(proximo, 1);

    // Teclado: setas, Home e End na pista (e nos botões dos cartões).
    pista.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(-1); }
      else if (e.key === 'Home' && e.target === pista) { e.preventDefault(); pista.scrollTo({ left: 0, behavior: reduzMovimento.matches ? 'auto' : 'smooth' }); }
      else if (e.key === 'End' && e.target === pista) { e.preventDefault(); pista.scrollTo({ left: pista.scrollWidth, behavior: reduzMovimento.matches ? 'auto' : 'smooth' }); }
    });

    pista.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
    atualizar();
  }

  /* ---------- Vídeos: toca só o cartão visível, som em um por vez ---------- */
  function iniciarVideos() {
    var raiz = document.getElementById('portfolio');
    if (!raiz) return;
    var blocos = raiz.querySelectorAll('.pf-video');
    if (!blocos.length) return;

    var itens = [];
    var temObservador = 'IntersectionObserver' in window;

    function tocar(item) {
      // Quem pausou à mão não é retomado sozinho; com movimento reduzido nada começa sozinho.
      if (item.pausadoPorMim || reduzMovimento.matches || document.hidden) return;
      var promessa = item.video.play();
      if (promessa && promessa.catch) promessa.catch(function () {});
    }

    function sincronizar(item) {
      var tocando = !item.video.paused && !item.video.ended;
      item.bloco.classList.toggle('tocando', tocando);
      if (item.play) {
        var rotulo = item.play.getAttribute('data-rotulo');
        item.play.setAttribute('aria-label', (tocando ? 'Pausar' : 'Reproduzir') + rotulo);
      }
      if (item.som) item.som.setAttribute('aria-pressed', item.video.muted ? 'false' : 'true');
    }

    Array.prototype.forEach.call(blocos, function (bloco) {
      var video = bloco.querySelector('video');
      if (!video) return;
      video.muted = true; // começa sempre sem som
      var item = {
        bloco: bloco, video: video,
        play: bloco.querySelector('.pf-play'), som: bloco.querySelector('.pf-som'),
        visivel: false, pausadoPorMim: false
      };
      if (item.play) {
        // Guarda o final do nome ("vídeo 3") para trocar só o verbo do rótulo.
        item.play.setAttribute('data-rotulo', item.play.getAttribute('aria-label').replace(/^\S+/, ''));
        item.play.addEventListener('click', function () {
          if (video.paused) {
            item.pausadoPorMim = false;
            var p = video.play();
            if (p && p.catch) p.catch(function () {});
          } else {
            item.pausadoPorMim = true;
            video.pause();
          }
        });
      }
      if (item.som) {
        item.som.addEventListener('click', function () {
          var ligar = video.muted;
          // Ligar o som de um vídeo deixa todos os outros mudos.
          itens.forEach(function (outro) { if (outro !== item) outro.video.muted = true; });
          video.muted = !ligar;
        });
      }
      ['play', 'pause', 'ended', 'volumechange'].forEach(function (nome) {
        video.addEventListener(nome, function () {
          // volumechange de um vídeo muda o botão de todos, por causa do silêncio dos outros.
          if (nome === 'volumechange') itens.forEach(sincronizar); else sincronizar(item);
        });
      });
      itens.push(item);
      sincronizar(item);
    });
    if (!itens.length) return;

    if (temObservador) {
      var observador = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          var item = itens.filter(function (i) { return i.video.closest('.pf-cartao') === e.target; })[0];
          if (!item) return;
          // Visível = pelo menos 60% do cartão na tela. Em tela muito baixa, o cartão pode ser maior que a tela:
          // vale também ocupar 60% da altura da tela, desde que a largura esteja quase toda à mostra.
          var alvo = e.boundingClientRect;
          var raizCaixa = e.rootBounds;
          var visivel = e.isIntersecting && (e.intersectionRatio >= 0.6 ||
            (raizCaixa && e.intersectionRect.height >= raizCaixa.height * 0.8 && e.intersectionRect.width >= alvo.width * 0.9));
          item.visivel = visivel;
          if (visivel) {
            tocar(item);
          } else {
            item.pausadoPorMim = false;
            item.video.pause();
          }
        });
      }, { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] });
      itens.forEach(function (item) { observador.observe(item.video.closest('.pf-cartao')); });
    }

    // Aba em segundo plano: pausa tudo. Ao voltar, retoma só o que está visível.
    document.addEventListener('visibilitychange', function () {
      itens.forEach(function (item) {
        if (document.hidden) item.video.pause();
        else if (item.visivel) tocar(item);
      });
    });

    // Quem liga "reduzir movimento" no sistema com a página aberta: tudo para.
    function aoMudarMovimento() {
      if (reduzMovimento.matches) itens.forEach(function (item) { item.video.pause(); });
      else itens.forEach(function (item) { if (item.visivel) tocar(item); });
    }
    if (reduzMovimento.addEventListener) reduzMovimento.addEventListener('change', aoMudarMovimento);
  }

  /* ---------- Trabalhos: filtro por formato ---------- */
  function iniciarFiltro() {
    var raiz = document.getElementById('trabalhos');
    if (!raiz) return;
    var botoes = raiz.querySelectorAll('.tr-filtro');
    var itens = raiz.querySelectorAll('.tr-item');
    if (!botoes.length || !itens.length) return;
    var status = raiz.querySelector('.tr-status');
    var vazia = raiz.querySelector('.tr-vazia');

    function aplicar(filtro) {
      var mostrados = 0;
      Array.prototype.forEach.call(itens, function (item) {
        var categorias = (item.getAttribute('data-categoria') || '').split(/\s+/);
        var mostrar = filtro === 'todos' || categorias.indexOf(filtro) !== -1;
        var estavaOculto = item.hidden;
        item.hidden = !mostrar;
        if (mostrar) {
          mostrados++;
          if (estavaOculto && !reduzMovimento.matches) {
            item.classList.add('entrando');
            item.addEventListener('animationend', function fim() {
              item.classList.remove('entrando');
              item.removeEventListener('animationend', fim);
            });
          }
        }
      });
      Array.prototype.forEach.call(botoes, function (botao) {
        botao.setAttribute('aria-pressed', botao.getAttribute('data-filtro') === filtro ? 'true' : 'false');
      });
      if (vazia) vazia.hidden = mostrados !== 0;
      if (status) status.textContent = 'Mostrando ' + mostrados + ' de ' + itens.length + ' posts';
    }

    Array.prototype.forEach.call(botoes, function (botao) {
      botao.addEventListener('click', function () { aplicar(botao.getAttribute('data-filtro')); });
    });
  }

  iniciarCarrossel();
  iniciarVideos();
  iniciarFiltro();
})();
