// Dados simulados - em produção, isso viria de uma API ou banco de dados
const hospitaisCollection = db.collection('hospitais');
let dadosHospitais = []; // Nosso cache de dados que virão do Firebase

// Elementos do DOM
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const resultsContainer = document.getElementById('resultsContainer');
const loading = document.getElementById('loading');
const noResults = document.getElementById('noResults');
const amilCheckbox = document.getElementById('amil');
const amilSelecionadaCheckbox = document.getElementById('amil-selecionada');
const bradescoCheckbox = document.getElementById('bradesco');
const sulamericaCheckbox = document.getElementById('sulamerica');
const hapvidaCheckbox = document.getElementById('hapvida');
const livSaudeCheckbox = document.getElementById('liv-saude');

// Nova função para carregar os dados
function carregarDadosIniciais() {
    mostrarLoading();
    hospitaisCollection.get().then((querySnapshot) => {
        dadosHospitais = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        esconderLoading();
        // Após carregar, podemos realizar uma busca inicial ou mostrar a mensagem padrão
        realizarBusca(); 
    }).catch(error => {
        console.error("Erro ao carregar dados: ", error);
        esconderLoading();
        resultsContainer.innerHTML = "<p>Não foi possível conectar ao banco de dados. Tente novamente mais tarde.</p>";
    });
}

// Função para salvar dados no localStorage
function salvarDados() {
    localStorage.setItem('redeAtendimento', JSON.stringify(dadosHospitais));
}

// Função para adicionar novo hospital
function adicionarHospital(hospital) {
    hospital.id = Date.now(); // ID único simples
    dadosHospitais.push(hospital);
    salvarDados();
}

// Função para buscar hospitais
function buscarHospitais(termo, filtros) {
    return dadosHospitais.filter(hospital => {
        // Filtro por termo de busca (nome, cidade ou estado)
        const matchTermo = !termo || 
            hospital.nome.toLowerCase().includes(termo.toLowerCase()) ||
            hospital.cidade.toLowerCase().includes(termo.toLowerCase()) ||
            hospital.estado.toLowerCase().includes(termo.toLowerCase());

        // Filtro por operadoras
        const operadorasSelecionadas = [];
        if (filtros.amil) operadorasSelecionadas.push('amil');
        if (filtros.amilSelecionada) operadorasSelecionadas.push('amil-selecionada');
        if (filtros.bradesco) operadorasSelecionadas.push('bradesco');
        if (filtros.sulamerica) operadorasSelecionadas.push('sulamerica');
        if (filtros.hapvida) operadorasSelecionadas.push('hapvida');
        if (filtros.livSaude) operadorasSelecionadas.push('liv-saude');

        // Se nenhuma operadora está selecionada, não mostrar resultados
        if (operadorasSelecionadas.length === 0) {
            return false;
        }

        // Verificar se o hospital tem pelo menos uma das operadoras selecionadas
        const matchOperadoras = hospital.operadoras.some(op => operadorasSelecionadas.includes(op));

        return matchTermo && matchOperadoras;
    });
}

// Função para mostrar loading
function mostrarLoading() {
    loading.classList.remove('hidden');
    noResults.classList.add('hidden');
    resultsContainer.innerHTML = '';
}

// Função para esconder loading
function esconderLoading() {
    loading.classList.add('hidden');
}

// Função para mostrar resultados
function mostrarResultados(resultados) {
    esconderLoading();
    
    if (resultados.length === 0) {
        noResults.classList.remove('hidden');
        resultsContainer.innerHTML = '';
        return;
    }

    noResults.classList.add('hidden');
    
    const resultadosHTML = resultados.map(hospital => {
        const operadorasHTML = hospital.operadoras.map(op => 
            `<span class="operadora-badge ${op}">${getOperadoraNome(op)}</span>`
        ).join('');

        return `
            <div class="result-card">
                <div class="result-header">
                    <h3 class="result-title">${hospital.nome}</h3>
                    <span class="result-type">${getTipoNome(hospital.tipo)}</span>
                </div>
                <p class="result-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${hospital.cidade}, ${hospital.estado}
                </p>
                <div class="result-operadoras">
                    ${operadorasHTML}
                </div>
                ${hospital.modalidades ? `<div class="result-modalidades"><strong>Modalidades:</strong> ${hospital.modalidades}</div>` : ''}
                ${hospital.planos ? `<p class="result-planos"><strong>Planos:</strong> ${hospital.planos}</p>` : ''}
            </div>
        `;
    }).join('');

    resultsContainer.innerHTML = resultadosHTML;
}

