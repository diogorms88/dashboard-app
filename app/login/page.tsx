'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { AnimatedBeamDemo } from '@/components/magicui/animated-beam-demo'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [senha, setSenha] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !senha) {
      toast.error('Por favor, preencha todos os campos')
      return
    }
    
    setIsLoading(true)

    try {
      const success = await login(username, senha)
      
      if (success) {
        toast.success('Login realizado com sucesso!')
        router.push('/dashboard')
      } else {
        toast.error('Credenciais inválidas')
      }
    } catch (error) {
      toast.error('Erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-purple-50" role="main">
      {/* Left side - Animated Beam Demo */}
      <section className="hidden lg:flex lg:flex-1 items-center justify-center p-8" aria-label="Sistema Plascar">
        <div className="max-w-2xl w-full">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Plascar
            </h1>
            <p className="text-lg text-gray-600">
              Sistema integrado de gestão industrial
            </p>
          </header>
          <AnimatedBeamDemo />
        </div>
      </section>

      {/* Right side - Login Form */}
      <section className="flex-1 flex items-center justify-center p-8" aria-labelledby="login-title">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle id="login-title" className="text-2xl font-bold">Bem-vindo</CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form 
              onSubmit={handleSubmit} 
              className="space-y-4"
              role="form"
              aria-label="Formulário de login"
              noValidate
            >
              <fieldset className="space-y-4">
                <legend className="sr-only">Credenciais de acesso</legend>
                <div className="space-y-2">
                  <Label htmlFor="username">Usuário</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    aria-required="true"
                    aria-describedby="username-error"
                    className="h-11"
                  />
                  <div id="username-error" className="sr-only" aria-live="polite">
                    {/* Error message would go here */}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    name="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    aria-required="true"
                    aria-describedby="senha-error"
                    className="h-11"
                  />
                  <div id="senha-error" className="sr-only" aria-live="polite">
                    {/* Error message would go here */}
                  </div>
                </div>
              </fieldset>
              <Button 
                type="submit" 
                className="w-full h-11" 
                disabled={isLoading}
                aria-describedby={isLoading ? "login-status" : undefined}
              >
                <span aria-hidden={isLoading ? "true" : "false"}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </span>
                {isLoading && (
                  <span id="login-status" className="sr-only" aria-live="polite">
                    Processando login, aguarde...
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}