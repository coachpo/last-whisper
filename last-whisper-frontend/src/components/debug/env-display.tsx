import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function EnvDisplay() {
  const isDebugEnabled = import.meta.env.VITE_DEBUG_LOGGING === 'true' ||
                        import.meta.env.DEV

  if (!isDebugEnabled) {
    return null
  }

  const envVars = {
    'VITE_DEBUG_LOGGING': import.meta.env.VITE_DEBUG_LOGGING,
    'MODE': import.meta.env.MODE,
    'DEV': String(import.meta.env.DEV),
    'PROD': String(import.meta.env.PROD),
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>Environment Variables</CardTitle>
        <CardDescription>
          Build-time environment variables from Vite
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-2 border rounded">
              <span className="font-mono text-sm">{key}</span>
              <Badge variant={value ? "default" : "secondary"}>
                {value || 'undefined'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
