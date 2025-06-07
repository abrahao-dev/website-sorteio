document.addEventListener('DOMContentLoaded', () => {
  // --- SELEÇÃO DE ELEMENTOS DO DOM ---
  const setupScreen = document.getElementById('setup-screen');
  const resultScreen = document.getElementById('result-screen');
  const drawButton = document.getElementById('draw-button');
  const nameInput = document.getElementById('name-input');
  const quantityInput = document.getElementById('quantity');
  const quantityResultInput = document.getElementById('quantity-result');
  const animationToggle = document.getElementById('animation-toggle');
  const noRepeatToggle = document.getElementById('no-repeat-toggle');
  const csvUpload = document.getElementById('csv-upload');
  const resultDisplay = document.getElementById('result-display');
  const totalNamesInfo = document.getElementById('total-names-info');
  const drawAgainButton = document.getElementById('draw-again-button');
  const backLink = document.getElementById('back-link');
  const downloadLogButton = document.getElementById('download-log-button');
  const countdownOverlay = document.getElementById('countdown-overlay');
  const countdownTimer = document.getElementById('countdown-timer');
  const historyPanel = document.getElementById('history-panel');
  const historyList = document.getElementById('history-list');
  const clearHistoryButton = document.getElementById('clear-history-button');
  const themeToggle = document.getElementById('theme-toggle');
  const howItWorksLink = document.getElementById('how-it-works-link');
  // Modal elements
  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalButtons = document.getElementById('modal-buttons');

  // --- ESTADO DA APLICAÇÃO ---
  let allNames = [];
  let history = [];
  let lastDrawId = null;

  // --- ÍCONES SVG ---
  const sunIcon =
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-500"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  const moonIcon =
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

  // --- FUNÇÕES DE TEMA ---
  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      themeToggle.innerHTML = moonIcon;
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      themeToggle.innerHTML = sunIcon;
    }
  }

  function handleThemeToggle() {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  }

  // --- FUNÇÕES DE MODAL ---
  function showModal(title, message, buttons) {
    modalTitle.textContent = title;
    modalMessage.innerHTML = message;
    modalButtons.innerHTML = '';

    buttons.forEach(btnInfo => {
      const button = document.createElement('button');
      button.textContent = btnInfo.text;
      button.className =
        `font-bold py-2 px-4 rounded-lg transition text-white ${btnInfo.className || 'bg-gray-500 hover:bg-gray-600'}`;
      button.onclick = () => {
        closeModal();
        if (btnInfo.onClick) btnInfo.onClick();
      };
      modalButtons.appendChild(button);
    });

    modalOverlay.classList.remove('hidden');
  }

  function closeModal() {
    modalOverlay.classList.add('hidden');
  }

  // --- FUNÇÕES DE PERSISTÊNCIA E AUDITORIA ---
  function saveHistoryToLocalStorage() {
    try {
      localStorage.setItem('sorteioHistory', JSON.stringify(history));
    } catch (e) {
      console.error("Não foi possível salvar o histórico no LocalStorage:", e);
      showModal("Erro",
        "Não foi possível salvar o histórico. O armazenamento do navegador pode estar cheio ou desativado.",
        [{
          text: "OK",
          className: 'bg-indigo-600 hover:bg-indigo-700'
        }]);
    }
  }

  function loadHistoryFromLocalStorage() {
    try {
      const savedHistory = localStorage.getItem('sorteioHistory');
      if (savedHistory) {
        history = JSON.parse(savedHistory).map(draw => ({
          ...draw,
          timestamp: new Date(draw.timestamp)
        }));
        updateHistoryDisplay();
      }
    } catch (e) {
      console.error("Não foi possível carregar o histórico do LocalStorage:", e);
    }
  }

  function generateAndDownloadLog() {
    const currentDraw = history.find(d => d.id === lastDrawId);
    if (!currentDraw) {
      showModal("Erro", "Não foi possível encontrar o registro do último sorteio para download.",
        [{
          text: "OK",
          className: 'bg-red-600 hover:bg-red-700'
        }]);
      return;
    }

    const date = currentDraw.timestamp.toLocaleDateString('pt-BR');
    const time = currentDraw.timestamp.toLocaleTimeString('pt-BR');

    let logContent = `--------------------------------------------------\n`;
    logContent += ` REGISTRO DE SORTEIO\n`;
    logContent += `--------------------------------------------------\n\n`;
    logContent += `ID do Sorteio: ${currentDraw.id}\n`;
    logContent += `Data: ${date}\n`;
    logContent += `Hora: ${time}\n\n`;
    logContent += `--------------------------------------------------\n`;
    logContent += ` VENCEDOR(ES) DESTA RODADA\n`;
    logContent += `--------------------------------------------------\n`;
    currentDraw.winners.forEach((winner, index) => {
      logContent += `${index + 1}. ${winner}\n`;
    });
    logContent += `\n--------------------------------------------------\n`;
    logContent += ` LISTA COMPLETA DE PARTICIPANTES NO MOMENTO DO SORTEIO\n`;
    logContent += `--------------------------------------------------\n`;
    allNames.forEach((name, index) => {
      logContent += `${index + 1}. ${name}\n`;
    });
    logContent += `\n-------------------- FIM DO REGISTRO --------------------\n`;

    const blob = new Blob([logContent], {
      type: 'text/plain;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registro-sorteio-${currentDraw.id.substring(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- FUNÇÕES PRINCIPAIS DA APLICAÇÃO ---

  function parseNamesFromInput() {
    return nameInput.value.split(/[\n,]+/).map(name => name.trim()).filter(name => name.length > 0);
  }

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => nameInput.value = e.target.result;
    reader.readAsText(file);
  }

  function runCountdown(onComplete) {
    countdownOverlay.classList.remove('hidden');
    let count = 3;
    countdownTimer.textContent = count;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        countdownTimer.textContent = count;
      } else {
        clearInterval(interval);
        countdownOverlay.classList.add('hidden');
        onComplete();
      }
    }, 1000);
  }

  function launchConfetti() {
    confetti({
      particleCount: 150,
      spread: 90,
      origin: {
        y: 0.6
      }
    });
  }

  function performDraw() {
    allNames = parseNamesFromInput();
    if (allNames.length === 0) {
      showModal("Atenção", "Por favor, insira nomes para o sorteio.", [{
        text: 'OK',
        className: 'bg-indigo-600 hover:bg-indigo-700'
      }]);
      return;
    }

    let availableNames;
    if (noRepeatToggle.checked) {
      const alreadyDrawn = history.flatMap(draw => draw.winners);
      availableNames = allNames.filter(name => !alreadyDrawn.includes(name));
    } else {
      availableNames = [...allNames];
    }

    const quantityToDraw = parseInt(quantityInput.value, 10);

    if (availableNames.length === 0) {
      showModal("Fim do Sorteio",
        "Não há nomes disponíveis. Verifique se todos já foram sorteados no modo 'Não repetir'.",
        [{
          text: 'OK',
          className: 'bg-indigo-600 hover:bg-indigo-700'
        }]);
      return;
    }
    if (quantityToDraw > availableNames.length) {
      showModal("Atenção",
        `Você quer sortear ${quantityToDraw} nome(s), mas só há ${availableNames.length} disponível(is).`,
        [{
          text: 'OK',
          className: 'bg-indigo-600 hover:bg-indigo-700'
        }]);
      return;
    }

    const drawWinners = () => {
      const currentWinners = [];
      for (let i = 0; i < quantityToDraw; i++) {
        const randomIndex = Math.floor(Math.random() * availableNames.length);
        const winner = availableNames[randomIndex];
        currentWinners.push(winner);
        availableNames.splice(randomIndex, 1);
      }

      const newDraw = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        winners: currentWinners
      };

      lastDrawId = newDraw.id;
      history.push(newDraw);

      saveHistoryToLocalStorage();
      displayResults(newDraw);
      updateHistoryDisplay();
      launchConfetti();
    };

    if (animationToggle.checked) {
      runCountdown(drawWinners);
    } else {
      drawWinners();
    }
  }

  function displayResults(drawObject) {
    setupScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    resultDisplay.innerHTML = '';

    drawObject.winners.forEach((winner) => {
      const resultCard = `
                <div class="winner-card p-6 rounded-lg text-center border">
                    <p class="winner-name text-3xl font-bold">${winner}</p>
                    <p class="text-muted mt-2">🎉 Parabéns! 🎉</p>
                </div>
            `;
      resultDisplay.insertAdjacentHTML('beforeend', resultCard);
    });

    totalNamesInfo.textContent = `Total de nomes na lista: ${allNames.length}`;
    quantityResultInput.value = quantityInput.value;
  }

  function updateHistoryDisplay() {
    // Sempre manter o painel de histórico visível
    historyPanel.classList.remove('hidden');
    historyList.innerHTML = '';

    // Se não houver histórico, exibir uma mensagem informativa
    if (history.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'text-center py-6';
      emptyMessage.innerHTML = `
                <p class="text-lg mb-2">Nenhum sorteio realizado ainda</p>
                <p class="text-sm text-muted">Os resultados aparecerão aqui</p>
            `;
      historyList.appendChild(emptyMessage);
      return;
    }

    let totalWinners = 0;
    history.forEach(draw => totalWinners += draw.winners.length);

    let winnerCount = totalWinners;
    history.slice().reverse().forEach((draw) => {
      const drawGroup = document.createElement('div');
      drawGroup.className = 'mb-4';

      const drawTitle = document.createElement('p');
      drawTitle.className = "history-id text-sm mb-2 border-b pb-1 text-muted";
      drawTitle.textContent = `Sorteio ID: ${draw.id.substring(0,8)}...`;
      drawGroup.appendChild(drawTitle);

      const winnersOfThisDraw = draw.winners.slice().reverse();
      winnersOfThisDraw.forEach(winner => {
        const date = draw.timestamp.toLocaleDateString('pt-BR');
        const time = draw.timestamp.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        });

        const historyItemHTML = `
                    <div class="history-item p-3 rounded-md flex items-center gap-3 mt-2">
                        <span class="text-lg font-semibold text-muted">${winnerCount}º</span>
                        <span class="text-xl">🎁</span>
                        <div class="flex-grow">
                            <p class="font-bold text-lg">${winner}</p>
                            <p class="text-xs text-muted">${date} às ${time}</p>
                        </div>
                    </div>
                `;
        drawGroup.insertAdjacentHTML('beforeend', historyItemHTML);
        winnerCount--;
      });
      historyList.appendChild(drawGroup);
    });
  }

  // --- INICIALIZAÇÃO E EVENT LISTENERS ---
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);
  loadHistoryFromLocalStorage();

  drawButton.addEventListener('click', performDraw);
  csvUpload.addEventListener('change', handleFileUpload);
  drawAgainButton.addEventListener('click', () => {
    quantityInput.value = quantityResultInput.value;
    performDraw();
  });
  downloadLogButton.addEventListener('click', generateAndDownloadLog);

  backLink.addEventListener('click', (e) => {
    e.preventDefault();
    resultScreen.classList.add('hidden');
    setupScreen.classList.remove('hidden');
  });

  clearHistoryButton.addEventListener('click', () => {
    showModal(
      "Confirmar Ação",
      "Tem certeza que deseja apagar TODO o histórico de sorteios? Esta ação não pode ser desfeita.",
      [{
          text: 'Sim, apagar tudo',
          className: 'bg-red-600 hover:bg-red-700',
          onClick: () => {
            history = [];
            saveHistoryToLocalStorage();
            updateHistoryDisplay();
          }
        },
        {
          text: 'Cancelar',
          className: 'bg-gray-500 hover:bg-gray-600'
        }
      ]
    );
  });

  themeToggle.addEventListener('click', handleThemeToggle);

  howItWorksLink.addEventListener('click', (e) => {
    e.preventDefault();
    const content = `
            <p>Esta ferramenta foi criada para realizar sorteios de nomes de forma <strong>transparente e segura</strong>, ideal para eventos e promoções.</p>
            <p><strong>Segurança e Transparência:</strong></p>
            <ul class="list-disc list-inside space-y-2 mt-2 text-muted">
                <li><strong>ID Único (Hash):</strong> Cada rodada de sorteio gera um ID único e impossível de prever, garantindo a integridade de cada sorteio.</li>
                <li><strong>Registro em .txt:</strong> Ao final de cada sorteio, você pode baixar um arquivo de texto (.txt) com o ID, data, hora, vencedores e a lista completa de participantes daquele momento. Isso serve como uma prova auditável do resultado.</li>
                <li><strong>Persistência Local:</strong> Todo o histórico fica salvo no seu navegador. Se fechar a página, não perderá os dados.</li>
            </ul>
            <p class="mt-4"><strong>Funcionalidades:</strong></p>
            <ul class="list-disc list-inside space-y-2 mt-2 text-muted">
                <li><strong>Não Repetir Nomes:</strong> Garante que um mesmo nome não seja sorteado novamente enquanto o histórico não for limpo.</li>
                <li><strong>Carregar de Arquivo:</strong> Você pode inserir nomes manualmente ou carregar uma lista diretamente de um arquivo .csv.</li>
            </ul>
        `;
    showModal("Como o Sorteador Funciona", content, [{
      text: 'Entendi!',
      className: 'bg-indigo-600 hover:bg-indigo-700'
    }]);
  });
});