// Função para obter nome da operadora
function getOperadoraNome(operadora) {
    const nomes = {
        'amil': 'Amil',
        'amil-selecionada': 'Amil Selecionada',
        'bradesco': 'Bradesco',
        'sulamerica': 'Sul América',
        'hapvida': 'Hapvida',
        'liv-saude': 'Liv Saúde'
    };
    return nomes[operadora] || operadora;
}

// Função para obter nome do tipo
function getTipoNome(tipo) {
    const nomes = {
        'hospital': 'Hospital',
        'laboratorio': 'Laboratório',
        'clinica': 'Clínica'
    };
    return nomes[tipo] || tipo;
}

// Função para realizar busca
function realizarBusca() {
    const termo = searchInput.value.trim();
    
    const filtros = {
        amil: amilCheckbox.checked,
        amilSelecionada: amilSelecionadaCheckbox.checked,
        bradesco: bradescoCheckbox.checked,
        sulamerica: sulamericaCheckbox.checked,
        hapvida: hapvidaCheckbox.checked,
        livSaude: livSaudeCheckbox.checked
    };

    // Só mostrar loading se houver algum filtro ativo ou termo de busca
    const hasActiveFiltros = filtros.amil || filtros.amilSelecionada || filtros.bradesco || filtros.sulamerica || filtros.hapvida || filtros.livSaude;
    
    if (termo || hasActiveFiltros) {
        mostrarLoading();
        
        // Simular delay de busca
        setTimeout(() => {
            const resultados = buscarHospitais(termo, filtros);
            mostrarResultados(resultados);
        }, 500);
    } else {
        // Mostrar mensagem inicial se não houver filtros ou termo
        mostrarMensagemInicial();
    }
}

// Função para mostrar mensagem inicial
function mostrarMensagemInicial() {
    esconderLoading();
    noResults.classList.add('hidden');
    resultsContainer.innerHTML = `
        <div class="initial-message">
            <i class="fas fa-search"></i>
            <h3>Pesquise por hospitais e laboratórios</h3>
            <p>Digite o nome, cidade ou estado para encontrar estabelecimentos na rede de atendimento</p>
        </div>
    `;
}

// Função para limpar pesquisa
function limparPesquisa() {
    searchInput.value = '';
    amilCheckbox.checked = true;
    amilSelecionadaCheckbox.checked = true;
    bradescoCheckbox.checked = true;
    sulamericaCheckbox.checked = true;
    hapvidaCheckbox.checked = true;
    livSaudeCheckbox.checked = true;
    
    mostrarMensagemInicial();
}

// Event listeners
searchBtn.addEventListener('click', realizarBusca);
clearBtn.addEventListener('click', limparPesquisa);

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        realizarBusca();
    }
});

// Event listeners para filtros de operadoras
amilCheckbox.addEventListener('change', realizarBusca);
amilSelecionadaCheckbox.addEventListener('change', realizarBusca);
bradescoCheckbox.addEventListener('change', realizarBusca);
sulamericaCheckbox.addEventListener('change', realizarBusca);
hapvidaCheckbox.addEventListener('change', realizarBusca);
livSaudeCheckbox.addEventListener('change', realizarBusca);

// Busca automática ao digitar (com debounce)
let timeoutBusca;
searchInput.addEventListener('input', () => {
    clearTimeout(timeoutBusca);
    timeoutBusca = setTimeout(realizarBusca, 300);
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Mostrar mensagem inicial
    carregarDadosIniciais();
});

// Função para exportar dados (para uso na página admin)
window.exportarDados = function() {
    return dadosHospitais;
};

// Função para importar dados (para uso na página admin)
window.importarDados = function(novosDados) {
    dadosHospitais = novosDados;
    salvarDados();
    realizarBusca(); // Atualizar resultados
};
