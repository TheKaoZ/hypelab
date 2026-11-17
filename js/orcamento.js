// Formulário de orçamento: monta a mensagem e abre o WhatsApp da Hype Lab.
// O botão flutuante abre o WhatsApp com uma mensagem curta. O Meta Pixel só carrega depois que a pessoa aceita os cookies.
// O site não tem servidor: nada do formulário é gravado aqui, e o nome e a empresa não vão para a Meta.
(function () {
  'use strict';

  var CONFIG = {
    // ID do pixel (Gerenciador de Eventos da Meta). Vazio = sem pixel e sem aviso de cookies.
    pixelId: '',
    // Números com 55 + DDD, só dígitos.
    whatsapp: {
      hypelab: '' // RESERVADO: número do WhatsApp da Hype Lab. Vazio, o formulário avisa e o botão flutuante leva ao formulário.
    },
    // Cada serviço do formulário: como aparece na mensagem e para qual número vai. Os valores são os do index.html.
    // RESERVADO: lista provisória; trocar pelos serviços que a Hype Lab mandar.
    servicos: {
      video: { texto: 'gravação e edição de vídeos', destino: 'hypelab' },
      redes: { texto: 'gestão de redes sociais', destino: 'hypelab' },
      outro: { texto: 'outro serviço', destino: 'hypelab' }
    }
  };

  var CHAVE_COOKIES = 'cookies-anuncios'; // 'aceito' ou 'recusado'

  function lerEscolha() {
    try { return window.localStorage.getItem(CHAVE_COOKIES); } catch (e) { return null; }
  }

  function gravarEscolha(valor) {
    try {
      if (valor) window.localStorage.setItem(CHAVE_COOKIES, valor);
      else window.localStorage.removeItem(CHAVE_COOKIES);
    } catch (e) { /* navegador sem armazenamento: a escolha vale só nesta visita */ }
  }

  // Código base do Meta Pixel, fora do HTML para a CSP não precisar de 'unsafe-inline'.
  function carregarPixel() {
    if (!CONFIG.pixelId || window.fbq) return;
    var n = window.fbq = function () {
      if (n.callMethod) n.callMethod.apply(n, arguments); else n.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    // Sem configuração automática: o pixel não registra cliques em botão nem lê dados da página por conta própria.
    // A correspondência avançada automática (leitura de campos de formulário) se desliga no Gerenciador de Eventos.
    window.fbq('set', 'autoConfig', false, CONFIG.pixelId);
    window.fbq('init', CONFIG.pixelId);
    window.fbq('track', 'PageView');
  }

  // Com o aviso aberto, o botão flutuante sobe para não ficar por baixo dele.
  function mostrarAviso(aviso, mostrar) {
    aviso.hidden = !mostrar;
    document.body.classList.toggle('com-aviso', mostrar);
  }

  function iniciarCookies() {
    var aviso = document.getElementById('aviso-cookies');
    var rever = document.getElementById('rever-cookies');
    if (!CONFIG.pixelId) {
      // Sem pixel não há cookie de anúncio, então não há o que perguntar nem escolha para rever.
      var frase = document.getElementById('escolha-cookies');
      if (frase) frase.hidden = true;
      return;
    }
    var escolha = lerEscolha();
    if (escolha === 'aceito') carregarPixel();
    else if (escolha !== 'recusado' && aviso) mostrarAviso(aviso, true);

    document.getElementById('aceitar-cookies').addEventListener('click', function () {
      gravarEscolha('aceito');
      mostrarAviso(aviso, false);
      if (window.fbq) window.fbq('consent', 'grant'); else carregarPixel();
    });
    document.getElementById('recusar-cookies').addEventListener('click', function () {
      gravarEscolha('recusado');
      mostrarAviso(aviso, false);
      if (window.fbq) window.fbq('consent', 'revoke');
    });
    if (rever) rever.addEventListener('click', function () {
      gravarEscolha(null);
      mostrarAviso(aviso, true);
    });
  }

  // utm_campaign só com letras, números, hífen e sublinhado, para não levar lixo para a mensagem.
  function lerCampanha() {
    var valor = new URLSearchParams(window.location.search).get('utm_campaign') || '';
    return valor.replace(/[^\w-]/g, '').slice(0, 40);
  }

  function linkWhatsApp(numero, linhas) {
    var campanha = lerCampanha();
    if (campanha) linhas.push('Campanha: ' + campanha);
    return 'https://wa.me/' + numero + '?text=' + encodeURIComponent(linhas.join('\n'));
  }

  function iniciarFormulario() {
    var form = document.getElementById('form-orcamento');
    if (!form) return;
    var erro = document.getElementById('erro-form');

    // O navegador só dispara o submit com os campos válidos (required e pattern no HTML).
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      erro.textContent = '';
      var nome = form.elements.nome.value.trim();
      var empresa = form.elements.empresa.value.trim();
      var servico = form.elements.servico.value;
      var numero = CONFIG.servicos[servico] && CONFIG.whatsapp[CONFIG.servicos[servico].destino];
      if (!numero) {
        erro.textContent = 'Não foi possível abrir o WhatsApp: número não configurado.';
        return;
      }
      var url = linkWhatsApp(numero, [
        'Olá. Meu nome é ' + nome + ', da empresa ' + empresa + '.',
        'Gostaria de um orçamento de ' + CONFIG.servicos[servico].texto + '.',
        '',
        'Página: ' + form.dataset.nomePagina
      ]);

      if (window.fbq) {
        // Só a página e o serviço vão no evento; nome e empresa ficam fora.
        window.fbq('track', 'Lead', { content_name: form.dataset.pagina, content_category: servico });
        // Espera curta para o evento sair antes de a página trocar pelo WhatsApp.
        setTimeout(function () { window.location.href = url; }, 400);
      } else {
        window.location.href = url;
      }
    });
  }

  // Botão flutuante: com o número configurado, abre o WhatsApp direto; sem ele, continua levando ao formulário.
  function iniciarFlutuante() {
    var botao = document.getElementById('whatsapp-flutuante');
    var numero = CONFIG.whatsapp.hypelab;
    if (!botao || !numero) return;
    botao.href = linkWhatsApp(numero, ['Olá. Gostaria de um orçamento.', '', 'Página: Início (botão do WhatsApp)']);
    botao.target = '_blank';
    botao.rel = 'noopener noreferrer';
    // Contato direto conta separado do Lead, que fica só para o formulário.
    botao.addEventListener('click', function () {
      if (window.fbq) window.fbq('track', 'Contact', { content_name: 'botao-whatsapp' });
    });
  }

  function iniciar() {
    iniciarCookies();
    iniciarFormulario();
    iniciarFlutuante();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
