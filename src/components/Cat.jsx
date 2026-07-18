export default function Cat({ mood = 'idle', onPet }) {
  const talking = mood === 'speaking'
  const listening = mood === 'listening'
  const happy = mood === 'happy'

  return (
    <button
      type="button"
      className={`cat-stage mood-${mood}`}
      onClick={onPet}
      aria-label="Pet Mochi the cat"
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
          <span className={`eye eye-left ${happy ? 'happy-eye' : ''}`}><i /></span>
          <span className={`eye eye-right ${happy ? 'happy-eye' : ''}`}><i /></span>
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
      <span className="pet-label">Tap to pet me!</span>
    </button>
  )
}
