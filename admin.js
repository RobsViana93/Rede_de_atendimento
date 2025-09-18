// =================================================
// ARQUIVO admin.js - VERSÃO FINAL E CORRIGIDA
// =================================================

// 1. CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE
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

// 2. TODO O CÓDIGO AGORA VIVE DENTRO DO DOMCONTENTLOADED
document.addEventListener('DOMContentLoaded', () => {
    // --- VARIÁVEIS GLOBAIS ---
    const hospitaisCollection = db.collection('hospitais');
    let dadosHospitais = [];
    let dadosUpload = [];

    // --- ELEMENTOS DO DOM ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const manualForm = document.getElementById('manualForm');
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const uploadPreview = document.getElementById('uploadPreview');
    const previewTableContainer = document.getElementById('previewTableContainer');
    const confirmUploadBtn = document.getElementById('confirmUpload'); // Renomeado para clareza
    const cancelUploadBtn = document.getElementById('cancelUpload');   // Renomeado para clareza
    const viewSearch = document.getElementById('viewSearch');
    const viewFilter = document.getElementById('viewFilter');
    const dataTable = document.getElementById('dataTable');

    // --- FUNÇÕES AUXILIARES ---
    const getOperadoraNome = (op) => ({ 'amil': 'Amil', 'amil-selecionada': 'Amil Selecionada', 'bradesco': 'Bradesco', 'sulamerica': 'Sul América', 'hapvida': 'Hapvida', 'liv-saude': 'Liv Saúde' }[op] || op);
    const getTipoNome = (tipo) => ({ 'hospital': 'Hospital', 'laboratorio': 'Laboratório', 'clinica': 'Clínica' }[tipo] || tipo);
    const mostrarLoading = () => dataTable.innerHTML = "<tr><td colspan='5'>Carregando...</td></tr>";
    const hospitalJaExiste = (nome, estado, cidade) => dadosHospitais.some(h => h.nome.toLowerCase() === nome.toLowerCase() && h.estado.toLowerCase() === estado.toLowerCase() && h.cidade.toLowerCase() === cidade.toLowerCase());

    function mostrarMensagem(mensagem, tipo = 'info') {
        const msgElement = document.createElement('div');
        msgElement.style.cssText = `position: fixed; top: 20px; right: 20px; padding: 15px 20px; border-radius: 8px; color: white; font-weight: 500; z-index: 1000; background: ${tipo === 'success' ? '#28a745' : '#007bff'}; animation: slideIn 0.3s ease;`;
        msgElement.textContent = mensagem;
        document.body.appendChild(msgElement);
        setTimeout(() => msgElement.remove(), 3000);
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO E LÓGICA ---
    function renderizarTabela() {
        const termo = viewSearch.value.toLowerCase();
        const filtro = viewFilter.value;
        const dadosFiltrados = dadosHospitais.filter(item => {
            const matchTermo = !termo || item.nome.toLowerCase().includes(termo) || item.cidade.toLowerCase().includes(termo) || item.estado.toLowerCase().includes(termo);
            const matchFiltro = !filtro || (item.operadoras && item.operadoras.includes(filtro));
            return matchTermo && matchFiltro;
        });

        if (dadosFiltrados.length === 0) {
            dataTable.innerHTML = "<tr><td colspan='5'>Nenhum registro encontrado.</td></tr>";
            return;
        }
        dataTable.innerHTML = `
            <table>
                <thead><tr><th>Nome</th><th>Local</th><th>Tipo</th><th>Operadoras</th><th>Ações</th></tr></thead>
                <tbody>
                    ${dadosFiltrados.map(item => `
                        <tr>
                            <td>${item.nome}</td>
                            <td>${item.cidade}, ${item.estado}</td>
                            <td>${getTipoNome(item.tipo)}</td>
                            <td>${(item.operadoras || []).map(op => `<span class="operadora-badge ${op}">${getOperadoraNome(op)}</span>`).join(' ')}</td>
                            <td>
                                <div class="action-buttons">
                                    <button onclick="window.editarHospital('${item.id}')" class="btn-action btn-edit" title="Editar"><i class="fas fa-edit"></i></button>
                                    <button onclick="window.excluirHospital('${item.id}')" class="btn-action btn-delete" title="Excluir"><i class="fas fa-trash"></i></button>
                                </div>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>`;
    }

    function carregarDadosTabela() {
        mostrarLoading();
        hospitaisCollection.get().then(snapshot => {
            dadosHospitais = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderizarTabela();
        }).catch(error => {
            console.error("Erro ao carregar dados: ", error);
            dataTable.innerHTML = "<tr><td colspan='5'>Erro ao carregar dados.</td></tr>";
        });
    }

    function processarDadosPlanilha(jsonData) {
        dadosUpload = jsonData.map(row => ({
            nome: row.Nome || '', estado: row.Estado || '', cidade: row.Cidade || '', tipo: row.Tipo || 'hospital',
            operadoras: (row.Operadoras || '').split(',').map(op => op.trim().toLowerCase()).filter(Boolean),
            modalidades: row.Modalidades || '', planos: row.Planos || ''
        })).filter(item => item.nome && item.estado && item.cidade);
        
        if (dadosUpload.length === 0) return alert('Nenhum dado válido encontrado na planilha.');
        
        const previewHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead><tr style="background: #f8f9fa; color: #333;"><th style="padding: 8px; border: 1px solid #ddd;">Nome</th><th style="padding: 8px; border: 1px solid #ddd;">Local</th></tr></thead>
                <tbody>${dadosUpload.slice(0, 5).map(item => `<tr><td style="padding: 8px; border: 1px solid #ddd;">${item.nome}</td><td style="padding: 8px; border: 1px solid #ddd;">${item.cidade}, ${item.estado}</td></tr>`).join('')}</tbody>
            </table>
            <p style="text-align: center; margin-top: 10px;">Preview de ${dadosUpload.length} registros.</p>`;
        
        previewTableContainer.innerHTML = previewHTML;
        uploadPreview.classList.remove('hidden');
    }

    function handleFile(file) {
        if (!file || !file.name.match(/\.(xlsx|xls)$/)) return alert('Selecione um arquivo Excel.');
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                processarDadosPlanilha(jsonData);
            } catch (error) { alert('Erro ao processar o arquivo: ' + error.message); }
        };
        reader.readAsArrayBuffer(file);
    }

    // --- EVENT LISTENERS ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            if (tabId === 'view') carregarDadosTabela();
        });
    });

    manualForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(manualForm);
        const hospitalData = {
            nome: formData.get('nome').trim(),
            estado: formData.get('estado').trim(),
            cidade: formData.get('cidade').trim(),
            tipo: formData.get('tipo'),
            operadoras: formData.getAll('operadoras'),
            modalidades: formData.get('modalidades') || '',
            planos: formData.get('planos') || ''
        };

        if (!hospitalData.nome || !hospitalData.estado || !hospitalData.cidade || hospitalData.operadoras.length === 0) {
            return alert('Preencha todos os campos obrigatórios (*)!');
        }

        const editId = manualForm.dataset.editId;
        const promise = editId ? hospitaisCollection.doc(editId).update(hospitalData) : hospitaisCollection.add(hospitalData);

        promise.then(() => {
            mostrarMensagem(`Hospital ${editId ? 'atualizado' : 'cadastrado'} com sucesso!`, 'success');
            manualForm.reset();
            delete manualForm.dataset.editId;
            if (document.getElementById('view').classList.contains('active')) {
                carregarDadosTabela();
            }
        }).catch(error => {
            console.error("Erro ao salvar: ", error);
            alert("Ocorreu um erro ao salvar no banco de dados.");
        });
    });

    viewSearch.addEventListener('input', renderizarTabela);
    viewFilter.addEventListener('change', renderizarTabela);

    // --- UPLOAD DE PLANILHA ---
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });

    cancelUploadBtn.addEventListener('click', () => {
        uploadPreview.classList.add('hidden');
        fileInput.value = '';
        dadosUpload = [];
    });

    confirmUploadBtn.addEventListener('click', () => {
        if (dadosUpload.length === 0) return;
        const batch = db.batch();
        dadosUpload.forEach(item => batch.set(hospitaisCollection.doc(), item));
        batch.commit().then(() => {
            mostrarMensagem(`${dadosUpload.length} registros importados com sucesso!`, 'success');
            cancelUploadBtn.click();
            if (document.getElementById('view').classList.contains('active')) {
                carregarDadosTabela();
            }
        }).catch(error => console.error("Erro no upload em lote: ", error));
    });

    // --- FUNÇÕES GLOBAIS PARA ONCLICK ---
    window.editarHospital = (id) => {
        const hospital = dadosHospitais.find(h => h.id === id);
        if (hospital) {
            manualForm.nome.value = hospital.nome;
            manualForm.estado.value = hospital.estado;
            manualForm.cidade.value = hospital.cidade;
            manualForm.tipo.value = hospital.tipo;
            manualForm.planos.value = hospital.planos || '';
            manualForm.modalidades.value = hospital.modalidades || '';
            document.querySelectorAll('input[name="operadoras"]').forEach(cb => cb.checked = hospital.operadoras.includes(cb.value));
            manualForm.dataset.editId = id;
            document.querySelector('[data-tab="manual"]').click();
        }
    };

    window.excluirHospital = (id) => {
        const hospital = dadosHospitais.find(h => h.id === id);
        if (hospital && confirm(`Tem certeza que deseja excluir "${hospital.nome}"?`)) {
            hospitaisCollection.doc(id).delete()
                .then(() => {
                    mostrarMensagem(`"${hospital.nome}" excluído.`, 'success');
                    carregarDadosTabela();
                })
                .catch(error => console.error("Erro ao excluir: ", error));
        }
    };
});
