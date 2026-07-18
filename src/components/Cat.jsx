export default function Cat({ mood = 'idle', reaction = 'none', onInteract }) {
  const talking = mood === 'speaking'
  const listening = mood === 'listening'
  const happy = mood === 'happy' || mood === 'giggling' || mood === 'waving' || mood === 'dancing'
  const surprised = mood === 'surprised'

  function interact(part) {
    onInteract?.(part)
  }

  return (
    <div
      className={`cat-stage mood-${mood} reaction-${reaction}`}
      role="group"
      aria-label="Play with Mochi the cat"
    >
      <span className="sparkle sparkle-one">✦</span>
      <span className="sparkle sparkle-two">✦</span>
      <span className="cat-shadow" />
      <span className="cat-tail" />
      <span className="cat-body">
        <span className="belly" />
        <span className="paw paw-left" />
        <span className="paw paw-right" />
      </span>
      <span className="cat-head">
        <span className="ear ear-left"><span /></span>
        <span className="ear ear-right"><span /></span>
        <span className="face">
          <span className={`eye eye-left ${happy ? 'happy-eye' : ''} ${surprised ? 'surprised-eye' : ''}`}><i /></span>
          <span className={`eye eye-right ${happy ? 'happy-eye' : ''} ${surprised ? 'surprised-eye' : ''}`}><i /></span>
          <span className="cheek cheek-left" />
          <span className="cheek cheek-right" />
          <span className="nose" />
          <span className={`mouth ${talking ? 'talking' : ''}`} />
          <span className="whisker whisker-l1" />
          <span className="whisker whisker-l2" />
          <span className="whisker whisker-r1" />
          <span className="whisker whisker-r2" />
        </span>
      </span>
      {listening && <span className="listen-ring" />}

      <button className="pet-zone pet-zone-head" type="button" onClick={() => interact('head')} aria-label="Pet Mochi's head" />
      <button className="pet-zone pet-zone-belly" type="button" onClick={() => interact('belly')} aria-label="Tickle Mochi's belly" />
      <button className="pet-zone pet-zone-paw-left" type="button" onClick={() => interact('paws')} aria-label="Tap Mochi's left paw" />
      <button className="pet-zone pet-zone-paw-right" type="button" onClick={() => interact('paws')} aria-label="Tap Mochi's right paw" />
      <button className="pet-zone pet-zone-tail" type="button" onClick={() => interact('tail')} aria-label="Tap Mochi's tail" />

      <span className="pet-label">Try my head, belly, paws, and tail!</span>
    </div>
  )
}
