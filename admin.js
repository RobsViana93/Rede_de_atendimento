// =================================================
// ARQUIVO admin.js - VERSÃO FINAL E CORRIGIDA
// =================================================

// 1. CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBLjxxFLwx9VU23VyYpjsVjcdVB98Pzls4", // Substitua com suas chaves reais
    authDomain: "rede-atendimento-planos.firebaseapp.com",
    projectId: "rede-atendimento-planos",
    storageBucket: "rede-atendimento-planos.appspot.com",
    messagingSenderId: "805398823851",
    appId: "1:805398823851:web:c8edb87faa4483490688ee"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. TODO O CÓDIGO AGORA VIVE DENTRO DO DOMCONTENTLOADED
// Isso garante que o script só rode depois que o HTML estiver 100% carregado.
document.addEventListener('DOMContentLoaded', () => {
    
    // --- VARIÁVEIS GLOBAIS ---
    const hospitaisCollection = db.collection('hospitais');
    let dadosHospitais = []; // Armazena os dados existentes para validação e visualização
    let dadosUpload = []; // Armazena os dados da planilha para o upload

    // --- ELEMENTOS DO DOM ---
    const confirmUploadBtn = document.getElementById('confirmUpload');
    const cancelUploadBtn = document.getElementById('cancelUpload');
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const uploadPreview = document.getElementById('uploadPreview');
    const previewTableContainer = document.getElementById('previewTableContainer');
    // (outros elementos do DOM que você já tinha)

    // --- CARREGAMENTO INICIAL DOS DADOS ---
    // É importante carregar os dados existentes para a função de visualização e para evitar duplicatas no cadastro manual.
    function carregarDadosIniciais() {
        hospitaisCollection.get().then(snapshot => {
            dadosHospitais = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("Dados iniciais carregados com sucesso!");
        }).catch(error => {
            console.error("Erro ao carregar dados iniciais: ", error);
        });
    }
    carregarDadosIniciais(); // Chama a função assim que a página carrega

    // --- LÓGICA DE UPLOAD DE PLANILHA ---

    function processarDadosPlanilha(jsonData) {
        // Limpa os dados de upload anteriores
        dadosUpload = []; 
        
        dadosUpload = jsonData.map(row => ({
            nome: row.Nome || '', 
            estado: row.Estado || '', 
            cidade: row.Cidade || '', 
            tipo: (row.Tipo || 'hospital').toLowerCase(),
            operadoras: (row.Operadoras || '').split(',').map(op => op.trim().toLowerCase()).filter(Boolean),
            modalidades: row.Modalidades || '', 
            planos: row.Planos || ''
        })).filter(item => item.nome && item.estado && item.cidade); // Garante que apenas linhas válidas sejam processadas
        
        if (dadosUpload.length === 0) {
            alert('Nenhum dado válido encontrado na planilha. Verifique se as colunas "Nome", "Estado" e "Cidade" estão preenchidas.');
            return;
        }
        
        // Cria uma prévia simples para o usuário
        const previewHTML = `
            <p><strong>${dadosUpload.length} registros</strong> prontos para upload.</p>
            <p>Prévia dos 5 primeiros:</p>
            <ul style="text-align: left; list-style: inside;">
                ${dadosUpload.slice(0, 5).map(item => `<li>${item.nome} - ${item.cidade}, ${item.estado}</li>`).join('')}
            </ul>`;
        
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
                alert('Ocorreu um erro ao processar o arquivo: ' + error.message); 
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // --- EVENT LISTENERS ---

    // Listener para o input de arquivo
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    // Listeners para arrastar e soltar (Drag and Drop)
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // Listener para o botão de cancelar
    cancelUploadBtn.addEventListener('click', () => {
        uploadPreview.classList.add('hidden');
        fileInput.value = ''; // Limpa o seletor de arquivo
        dadosUpload = []; // Limpa os dados em memória
    });

    // **AQUI ESTÁ A CORREÇÃO PRINCIPAL**
    // O listener do botão de confirmação agora está dentro do DOMContentLoaded e funciona corretamente.
    confirmUploadBtn.addEventListener('click', () => {
        if (dadosUpload.length === 0) {
            alert("Não há dados para enviar. Por favor, selecione uma planilha primeiro.");
            return;
        }

        // Desabilita o botão para evitar cliques duplos
        confirmUploadBtn.disabled = true;
        confirmUploadBtn.textContent = 'Enviando...';

        // Usa o processamento em lote (batch) do Firebase para performance
        const batch = db.batch();
        dadosUpload.forEach(item => {
            const docRef = hospitaisCollection.doc(); // Cria uma nova referência de documento com ID automático
            batch.set(docRef, item);
        });

        batch.commit().then(() => {
            alert(`${dadosUpload.length} registros foram importados com sucesso!`);
            cancelUploadBtn.click(); // Limpa a interface de upload
            carregarDadosIniciais(); // Recarrega os dados para a aba de visualização
        }).catch(error => {
            console.error("Erro no upload em lote: ", error);
            alert("Ocorreu um erro ao enviar os dados para o Firebase. Verifique o console para mais detalhes.");
        }).finally(() => {
            // Reabilita o botão após a operação
            confirmUploadBtn.disabled = false;
            confirmUploadBtn.innerHTML = '<i class="fas fa-upload"></i> Confirmar Upload';
        });
    });

    // (Cole aqui o restante do seu código JS, como a lógica das abas, formulário manual, etc.)
});
