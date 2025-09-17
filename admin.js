// Dados globais
const hospitaisCollection = db.collection('hospitais');
let dadosUpload = [];

// Elementos do DOM
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const manualForm = document.getElementById('manualForm');
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadPreview = document.getElementById('uploadPreview');
const previewTable = document.getElementById('previewTable');
const confirmUpload = document.getElementById('confirmUpload');
const cancelUpload = document.getElementById('cancelUpload');
const viewSearch = document.getElementById('viewSearch');
const viewFilter = document.getElementById('viewFilter');
const dataTable = document.getElementById('dataTable');
const exportData = document.getElementById('exportData');

// Sistema de abas
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        
        // Remover classe active de todos os botões e conteúdos
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Adicionar classe active ao botão e conteúdo selecionado
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        
        // Se for a aba de visualização, carregar dados
        if (tabId === 'view') {
            carregarDadosTabela();
        }
    });
});

// Função para gerar código único
function gerarCodigoUnico() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `HOSP${timestamp}${random}`.toUpperCase();
}

// Função para verificar se hospital já existe
function hospitalJaExiste(nome, estado, cidade) {
    return dadosHospitais.some(h => 
        h.nome.toLowerCase() === nome.toLowerCase() &&
        h.estado.toLowerCase() === estado.toLowerCase() &&
        h.cidade.toLowerCase() === cidade.toLowerCase()
    );
}

// Cadastro Manual
manualForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(manualForm);
    const operadoras = formData.getAll('operadoras');
    
    // Verificar se operadoras foram selecionadas
    if (operadoras.length === 0) {
        alert('Selecione pelo menos uma operadora!');
        return;
    }
    
    const nome = formData.get('nome').trim();
    const estado = formData.get('estado').trim();
    const cidade = formData.get('cidade').trim();
    
    // Verificar se campos obrigatórios estão preenchidos
    if (!nome || !estado || !cidade) {
        alert('Por favor, preencha todos os campos obrigatórios!');
        return;
    }
    
    // Verificar se hospital já existe
    if (hospitalJaExiste(nome, estado, cidade)) {
        alert('Este hospital já está cadastrado no sistema!');
        return;
    }
    
    const modalidades = formData.get('modalidades') || '';
    
    const novoHospital = {
        nome: nome,
        estado: estado,
        cidade: cidade,
        tipo: formData.get('tipo'),
        operadoras: operadoras,
        modalidades: modalidades,
        planos: formData.get('planos') || '',
        codigo: gerarCodigoUnico()
    };
    
    // Adicionar à lista global
    dadosHospitais.push({
        ...novoHospital,
        id: Date.now()
    });
    
    // Salvar no localStorage
    localStorage.setItem('redeAtendimento', JSON.stringify(dadosHospitais));
    
    // Limpar formulário
    manualForm.reset();
    
    // Mostrar mensagem de sucesso com código
    mostrarMensagem(`Hospital cadastrado com sucesso! Código: ${novoHospital.codigo}`, 'success');
});

