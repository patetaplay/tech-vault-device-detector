import { authenticate } from '../store.js';
import { setSessionUser } from '../../core/session.js';
import { validateRequired } from '../../core/validation.js';
import { toast } from '../../components/ui.js';

export function renderLogin(): string {
  return `
    <div class="login-card">
      <h1>Login</h1>
      <p>Sistema de controle financeiro para assistência técnica.</p>
      <p class="helper">Acesso demo: <strong>admin@techvault.local / 123456</strong></p>
      <form id="loginForm" class="form-grid">
        <label>Email<input name="email" type="email" /></label>
        <label>Senha<input name="password" type="password" /></label>
        <button type="submit">Entrar</button>
      </form>
    </div>`;
}

export function bindLogin(onSuccess: () => void): void {
  document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const email = String(fd.get('email') || '');
    const password = String(fd.get('password') || '');

    if (!validateRequired([['Email', email], ['Senha', password]])) return;

    const user = authenticate(email, password);
    if (!user) return toast('Credenciais inválidas.', 'error');

    setSessionUser({ id: user.id, name: user.name, role: user.role });
    location.hash = '#/dashboard';
    onSuccess();
  });
}
