// LoginPage.test.jsx — Vitest + Testing Library
// Smoke test: el formulario de login renderiza sus campos clave.
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LoginPage from './LoginPage.jsx'
import { AuthProvider } from '../context/AuthContext.jsx'

function renderLoginPage() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('LoginPage', () => {
  it('renderiza el formulario con email, password y boton de ingreso', () => {
    renderLoginPage()
    expect(screen.getByPlaceholderText('usuario@jardin.cl')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument()
  })

  it('el campo password es de tipo password (no expone el texto)', () => {
    renderLoginPage()
    const passwordInput = screen.getByPlaceholderText('••••••••')
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})
