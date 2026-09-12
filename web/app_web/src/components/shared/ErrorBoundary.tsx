import React, { ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.handleRetry)
      }

      return (
        <Card className="p-8 m-4">
          <div className="flex flex-col items-center justify-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-600" />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Une erreur est survenue
              </h2>
              <p className="text-slate-600 mb-4">
                {this.state.error?.message || 'Une erreur inattendue s\'est produite'}
              </p>
              <details className="text-left bg-slate-50 p-4 rounded mb-4 text-sm">
                <summary className="cursor-pointer font-mono text-slate-700">
                  Détails techniques
                </summary>
                <pre className="mt-2 text-xs text-red-600 overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={this.handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Recharger la page
              </Button>
            </div>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: Error, retry: () => void) => ReactNode
) {
  const WithErrorBoundary = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WithErrorBoundary.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WithErrorBoundary
}
