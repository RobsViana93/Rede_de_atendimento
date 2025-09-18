document.addEventListener('DOMContentLoaded', () => {
    // --- VARIÁVEIS GLOBAIS ---
    const hospitaisCollection = db.collection('hospitais');
    let dadosHospitais = [];

    // --- ELEMENTOS DO DOM ---
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    const loading = document.getElementById('loading');
    const noResults = document.getElementById('noResults');
    const checkboxes = document.querySelectorAll('.operadora-checkbox input');

    // --- FUNÇÕES AUXILIARES ---
    const getOperadoraNome = (op) => ({ 'amil': 'Amil', 'amil-selecionada': 'Amil Selecionada', 'bradesco': 'Bradesco', 'sulamerica': 'Sul América', 'hapvida': 'Hapvida', 'liv-saude': 'Liv Saúde' }[op] || op);
    const getTipoNome = (tipo) => ({ 'hospital': 'Hospital', 'laboratorio': 'Laboratório', 'clinica': 'Clínica' }[tipo] || tipo);
    const mostrarLoading = () => { loading.classList.remove('hidden'); noResults.classList.add('hidden'); resultsContainer.innerHTML = ''; };
    const esconderLoading = () => loading.classList.add('hidden');

    // --- LÓGICA DE BUSCA E RENDERIZAÇÃO ---
    function realizarBusca() {
        const termo = searchInput.value.trim().toLowerCase();
        const filtros = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.id);

        if (filtros.length === 0) {
            resultsContainer.innerHTML = '<div class="initial-message"><h3>Selecione ao menos uma operadora para buscar.</h3></div>';
            return;
        }

        const resultados = dadosHospitais.filter(h => {
            const matchTermo = !termo || h.nome.toLowerCase().includes(termo) || h.cidade.toLowerCase().includes(termo) || h.estado.toLowerCase().includes(termo);
            const matchOperadoras = h.operadoras.some(op => filtros.includes(op));
            return matchTermo && matchOperadoras;
        });

        mostrarResultados(resultados);
    }

    function mostrarResultados(resultados) {
        esconderLoading();
        if (resultados.length === 0) {
            noResults.classList.remove('hidden');
            resultsContainer.innerHTML = '';
            return;
        }
        noResults.classList.add('hidden');
        resultsContainer.innerHTML = resultados.map(h => `
            <div class="result-card">
                <div class="result-header">
                    <h3 class="result-title">${h.nome}</h3>
                    <span class="result-type">${getTipoNome(h.tipo)}</span>
                </div>
                <p class="result-location"><i class="fas fa-map-marker-alt"></i> ${h.cidade}, ${h.estado}</p>
                <div class="result-operadoras">${(h.operadoras || []).map(op => `<span class="operadora-badge ${op}">${getOperadoraNome(op)}</span>`).join('')}</div>
                ${h.modalidades ? `<div class="result-modalidades"><strong>Modalidades:</strong> ${h.modalidades}</div>` : ''}
            </div>`).join('');
    }

    // --- CARGA INICIAL ---
    mostrarLoading();
    hospitaisCollection.get().then(snapshot => {
        dadosHospitais = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        realizarBusca(); // Realiza a busca inicial com os filtros padrão
    }).catch(error => {
        console.error("Erro ao carregar dados: ", error);
        esconderLoading();
        resultsContainer.innerHTML = '<div class="initial-message"><h3>Erro ao conectar com o banco de dados.</h3></div>';
    });

    // --- EVENT LISTENERS ---
    searchInput.addEventListener('input', realizarBusca);
    checkboxes.forEach(cb => cb.addEventListener('change', realizarBusca));
    document.getElementById('clearBtn').addEventListener('click', () => {
        searchInput.value = '';
        checkboxes.forEach(cb => cb.checked = true);
        realizarBusca();
    });
});
