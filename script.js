// =================================================
// ARQUIVO script.js - VERSÃO CORRIGIDA
// =================================================

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
    const clearBtn = document.getElementById('clearBtn');

    // --- FUNÇÕES AUXILIARES ---
    const getOperadoraNome = (op) => {
        const nomes = {
            'amil': 'Amil',
            'amil-selecionada': 'Amil Selecionada',
            'bradesco': 'Bradesco',
            'sulamerica': 'Sul América',
            'hapvida': 'Hapvida',
            'liv-saude': 'Liv Saúde'
        };
        return nomes[op] || op;
    };

    const getTipoNome = (tipo) => {
        const tipos = {
            'hospital': 'Hospital',
            'laboratorio': 'Laboratório',
            'clinica': 'Clínica'
        };
        return tipos[tipo] || tipo;
    };

    const mostrarLoading = () => {
        loading.classList.remove('hidden');
        noResults.classList.add('hidden');
        resultsContainer.innerHTML = '';
    };

    const esconderLoading = () => {
        loading.classList.add('hidden');
    };

    // --- LÓGICA DE BUSCA E RENDERIZAÇÃO ---
    function realizarBusca() {
        console.log('Realizando busca...');
        console.log('Total de dados:', dadosHospitais.length);
        
        const termo = searchInput.value.trim().toLowerCase();
        const filtros = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.id);

        console.log('Termo de busca:', termo);
        console.log('Filtros selecionados:', filtros);

        if (filtros.length === 0) {
            resultsContainer.innerHTML = '<div class="initial-message"><h3>Selecione ao menos uma operadora para buscar.</h3></div>';
            return;
        }

        const resultados = dadosHospitais.filter(h => {
            // Verifica se tem as propriedades necessárias
            if (!h.nome || !h.operadoras) {
                console.warn('Registro com dados incompletos:', h);
                return false;
            }

            const matchTermo = !termo || 
                h.nome.toLowerCase().includes(termo) || 
                (h.cidade && h.cidade.toLowerCase().includes(termo)) || 
                (h.estado && h.estado.toLowerCase().includes(termo));

            const matchOperadoras = Array.isArray(h.operadoras) && 
                h.operadoras.some(op => filtros.includes(op));

            console.log(`${h.nome}: termo=${matchTermo}, operadoras=${matchOperadoras}`, {
                operadorasHospital: h.operadoras,
                filtros: filtros
            });

            return matchTermo && matchOperadoras;
        });

        console.log('Resultados encontrados:', resultados.length);
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
        
        const resultadosHTML = resultados.map(h => {
            const operadorasBadges = (h.operadoras || []).map(op => 
                `<span class="operadora-badge ${op}">${getOperadoraNome(op)}</span>`
            ).join('');

            const modalidadesHTML = h.modalidades ? 
                `<div class="result-modalidades"><strong>Modalidades:</strong> ${h.modalidades}</div>` : '';

            return `
                <div class="result-card">
                    <div class="result-header">
                        <h3 class="result-title">${h.nome}</h3>
                        <span class="result-type">${getTipoNome(h.tipo)}</span>
                    </div>
                    <p class="result-location">
                        <i class="fas fa-map-marker-alt"></i> 
                        ${h.cidade || 'Cidade não informada'}, ${h.estado || 'Estado não informado'}
                    </p>
                    <div class="result-operadoras">${operadorasBadges}</div>
                    ${modalidadesHTML}
                </div>
            `;
        }).join('');

        resultsContainer.innerHTML = resultadosHTML;
    }

    // --- INICIALIZAÇÃO E CARREGAMENTO DE DADOS ---
    function inicializar() {
        mostrarLoading();
        console.log('Inicializando aplicação...');
        
        // Mensagem inicial
        resultsContainer.innerHTML = `
            <div class="initial-message">
                <i class="fas fa-search"></i>
                <h3>Bem-vindo à Rede de Atendimento</h3>
                <p>Selecione as operadoras desejadas e digite o nome do hospital, clínica ou cidade para buscar.</p>
            </div>
        `;
        
        esconderLoading();
    }

    // --- CARREGAMENTO DOS DADOS DO FIREBASE ---
    console.log('Configurando listener do Firebase...');
    
    hospitaisCollection.onSnapshot(snapshot => {
        console.log("Snapshot recebido do Firebase!");
        console.log("Número de documentos:", snapshot.size);
        
        dadosHospitais = [];
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log('Documento carregado:', doc.id, data);
            dadosHospitais.push({ id: doc.id, ...data });
        });
        
        console.log("Dados carregados:", dadosHospitais.length, "registros");
        console.log("Amostra dos dados:", dadosHospitais.slice(0, 2));
        
        // Se há dados, realiza uma busca inicial
        if (dadosHospitais.length > 0) {
            realizarBusca();
        } else {
            resultsContainer.innerHTML = `
                <div class="initial-message">
                    <i class="fas fa-database"></i>
                    <h3>Nenhum dado encontrado</h3>
                    <p>Parece que ainda não há hospitais cadastrados no sistema.</p>
                </div>
            `;
        }
        
        esconderLoading();
        
    }, error => {
        console.error("Erro ao conectar com Firebase: ", error);
        esconderLoading();
        resultsContainer.innerHTML = `
            <div class="initial-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro ao conectar com o banco de dados</h3>
                <p>Verifique sua conexão com a internet e tente novamente.</p>
            </div>
        `;
    });

    // --- EVENT LISTENERS ---
    if (searchInput) {
        searchInput.addEventListener('input', realizarBusca);
        console.log('Event listener do campo de busca configurado');
    }

    if (checkboxes.length > 0) {
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                console.log('Checkbox alterado:', cb.id, cb.checked);
                realizarBusca();
            });
        });
        console.log('Event listeners dos checkboxes configurados');
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            console.log('Botão limpar clicado');
            searchInput.value = '';
            checkboxes.forEach(cb => cb.checked = true);
            realizarBusca();
        });
        console.log('Event listener do botão limpar configurado');
    }

    // --- INICIALIZAÇÃO ---
    inicializar();
    console.log('Script inicializado com sucesso!');
});
