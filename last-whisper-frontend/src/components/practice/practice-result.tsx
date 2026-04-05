
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {CheckCircle, ChevronRight, XCircle} from 'lucide-react'
import {formatScore, getScoreColor} from '@/lib/utils'
import {Item} from '@/types/api'

interface PracticeResultProps {
    showResult: boolean
    lastScore: number | null
    userText: string
    currentItem: Item | null
    onNext: () => void
    onReset: () => void
}

export function PracticeResult({
                                   showResult,
                                   lastScore,
                                   userText,
                                   currentItem,
                                   onNext,
                                   onReset
                               }: PracticeResultProps) {
    return (
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showResult && lastScore !== null
                ? 'max-h-[500px] opacity-100'
                : 'max-h-0 opacity-0'
        }`}>
            {showResult && lastScore !== null && (
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            {lastScore >= 80 ? (
                                <CheckCircle className="h-5 w-5 text-green-500"/>
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500"/>
                            )}
                            <span>Result</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center space-y-4">
                            <div className="text-4xl font-bold">
              <span className={getScoreColor(lastScore)}>
                {formatScore(lastScore)}
              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Your Answer</p>
                                    <p className="font-medium">{userText}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Correct Answer</p>
                                    <p className="font-medium">{currentItem?.text}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Performance</p>
                                    <p className="font-medium">
                                        {lastScore >= 90 ? 'Excellent!' :
                                            lastScore >= 80 ? 'Good!' :
                                                lastScore >= 70 ? 'Fair' :
                                                    lastScore >= 50 ? 'Needs Practice' : 'Keep Trying!'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex space-x-2 justify-center">
                                <Button onClick={onNext}>
                                    <ChevronRight className="h-4 w-4 mr-2"/>
                                    Next Practice
                                </Button>
                                <Button variant="outline" onClick={onReset}>
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
