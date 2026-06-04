import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ProfileCardProps {
  player: {
    username: string
    companyName: string
    companyLevel: number
    reputation: number
    capital: bigint
    computeOwned: number
    researchPoints: number
  }
}

export function ProfileCard({ player }: ProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{player.companyName}</CardTitle>
        <p className="text-sm text-muted-foreground">@{player.username}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Level</span>
          <span className="font-medium">{player.companyLevel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Reputation</span>
          <span className="font-medium">{player.reputation}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Capital</span>
          <span className="font-medium">${player.capital.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Compute</span>
          <span className="font-medium">{player.computeOwned} TFLOPS</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Research Points</span>
          <span className="font-medium">{player.researchPoints}</span>
        </div>
      </CardContent>
    </Card>
  )
}
