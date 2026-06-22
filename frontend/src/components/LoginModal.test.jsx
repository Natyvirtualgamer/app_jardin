// components/LoginModal.test.jsx — Reemplaza a pages/LoginPage.test.jsx
// (esa pagina ya no existe; el login ahora es este modal).
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LoginModal from './LoginModal.jsx'
import { AuthProvider } from '../context/AuthContext.jsx'

function renderModal() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginModal onClose={() => {}} onSuccess={() => {}} />
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('LoginModal', () => {
  it('renderiza el formulario con email, password y boton de ingreso', () => {
    renderModal()
    expect(screen.getByPlaceholderText('usuario@jardin.cl')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument()
  })

  it('el campo password es de tipo password (no expone el texto)', () => {
    renderModal()
    const passwordInput = screen.getByPlaceholderText('••••••••')
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('llama a onClose al presionar el boton de cerrar', () => {
    const onClose = vi.fn()
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginModal onClose={onClose} onSuccess={() => {}} />
        </AuthProvider>
      </BrowserRouter>
    )
    screen.getByRole('button', { name: /cerrar/i }).click()
    expect(onClose).toHaveBeenCalled()
  })
})
