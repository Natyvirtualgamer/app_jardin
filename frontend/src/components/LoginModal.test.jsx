// components/LoginModal.test.jsx — Reemplaza a pages/LoginPage.test.jsx
// (esa pagina ya no existe; el login ahora es este modal con pestañas).
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LoginModal from './LoginModal.jsx'
import { AuthProvider } from '../context/AuthContext.jsx'

function renderModal(props = {}) {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginModal onClose={() => {}} onSuccess={() => {}} {...props} />
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
    renderModal({ onClose })
    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('muestra el link de registro solo en la pestaña de familias', () => {
    renderModal()
    expect(screen.queryByText(/regístrate/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /ingreso familias/i }))
    expect(screen.getByText(/regístrate/i)).toBeInTheDocument()
  })

  it('cambia a la vista de recuperar contraseña', () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: /olvidaste tu contraseña/i }))
    expect(screen.getByRole('button', { name: /enviar solicitud/i })).toBeInTheDocument()
  })

  it('el flujo de registro pide confirmar contraseña', () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: /ingreso familias/i }))
    fireEvent.click(screen.getByRole('button', { name: /regístrate/i }))
    expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument()
  })
})
