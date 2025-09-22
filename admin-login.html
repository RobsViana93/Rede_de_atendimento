// =========================================
// ARQUIVO: auth-protection.js
// =========================================
// Este script deve ser incluído em TODAS as páginas que você quer proteger

// Import das funções do Firebase (versão 9)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Configuração do Firebase (a mesma sempre)
const firebaseConfig = {
    apiKey: "AIzaSyBLjxxFLwx9VU23VyYpjsVjcdVB98Pzls4",
    authDomain: "rede-atendimento-planos.firebaseapp.com",
    projectId: "rede-atendimento-planos",
    storageBucket: "rede-atendimento-planos.appspot.com",
    messagingSenderId: "805398823851",
    appId: "1:805398823851:web:c8edb87faa4483490688ee"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Variável para controlar se o usuário foi verificado
let authChecked = false;

// Criar overlay de loading
function createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'auth-loading-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #000000 0%, #25020F 50%, #000000 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        color: #ECECEC;
        font-family: 'Inter', sans-serif;
    `;
    
    overlay.innerHTML = `
        <div style="text-align: center;">
            <div style="width: 50px; height: 50px; border: 4px solid #25020F; border-top: 4px solid #FF1168; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 30px;"></div>
            <h2 style="margin-bottom: 10px; color: #FF1168;">Verificando Acesso...</h2>
            <p style="color: #8F8F8F;">Aguarde um momento</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    return overlay;
}

// Mostrar overlay de loading
function showLoading() {
    const existingOverlay = document.getElementById('auth-loading-overlay');
    if (existingOverlay) return;
    
    const overlay = createLoadingOverlay();
    document.body.appendChild(overlay);
    
    // Esconder conteúdo da página
    document.body.style.overflow = 'hidden';
}

// Esconder overlay de loading
function hideLoading() {
    const overlay = document.getElementById('auth-loading-overlay');
    if (overlay) {
        overlay.remove();
        document.body.style.overflow = 'auto';
    }
}

// Redirecionar para página de login
function redirectToLogin() {
    hideLoading();
    window.location.href = 'admin-login.html'; // Nome do arquivo de login do admin
}

// Adicionar botão de logout (opcional)
function addLogoutButton() {
    // Verificar se já existe
    if (document.getElementById('auth-logout-btn')) return;
    
    // Criar botão de logout
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'auth-logout-btn';
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair';
    logoutBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #9E1E4C;
        color: #ECECEC;
        border: 2px solid #FF1168;
        padding: 10px 20px;
        border-radius: 25px;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    
    logoutBtn.addEventListener('mouseover', () => {
        logoutBtn.style.background = '#FF1168';
        logoutBtn.style.transform = 'translateY(-2px)';
        logoutBtn.style.boxShadow = '0 5px 15px rgba(255, 17, 104, 0.4)';
    });
    
    logoutBtn.addEventListener('mouseout', () => {
        logoutBtn.style.background = '#9E1E4C';
        logoutBtn.style.transform = 'translateY(0)';
        logoutBtn.style.boxShadow = 'none';
    });
    
    logoutBtn.addEventListener('click', async () => {
        if (confirm('Tem certeza que deseja sair?')) {
            try {
                await signOut(auth);
                redirectToLogin();
            } catch (error) {
                console.error('Erro no logout:', error);
                alert('Erro ao fazer logout. Tente novamente.');
            }
        }
    });
    
    document.body.appendChild(logoutBtn);
}

// Função principal de verificação de autenticação
function initAuthProtection() {
    // Mostrar loading imediatamente
    showLoading();
    
    // Configurar timeout de 10 segundos para verificação
    const authTimeout = setTimeout(() => {
        console.error('Timeout na verificação de autenticação');
        redirectToLogin();
    }, 10000);
    
    // Verificar estado de autenticação
    onAuthStateChanged(auth, (user) => {
        clearTimeout(authTimeout);
        authChecked = true;
        
        if (user) {
            // Usuário autenticado
            console.log('Usuário autenticado:', user.email);
            hideLoading();
            addLogoutButton();
            
            // Disparar evento personalizado para informar que o usuário está logado
            const authEvent = new CustomEvent('userAuthenticated', { 
                detail: { user: user } 
            });
            document.dispatchEvent(authEvent);
            
        } else {
            // Usuário não autenticado
            console.log('Usuário não autenticado');
            redirectToLogin();
        }
    }, (error) => {
        console.error('Erro na verificação de autenticação:', error);
        clearTimeout(authTimeout);
        redirectToLogin();
    });
}

// Função para obter o usuário atual
export function getCurrentUser() {
    return auth.currentUser;
}

// Função para fazer logout
export async function logout() {
    try {
        await signOut(auth);
        redirectToLogin();
    } catch (error) {
        console.error('Erro no logout:', error);
        throw error;
    }
}

// Inicializar proteção quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthProtection);
} else {
    initAuthProtection();
}

// Verificação adicional caso o Firebase demore muito
setTimeout(() => {
    if (!authChecked) {
        console.warn('Verificação de auth demorou muito, redirecionando...');
        redirectToLogin();
    }
}, 15000);
