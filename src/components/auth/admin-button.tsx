'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAdmin } from './admin-provider'
import { Settings, LogOut } from 'lucide-react'

export function AdminButton() {
  const { isAdmin, login, logout } = useAdmin()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  const handleLogin = () => {
    if (login(password)) {
      setError('')
      setOpen(false)
      setPassword('')
    } else {
      setError('Contraseña incorrecta')
    }
  }

  const handleLogout = () => {
    logout()
  }

  if (isAdmin) {
    return (
      <Button variant="outline" onClick={handleLogout} className="fixed top-4 right-4 z-50">
        <LogOut className="w-4 h-4 mr-2" />
        Cerrar Sesión
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="fixed top-4 right-4 z-50">
          <Settings className="w-4 h-4 mr-2" />
          Administración
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Acceso de Administración</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese la contraseña"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLogin}>
              Acceder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}