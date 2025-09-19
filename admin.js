// =================================================
// ARQUIVO admin.js - VERSÃO CORRIGIDA E COMPLETA
// =================================================

// 1. CONFIGURAÇÃO DO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBLjxxFLwx9VU23VyYpjsVjcdVB98Pzls4",
    authDomain: "rede-atendimento-planos.firebaseapp.com",
    projectId: "rede-atendimento-planos",
    storageBucket: "rede-atendimento-planos.appspot.com",
    messagingSenderId: "805398823851",
    appId: "1:805398823851:web:c8edb87faa4483490688ee"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. CÓDIGO PRINCIPAL DENTRO DO DOMCONTENTLOADED
document.addEventListener('DOMContentLoaded', () => {
    
    // --- VARIÁVEIS GLOBAIS ---
    const hospitaisCollection = db.collection('hospitais');
    let dadosHospitais = [];
    let dadosUpload = [];

    // --- ELEMENTOS DO DOM ---
    const confirmUploadBtn = document.getElementById('confirmUpload');
    const cancelUploadBtn = document.getElementById('cancelUpload');
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const uploadPreview = document.getElementById('uploadPreview');
    const previewTableContainer = document.getElementById('previewTableContainer');
    const manualForm = document.getElementById('manualForm');
    const dataTable = document.getElementById('dataTable');
    const viewSearch = document.getElementById('viewSearch');
    const viewFilter = document.getElementById('viewFilter');

    // --- SISTEMA DE ABAS ---
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(targetTab) {
        // Remove active de todos os botões e conteúdos
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Adiciona active ao botão e conteúdo selecionado
        const activeButton = document.querySelector(`[data-tab="${targetTab}"]`);
        const activeContent = document.getElementById(targetTab);
        
        if (activeButton && activeContent) {
            activeButton.classList.add('active');
            activeContent.classList.add('active');
            
            // Se mudou para a aba de visualização, carrega os dados
            if (targetTab === 'view') {
                carregarTabelaDados();
            }
        }
    }

    // Event listeners para as abas
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // --- CARREGAMENTO INICIAL DOS DADOS ---
    function carregarDadosIniciais() {
        console.log('Carregando dados iniciais...');
        hospitaisCollection.get().then(snapshot => {
            dadosHospitais = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(`${dadosHospitais.length} registros carregados com sucesso!`);
        }).catch(error => {
            console.error("Erro ao carregar dados iniciais: ", error);
        });
    }

    // --- FORMULÁRIO MANUAL ---
    if (manualForm) {
        manualForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(manualForm);
            const operadoras = [];
            
            // Coleta as operadoras selecionadas
            formData.getAll('operadoras').forEach(op => {
                if (op) operadoras.push(op);
            });
            
            if (operadoras.length === 0) {
                alert('Selecione ao menos uma operadora.');
                return;
            }
            
            const novoHospital = {
                nome: formData.get('nome').trim(),
                estado: formData.get('estado'),
                cidade: formData.get('cidade').trim(),
                tipo: formData.get('tipo'),
                operadoras: operadoras,
                modalidades: formData.get('modalidades')?.trim() || '',
                planos: formData.get('planos')?.trim() || ''
            };
            
            // Validação básica
            if (!novoHospital.nome || !novoHospital.estado || !novoHospital.cidade || !novoHospital.tipo) {
                alert('Preencha todos os campos obrigatórios.');
                return;
            }
            
            // Salva no Firebase
            hospitaisCollection.add(novoHospital).then(() => {
                alert('Cadastro realizado com sucesso!');
                manualForm.reset();
                carregarDadosIniciais(); // Recarrega os dados
            }).catch(error => {
                console.error("Erro ao salvar: ", error);
                alert('Erro ao salvar os dados. Verifique o console.');
            });
        });
    }

    // --- LÓGICA DE UPLOAD DE PLANILHA ---
    function processarDadosPlanilha(jsonData) {
        dadosUpload = [];
        
        dadosUpload = jsonData.map(row => {
            // Processa as operadoras (pode vir como string separada por vírgula)
            let operadoras = [];
            if (row.Operadoras) {
                operadoras = row.Operadoras.toString()
                    .split(',')
                    .map(op => op.trim().toLowerCase())
                    .filter(Boolean);
            }
            
            return {
                nome: (row.Nome || '').toString().trim(),
                estado: (row.Estado || '').toString().trim(),
                cidade: (row.Cidade || '').toString().trim(),
                tipo: (row.Tipo || 'hospital').toString().toLowerCase(),
                operadoras: operadoras,
                modalidades: (row.Modalidades || '').toString().trim(),
                planos: (row.Planos || '').toString().trim()
            };
        }).filter(item => item.nome && item.estado && item.cidade);
        
        if (dadosUpload.length === 0) {
            alert('Nenhum dado válido encontrado na planilha. Verifique se as colunas "Nome", "Estado" e "Cidade" estão preenchidas.');
            return;
        }
        
        // Cria prévia
        const previewHTML = `
            <div style="padding: 20px; background: rgba(37, 2, 15, 0.8); border-radius: 10px;">
                <p style="color: #FF1168; font-weight: bold; margin-bottom: 15px;">
                    ${dadosUpload.length} registros prontos para upload
                </p>
                <p style="color: #ECECEC; margin-bottom: 10px;">Prévia dos primeiros 5:</p>
                <ul style="color: #8F8F8F; list-style: none; padding: 0;">
                    ${dadosUpload.slice(0, 5).map(item => 
                        `<li style="padding: 8px; border-bottom: 1px solid #9E1E4C; margin-bottom: 5px;">
                            <strong style="color: #ECECEC;">${item.nome}</strong><br>
                            <small>${item.cidade}, ${item.estado} • ${item.operadoras.length} operadora(s)</small>
                        </li>`
                    ).join('')}
                </ul>
                ${dadosUpload.length > 5 ? `<p style="color: #8F8F8F; font-style: italic;">... e mais ${dadosUpload.length - 5} registros</p>` : ''}
            </div>
        `;
        
        previewTableContainer.innerHTML = previewHTML;
        uploadPreview.classList.remove('hidden');
    }

    function handleFile(file) {
        if (!file || !file.name.match(/\.(xlsx|xls)$/)) {
            alert('Por favor, selecione um arquivo Excel (.xlsx ou .xls).');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                processarDadosPlanilha(jsonData);
            } catch (error) {
                console.error('Erro ao processar arquivo:', error);
                alert('Erro ao processar o arquivo: ' + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // --- EXCLUSÃO EM LOTE POR OPERADORA ---
    function criarControlesExclusaoLote() {
        return `
            <div style="background: rgba(158, 30, 76, 0.2); border: 2px solid #FF1168; border-radius: 15px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #FF1168; margin-bottom: 15px; font-size: 1.2rem;">
                    <i class="fas fa-trash-alt"></i> Exclusão em Lote por Operadora
                </h3>
                <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                    <select id="operadoraExclusao" style="padding: 10px 15px; border: 2px solid #9E1E4C; border-radius: 8px; font-size: 1rem; background: #25020F; color: #ECECEC; min-width: 200px;">
                        <option value="">Selecione uma operadora</option>
                        <option value="amil">Amil</option>
                        <option value="amil-selecionada">Amil Selecionada</option>
                        <option value="bradesco">Bradesco</option>
                        <option value="sulamerica">Sul América</option>
                        <option value="hapvida">Hapvida</option>
                        <option value="liv-saude">Liv Saúde</option>
                    </select>
                    <button id="visualizarExclusao" class="btn" style="background: #9E1E4C; color: #ECECEC; border: 2px solid #FF1168; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
                        <i class="fas fa-eye"></i> Visualizar Registros
                    </button>
                    <button id="confirmarExclusaoLote" class="btn" style="background: #9E1E4C; color: #ECECEC; border: 2px solid #FF1168; padding: 10px 20px; border-radius: 8px; cursor: pointer;" disabled>
                        <i class="fas fa-trash"></i> Excluir Selecionados
                    </button>
                </div>
                <div id="previewExclusao" style="margin-top: 15px; display: none;">
                    <div style="background: rgba(37, 2, 15, 0.8); border-radius: 8px; padding: 15px; border: 1px solid #9E1E4C;">
                        <p id="contadorExclusao" style="color: #FF1168; font-weight: 600; margin-bottom: 10px;"></p>
                        <div id="listaExclusao" style="max-height: 200px; overflow-y: auto; background: rgba(37, 2, 15, 0.5); border-radius: 5px; padding: 10px;">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- TABELA DE VISUALIZAÇÃO ---
    function carregarTabelaDados() {
        if (!dataTable) return;
        
        hospitaisCollection.get().then(snapshot => {
            const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            if (dados.length === 0) {
                dataTable.innerHTML = '<div style="padding: 40px; text-align: center; color: #8F8F8F;">Nenhum registro encontrado.</div>';
                return;
            }

            const controlesExclusao = criarControlesExclusaoLote();
            
            const tableHTML = `
                ${controlesExclusao}
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: rgba(158, 30, 76, 0.3);">
                            <th style="padding: 15px; border-bottom: 1px solid #9E1E4C; color: #ECECEC; text-align: left;">Nome</th>
                            <th style="padding: 15px; border-bottom: 1px solid #9E1E4C; color: #ECECEC; text-align: left;">Localização</th>
                            <th style="padding: 15px; border-bottom: 1px solid #9E1E4C; color: #ECECEC; text-align: left;">Tipo</th>
                            <th style="padding: 15px; border-bottom: 1px solid #9E1E4C; color: #ECECEC; text-align: left;">Operadoras</th>
                            <th style="padding: 15px; border-bottom: 1px solid #9E1E4C; color: #ECECEC; text-align: center;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dados.map(item => `
                            <tr style="transition: background 0.3s ease;" onmouseover="this.style.background='rgba(255, 17, 104, 0.1)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 15px; border-bottom: 1px solid #9E1E4C; color: #ECECEC;">${item.nome}</td>
                                <td style="padding: 15px; border-bottom: 1px solid #9E1E4C; color: #8F8F8F;">${item.cidade}, ${item.estado}</td>
                                <td style="padding: 15px; border-bottom: 1px solid #9E1E4C; color: #8F8F8F; text-transform: capitalize;">${item.tipo}</td>
                                <td style="padding: 15px; border-bottom: 1px solid #9E1E4C;">
                                    ${(item.operadoras || []).map(op => 
                                        `<span style="background: #9E1E4C; color: #ECECEC; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-right: 5px; display: inline-block; margin-bottom: 2px;">${getOperadoraNome(op)}</span>`
                                    ).join('')}
                                </td>
                                <td style="padding: 15px; border-bottom: 1px solid #9E1E4C; text-align: center;">
                                    <button onclick="editarItem('${item.id}')" style="background: #9E1E4C; color: #ECECEC; border: 1px solid #FF1168; padding: 6px 12px; border-radius: 6px; cursor: pointer; margin-right: 5px; font-size: 12px;">
                                        <i class="fas fa-edit"></i> Editar
                                    </button>
                                    <button onclick="excluirItem('${item.id}')" style="background: #9E1E4C; color: #ECECEC; border: 1px solid #FF1168; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                                        <i class="fas fa-trash"></i> Excluir
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            dataTable.innerHTML = tableHTML;
            
            // Adiciona event listeners para os controles de exclusão em lote
            configurarControlesExclusaoLote();
            
        }).catch(error => {
            console.error("Erro ao carregar dados da tabela:", error);
            dataTable.innerHTML = '<div style="padding: 40px; text-align: center; color: #FF1168;">Erro ao carregar dados.</div>';
        });
    }

    // --- CONTROLES DE EXCLUSÃO EM LOTE ---
    function configurarControlesExclusaoLote() {
        const operadoraSelect = document.getElementById('operadoraExclusao');
        const visualizarBtn = document.getElementById('visualizarExclusao');
        const confirmarBtn = document.getElementById('confirmarExclusaoLote');
        const previewDiv = document.getElementById('previewExclusao');
        const contadorP = document.getElementById('contadorExclusao');
        const listaDiv = document.getElementById('listaExclusao');
        
        let registrosParaExcluir = [];

        if (visualizarBtn) {
            visualizarBtn.addEventListener('click', () => {
                const operadoraSelecionada = operadoraSelect.value;
                
                if (!operadoraSelecionada) {
                    alert('Selecione uma operadora primeiro.');
                    return;
                }

                // Busca registros que contêm a operadora selecionada
                hospitaisCollection.get().then(snapshot => {
                    registrosParaExcluir = [];
                    
                    snapshot.docs.forEach(doc => {
                        const data = doc.data();
                        if (data.operadoras && data.operadoras.includes(operadoraSelecionada)) {
                            registrosParaExcluir.push({ id: doc.id, ...data });
                        }
                    });

                    if (registrosParaExcluir.length === 0) {
                        alert(`Nenhum registro encontrado com a operadora ${getOperadoraNome(operadoraSelecionada)}.`);
                        previewDiv.style.display = 'none';
                        confirmarBtn.disabled = true;
                        return;
                    }

                    // Mostra preview
                    contadorP.textContent = `${registrosParaExcluir.length} registros serão excluídos:`;
                    
                    listaDiv.innerHTML = registrosParaExcluir.map(item => `
                        <div style="padding: 8px; border-bottom: 1px solid #9E1E4C; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: #ECECEC;">${item.nome}</strong><br>
                                <small style="color: #8F8F8F;">${item.cidade}, ${item.estado}</small>
                            </div>
                            <div>
                                ${(item.operadoras || []).map(op => 
                                    `<span style="background: ${op === operadoraSelecionada ? '#FF1168' : '#9E1E4C'}; color: #ECECEC; padding: 2px 6px; border-radius: 8px; font-size: 10px; margin-left: 2px;">${getOperadoraNome(op)}</span>`
                                ).join('')}
                            </div>
                        </div>
                    `).join('');

                    previewDiv.style.display = 'block';
                    confirmarBtn.disabled = false;

                }).catch(error => {
                    console.error('Erro ao buscar registros:', error);
                    alert('Erro ao buscar registros.');
                });
            });
        }

        if (confirmarBtn) {
            confirmarBtn.addEventListener('click', () => {
                if (registrosParaExcluir.length === 0) {
                    alert('Nenhum registro selecionado para exclusão.');
                    return;
                }

                const operadoraNome = getOperadoraNome(operadoraSelect.value);
                const confirmacao = confirm(`Tem certeza que deseja excluir ${registrosParaExcluir.length} registros da operadora ${operadoraNome}?\n\nEsta ação não pode ser desfeita.`);
                
                if (!confirmacao) return;

                // Desabilita botão durante exclusão
                confirmarBtn.disabled = true;
                confirmarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';

                // Exclusão em lote usando batch
                const batch = db.batch();
                registrosParaExcluir.forEach(item => {
                    const docRef = hospitaisCollection.doc(item.id);
                    batch.delete(docRef);
                });

                batch.commit().then(() => {
                    alert(`${registrosParaExcluir.length} registros da operadora ${operadoraNome} foram excluídos com sucesso!`);
                    
                    // Reset dos controles
                    operadoraSelect.value = '';
                    previewDiv.style.display = 'none';
                    registrosParaExcluir = [];
                    
                    // Recarrega a tabela
                    carregarTabelaDados();
                    carregarDadosIniciais();
                    
                }).catch(error => {
                    console.error('Erro na exclusão em lote:', error);
                    alert('Erro ao excluir registros: ' + error.message);
                }).finally(() => {
                    confirmarBtn.disabled = false;
                    confirmarBtn.innerHTML = '<i class="fas fa-trash"></i> Excluir Selecionados';
                });
            });
        }
    }

    // Função auxiliar para nomes das operadoras
    function getOperadoraNome(op) {
        const nomes = {
            'amil': 'Amil',
            'amil-selecionada': 'Amil Selecionada',
            'bradesco': 'Bradesco',
            'sulamerica': 'Sul América',
            'hapvida': 'Hapvida',
            'liv-saude': 'Liv Saúde'
        };
        return nomes[op] || op;
    }

    // Funções globais para os botões da tabela
    window.editarItem = function(id) {
        alert('Função de edição em desenvolvimento. ID: ' + id);
    };

    window.excluirItem = function(id) {
        if (confirm('Tem certeza que deseja excluir este item?')) {
            hospitaisCollection.doc(id).delete().then(() => {
                alert('Item excluído com sucesso!');
                carregarTabelaDados();
                carregarDadosIniciais();
            }).catch(error => {
                console.error("Erro ao excluir:", error);
                alert('Erro ao excluir o item.');
            });
        }
    };

    // --- EVENT LISTENERS ---
    
    // Upload de arquivo
    if (fileInput) {
        fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    }

    // Drag and drop
    if (uploadArea) {
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
            if (e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    // Botão cancelar upload
    if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', () => {
            uploadPreview.classList.add('hidden');
            if (fileInput) fileInput.value = '';
            dadosUpload = [];
        });
    }

    // Botão confirmar upload - CORRIGIDO
    if (confirmUploadBtn) {
        confirmUploadBtn.addEventListener('click', () => {
            if (dadosUpload.length === 0) {
                alert("Não há dados para enviar. Por favor, selecione uma planilha primeiro.");
                return;
            }

            // Desabilita o botão
            confirmUploadBtn.disabled = true;
            confirmUploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

            // Upload em lote
            const batch = db.batch();
            dadosUpload.forEach(item => {
                const docRef = hospitaisCollection.doc();
                batch.set(docRef, item);
            });

            batch.commit().then(() => {
                alert(`${dadosUpload.length} registros foram importados com sucesso!`);
                cancelUploadBtn.click(); // Limpa a interface
                carregarDadosIniciais(); // Recarrega os dados
            }).catch(error => {
                console.error("Erro no upload:", error);
                alert("Erro ao enviar os dados: " + error.message);
            }).finally(() => {
                // Reabilita o botão
                confirmUploadBtn.disabled = false;
                confirmUploadBtn.innerHTML = '<i class="fas fa-upload"></i> Confirmar Upload';
            });
        });
    }

    // Busca na visualização
    if (viewSearch) {
        viewSearch.addEventListener('input', filtrarTabela);
    }
    
    if (viewFilter) {
        viewFilter.addEventListener('change', filtrarTabela);
    }

    function filtrarTabela() {
        // Implementação da filtragem seria aqui
        // Por simplicidade, recarrega a tabela
        carregarTabelaDados();
    }

    // --- INICIALIZAÇÃO ---
    carregarDadosIniciais();
    
    console.log('Admin.js carregado com sucesso!');
});
