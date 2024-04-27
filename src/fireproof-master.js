import { fireproof } from '@fireproof/core/node'

const db = fireproof('music-app')

await db.put({ _id: 'beyonce', name: 'Beyoncé', hitSingles: 29 })

db.subscribe(async () => {
  const topArtists = await db.query("hitSingles", { range: [30, Infinity] })
  // redraw the UI with the new topArtists
})

const beyonceDoc = await db.get('beyonce')
beyonceDoc.hitSingles += 1
await db.put(beyonceDoc)

console.log('Beyoncé now has', beyonceDoc.hitSingles, 'hit singles')