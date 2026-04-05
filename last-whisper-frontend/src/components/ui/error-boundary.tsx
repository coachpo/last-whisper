
import React from 'react'
import {Button} from './button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from './card'
import {debug} from '@/lib/debug'

interface ErrorBoundaryState {
    hasError: boolean
    error?: Error
}

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = {hasError: false}
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {hasError: true, error}
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        debug.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    resetError = () => {
        this.setState({hasError: false, error: undefined})
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback
                return <FallbackComponent error={this.state.error} resetError={this.resetError}/>
            }

            return (
                <Card className="m-4">
                    <CardHeader>
                        <CardTitle>Something went wrong</CardTitle>
                        <CardDescription>
                            An error occurred while loading the data. Please try refreshing the page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {this.state.error && (
                                <div className="text-sm text-muted-foreground">
                                    <strong>Error:</strong> {this.state.error.message}
                                </div>
                            )}
                            <div className="flex space-x-2">
                                <Button onClick={this.resetError} variant="outline">
                                    Try Again
                                </Button>
                                <Button onClick={() => window.location.reload()}>
                                    Refresh Page
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )
        }

        return this.props.children
    }
}
