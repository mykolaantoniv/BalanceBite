'use client'

import { useState } from 'react'
import { useZakazStore } from '@/store'

interface Props {
  onClose: () => void
  onConnected: () => void
}

export function AuchanConnectModal({ onClose, onConnected }: Props) {
  const { setConnected } = useZakazStore()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/zakaz/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Помилка підключення')
        setLoading(false)
        return
      }

      setConnected(true)
      onConnected()
    } catch {
      setError('Мережева помилка. Спробуйте ще раз.')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-sm p-7 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Auchan logo placeholder */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <div>
            <h2 className="font-display font-bold text-stone-800">Підключити Auchan</h2>
            <p className="text-xs text-stone-400">auchan.zakaz.ua</p>
          </div>
        </div>

        <p className="text-sm text-stone-500 mb-5 leading-relaxed">
          Введіть дані від вашого акаунта на{' '}
          <a href="https://auchan.zakaz.ua" target="_blank" className="text-brand-600 hover:underline">
            auchan.zakaz.ua
          </a>
          . Ваш пароль не зберігається — лише тимчасовий токен сесії.
        </p>

        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">
              Номер телефону
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+380XXXXXXXXX"
              className="input"
              required
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Підключення...
              </span>
            ) : (
              'Підключити акаунт'
            )}
          </button>
        </form>

        <p className="text-xs text-stone-400 text-center mt-4">
          🔒 Ваш пароль надсилається напряму на zakaz.ua і не зберігається на наших серверах
        </p>
      </div>
    </div>
  )
}