// Upload de arquivo
fileInput.addEventListener('change', handleFileUpload);

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
        alert('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            processarDadosPlanilha(jsonData);
        } catch (error) {
            alert('Erro ao processar o arquivo: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

function processarDadosPlanilha(dados) {
    dadosUpload = dados.map((row, index) => {
        // Normalizar nomes das colunas
        const nome = row.Nome || row.nome || row['Nome do Hospital/Clínica'] || '';
        const estado = row.Estado || row.estado || '';
        const cidade = row.Cidade || row.cidade || '';
        const tipo = row.Tipo || row.tipo || 'hospital';
        const operadoras = row.Operadoras || row.operadoras || '';
        const planos = row.Planos || row.planos || row['Modelos de Plano'] || '';
        
        // Processar operadoras
        let operadorasArray = [];
        if (operadoras) {
            operadorasArray = operadoras.split(',').map(op => op.trim().toLowerCase());
        }
        
        // Processar modalidades (texto livre)
        const modalidades = row.Modalidades || row.modalidades || '';
        
        return {
            nome,
            estado,
            cidade,
            tipo,
            operadoras: operadorasArray,
            modalidades: modalidades,
            planos,
            codigo: gerarCodigoUnico(),
            linha: index + 2 // +2 porque a primeira linha é o cabeçalho
        };
    }).filter(item => item.nome && item.estado && item.cidade); // Filtrar itens válidos
    
    mostrarPreviewUpload();
}

function mostrarPreviewUpload() {
    if (dadosUpload.length === 0) {
        alert('Nenhum dado válido encontrado na planilha!');
        return;
    }
    
    const tableHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="padding: 10px; border: 1px solid #ddd;">Código</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Nome</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Estado</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Cidade</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Tipo</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Operadoras</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Modalidades</th>
                </tr>
            </thead>
            <tbody>
                ${dadosUpload.map(item => `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>${item.codigo}</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${item.nome}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${item.estado}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${item.cidade}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${getTipoNome(item.tipo)}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">
                            ${item.operadoras.map(op => `<span class="operadora-badge ${op}">${getOperadoraNome(op)}</span>`).join(' ')}
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd;">
                            ${item.modalidades || '-'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    previewTable.innerHTML = tableHTML;
    uploadPreview.classList.remove('hidden');
}

confirmUpload.addEventListener('click', () => {
    // Adicionar dados à lista principal
    dadosUpload.forEach(item => {
        dadosHospitais.push({
            ...item,
            id: Date.now() + Math.random() // ID único
        });
    });
    
    // Salvar no localStorage
    localStorage.setItem('redeAtendimento', JSON.stringify(dadosHospitais));
    
    // Limpar preview
    uploadPreview.classList.add('hidden');
    fileInput.value = '';
    dadosUpload = [];
    
    mostrarMensagem(`${dadosUpload.length} registros importados com sucesso!`, 'success');
});

cancelUpload.addEventListener('click', () => {
    uploadPreview.classList.add('hidden');
    fileInput.value = '';
    dadosUpload = [];
});

// Visualização de dados
function carregarDadosTabela() {
    // --------------------------------------------------------------------
    // ADICIONE ESTE BLOCO NO INÍCIO DA FUNÇÃO:
    mostrarLoading(); // (Opcional, mas bom para feedback) Mostra um spinner enquanto carrega
    hospitaisCollection.get().then((querySnapshot) => {
        // O Firebase retorna os dados em um formato especial (querySnapshot).
        // Precisamos extrair e formatar para o nosso array `dadosHospitais`.
        dadosHospitais = querySnapshot.docs.map(doc => ({ 
            id: doc.id,      // Pega o ID único gerado pelo Firebase
            ...doc.data()  // Pega todos os outros campos (nome, cidade, etc.)
    });

    esconderLoading(); // Esconde o spinner
    // --------------------------------------------------------------------

        // O RESTO DA SUA FUNÇÃO ORIGINAL VEM AQUI DENTRO:
        // Todo o seu código de filtro e renderização continua o mesmo,
        // pois ele já trabalha com a variável `dadosHospitais` que acabamos de preencher.
        const termo = viewSearch.value.toLowerCase();
        const filtro = viewFilter.value;
        
        let dadosFiltrados = dadosHospitais.filter(item => {
            // ... (seu código de filtro aqui)
        });
        
        const tableHTML = `...`; // (seu código de renderização aqui)
        dataTable.innerHTML = tableHTML;

    // --------------------------------------------------------------------
    // ADICIONE O TRATAMENTO DE ERRO:
    }).catch((error) => {
        console.error("Erro ao buscar documentos: ", error);
        esconderLoading();
        dataTable.innerHTML = "<tr><td colspan='9'>Erro ao carregar dados do banco. Verifique o console.</td></tr>";
    });
    // --------------------------------------------------------------------
}

// Funções de loading (opcional, mas recomendado)
function mostrarLoading() {
    dataTable.innerHTML = "<tr><td colspan='9'>Carregando dados...</td></tr>";
}
function esconderLoading() {
    // Não faz nada, pois o conteúdo será substituído pela tabela ou mensagem de erro.
}
    
    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Nome</th>
                    <th>Estado</th>
                    <th>Cidade</th>
                    <th>Tipo</th>
                    <th>Operadoras</th>
                    <th>Modalidades</th>
                    <th>Planos</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${dadosFiltrados.map(item => `
                    <tr>
                        <td><strong>${item.codigo || 'N/A'}</strong></td>
                        <td>${item.nome}</td>
                        <td>${item.estado}</td>
                        <td>${item.cidade}</td>
                        <td>${getTipoNome(item.tipo)}</td>
                        <td>
                            ${item.operadoras.map(op => `<span class="operadora-badge ${op}">${getOperadoraNome(op)}</span>`).join(' ')}
                        </td>
                        <td>
                            ${item.modalidades || '-'}
                        </td>
                        <td>${item.planos || '-'}</td>
                        <td>
                            <div class="action-buttons">
                                <button onclick="editarHospital(${item.id})" class="btn-action btn-edit" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="excluirHospital(${item.id})" class="btn-action btn-delete" title="Excluir">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    dataTable.innerHTML = tableHTML;
}

// Elementos para exclusão em lote
const deleteOperadora = document.getElementById('deleteOperadora');
const deleteEstado = document.getElementById('deleteEstado');
const deleteBatch = document.getElementById('deleteBatch');
const deletePreview = document.getElementById('deletePreview');
const deletePreviewList = document.getElementById('deletePreviewList');

// Event listeners para visualização
viewSearch.addEventListener('input', carregarDadosTabela);
viewFilter.addEventListener('change', carregarDadosTabela);

// Event listeners para exclusão em lote
deleteOperadora.addEventListener('change', verificarExclusaoLote);
deleteEstado.addEventListener('change', verificarExclusaoLote);
deleteBatch.addEventListener('click', executarExclusaoLote);

// Exportar dados
exportData.addEventListener('click', () => {
    const dados = dadosHospitais.map(item => ({
        Código: item.codigo || 'N/A',
        Nome: item.nome,
        Estado: item.estado,
        Cidade: item.cidade,
        Tipo: item.tipo,
        Operadoras: item.operadoras.join(', '),
        Modalidades: item.modalidades || '',
        Planos: item.planos || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rede de Atendimento");
    
    const fileName = `rede_atendimento_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
});

// Funções auxiliares
function getOperadoraNome(operadora) {
    const nomes = {
        'amil': 'Amil Padrão',
        'amil-selecionada': 'Amil Selecionada',
        'bradesco': 'Bradesco',
        'sulamerica': 'Sul América'
    };
    return nomes[operadora] || operadora;
}

function getTipoNome(tipo) {
    const nomes = {
        'hospital': 'Hospital',
        'laboratorio': 'Laboratório',
        'clinica': 'Clínica'
    };
    return nomes[tipo] || tipo;
}



function mostrarMensagem(mensagem, tipo = 'info') {
    // Criar elemento de mensagem
    const msgElement = document.createElement('div');
    msgElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    if (tipo === 'success') {
        msgElement.style.background = '#28a745';
    } else {
        msgElement.style.background = '#007bff';
    }
    
    msgElement.textContent = mensagem;
    document.body.appendChild(msgElement);
    
    // Remover após 3 segundos
    setTimeout(() => {
        msgElement.remove();
    }, 3000);
}

// Funções de edição e exclusão
window.editarHospital = function(id) {
    const hospital = dadosHospitais.find(h => h.id === id);
    if (hospital) {
        // Preencher formulário com dados do hospital
        document.getElementById('nome').value = hospital.nome;
        document.getElementById('estado').value = hospital.estado;
        document.getElementById('cidade').value = hospital.cidade;
        document.getElementById('tipo').value = hospital.tipo;
        document.getElementById('planos').value = hospital.planos || '';
        
        // Marcar operadoras
        document.querySelectorAll('input[name="operadoras"]').forEach(checkbox => {
            checkbox.checked = hospital.operadoras.includes(checkbox.value);
        });
        
        // Preencher modalidades
        document.getElementById('modalidades').value = hospital.modalidades || '';
        
        // Mudar para aba de cadastro manual
        document.querySelector('[data-tab="manual"]').click();
        
        // Adicionar ID para edição
        manualForm.dataset.editId = id;
    }
};

window.excluirHospital = function(id) {
    const hospital = dadosHospitais.find(h => h.id === id);
    if (!hospital) return;
    
    const confirmacao = confirm(`Tem certeza que deseja excluir "${hospital.nome}"?\n\nEsta ação não pode ser desfeita.`);
    
    if (confirmacao) {
        dadosHospitais = dadosHospitais.filter(h => h.id !== id);
        localStorage.setItem('redeAtendimento', JSON.stringify(dadosHospitais));
        carregarDadosTabela();
        mostrarMensagem(`"${hospital.nome}" foi excluído com sucesso!`, 'success');
    }
};

// Modificar o formulário para suportar edição
manualForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(manualForm);
    const operadoras = formData.getAll('operadoras');
    
    // Verificar se operadoras foram selecionadas
    if (operadoras.length === 0) {
        alert('Selecione pelo menos uma operadora!');
        return;
    }
    
    const nome = formData.get('nome').trim();
    const estado = formData.get('estado').trim();
    const cidade = formData.get('cidade').trim();
    
    // Verificar se campos obrigatórios estão preenchidos
    if (!nome || !estado || !cidade) {
        alert('Por favor, preencha todos os campos obrigatórios!');
        return;
    }
    
    const modalidades = formData.get('modalidades') || '';
    
    const hospitalData = {
        nome: nome,
        estado: estado,
        cidade: cidade,
        tipo: formData.get('tipo'),
        operadoras: operadoras,
        modalidades: modalidades,
        planos: formData.get('planos') || ''
    };
    
    const editId = manualForm.dataset.editId;
    
    if (editId) {
        // Edição
        const index = dadosHospitais.findIndex(h => h.id === parseInt(editId));
        if (index !== -1) {
            // Manter o código original se existir
            const codigoOriginal = dadosHospitais[index].codigo;
            dadosHospitais[index] = { 
                ...dadosHospitais[index], 
                ...hospitalData,
                codigo: codigoOriginal || gerarCodigoUnico()
            };
            delete manualForm.dataset.editId;
            mostrarMensagem('Hospital atualizado com sucesso!', 'success');
        }
    } else {
        // Novo cadastro - verificar se já existe
        if (hospitalJaExiste(nome, estado, cidade)) {
            alert('Este hospital já está cadastrado no sistema!');
            return;
        }
        
        hospitalData.id = Date.now();
        hospitalData.codigo = gerarCodigoUnico();
        dadosHospitais.push(hospitalData);
        mostrarMensagem(`Hospital cadastrado com sucesso! Código: ${hospitalData.codigo}`, 'success');
    }
    
    localStorage.setItem('redeAtendimento', JSON.stringify(dadosHospitais));
    manualForm.reset();
});

// Melhorar interação com checkboxes de operadoras
document.addEventListener('DOMContentLoaded', () => {
    const operadoraCheckboxes = document.querySelectorAll('.operadora-checkbox');
    
    operadoraCheckboxes.forEach(checkbox => {
        const input = checkbox.querySelector('input[type="checkbox"]');
        const operadora = checkbox.dataset.operadora;
        
        // Adicionar feedback visual ao clicar
        checkbox.addEventListener('click', (e) => {
            // Pequeno delay para mostrar a animação
            setTimeout(() => {
                if (input.checked) {
                    mostrarMensagem(`${getOperadoraNome(operadora)} selecionada!`, 'info');
                } else {
                    mostrarMensagem(`${getOperadoraNome(operadora)} removida!`, 'info');
                }
            }, 100);
        });
        
        // Adicionar classe visual quando selecionado
        input.addEventListener('change', () => {
            if (input.checked) {
                checkbox.classList.add('selected');
            } else {
                checkbox.classList.remove('selected');
            }
        });
    });
});

// CSS para animação de mensagem
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .operadora-checkbox.selected {
        background: rgba(102, 126, 234, 0.1) !important;
        border-color: #667eea !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }
`;
document.head.appendChild(style);

// Função para verificar exclusão em lote
function verificarExclusaoLote() {
    const operadora = deleteOperadora.value;
    const estado = deleteEstado.value;
    
    if (!operadora || !estado) {
        deleteBatch.disabled = true;
        deletePreview.classList.add('hidden');
        return;
    }
    
    // Filtrar registros que serão excluídos
    const registrosParaExcluir = dadosHospitais.filter(item => 
        item.operadoras.includes(operadora) && item.estado === estado
    );
    
    if (registrosParaExcluir.length === 0) {
        deleteBatch.disabled = true;
        deletePreview.classList.add('hidden');
        return;
    }
    
    deleteBatch.disabled = false;
    
    // Mostrar preview dos registros que serão excluídos
    const previewHTML = registrosParaExcluir.map(item => `
        <div class="delete-item">
            <div>
                <div class="delete-item-name">${item.nome}</div>
                <div class="delete-item-location">${item.cidade}, ${item.estado}</div>
            </div>
            <div>
                ${item.operadoras.map(op => `<span class="operadora-badge ${op}">${getOperadoraNome(op)}</span>`).join(' ')}
            </div>
        </div>
    `).join('');
    
    deletePreviewList.innerHTML = previewHTML;
    deletePreview.classList.remove('hidden');
}

// Função para executar exclusão em lote
function executarExclusaoLote() {
    const operadora = deleteOperadora.value;
    const estado = deleteEstado.value;
    
    if (!operadora || !estado) {
        alert('Selecione uma operadora e um estado!');
        return;
    }
    
    const registrosParaExcluir = dadosHospitais.filter(item => 
        item.operadoras.includes(operadora) && item.estado === estado
    );
    
    if (registrosParaExcluir.length === 0) {
        alert('Nenhum registro encontrado para exclusão!');
        return;
    }
    
    const confirmacao = confirm(
        `Tem certeza que deseja excluir ${registrosParaExcluir.length} registro(s) da operadora ${getOperadoraNome(operadora)} no estado ${estado}?\n\nEsta ação não pode ser desfeita.`
    );
    
    if (confirmacao) {
        // Remover registros
        dadosHospitais = dadosHospitais.filter(item => 
            !(item.operadoras.includes(operadora) && item.estado === estado)
        );
        
        // Salvar no localStorage
        localStorage.setItem('redeAtendimento', JSON.stringify(dadosHospitais));
        
        // Limpar formulário
        deleteOperadora.value = '';
        deleteEstado.value = '';
        deleteBatch.disabled = true;
        deletePreview.classList.add('hidden');
        
        // Atualizar tabela
        carregarDadosTabela();
        
        mostrarMensagem(
            `${registrosParaExcluir.length} registro(s) excluído(s) com sucesso!`, 
            'success'
        );
    }
} 
